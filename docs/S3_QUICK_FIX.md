# S3 公开访问快速修复指南

## 问题
上传的图片 URL 返回 `AccessDenied` 错误。

## 快速修复（5分钟）

### 步骤 1：配置 Bucket Policy

1. 登录 [AWS Console](https://console.aws.amazon.com/)
2. 进入 **S3** 服务
3. 点击 bucket：**faux-flower-supply**
4. 点击 **Permissions** 标签
5. 滚动到 **Bucket policy** 部分
6. 点击 **Edit**
7. 粘贴以下 JSON（复制整个内容）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::faux-flower-supply/*"
    }
  ]
}
```

8. 点击 **Save changes**

### 步骤 2：关闭 Block Public Access

1. 在同一个 **Permissions** 页面
2. 找到 **Block public access (bucket settings)** 部分
3. 点击 **Edit**
4. **取消勾选**以下两个选项：
   - ✅ **Block public access to buckets and objects granted through new access control lists (ACLs)**
   - ✅ **Block public access to buckets and objects granted through any access control lists (ACLs)**
5. 点击 **Save changes**
6. 在确认对话框中输入 `confirm`
7. 点击 **Confirm**

### 步骤 3：验证

在浏览器中打开你的图片 URL：
```
https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1764850697422-ce52da5987adf8aa-WechatIMG79.jpeg
```

应该可以正常显示图片了！

## 如果还是不行

### 检查 IAM 权限

确保你的 IAM 用户 `Faux_Flower_Backend` 有以下权限：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::faux-flower-supply",
        "arn:aws:s3:::faux-flower-supply/*"
      ]
    }
  ]
}
```

### 重新上传文件

配置完成后，新上传的文件会自动有公开访问权限。对于已经上传的文件，你可以：

1. 在 S3 Console 中选择文件
2. 点击 **Actions** → **Make public using ACL**
3. 或者重新上传文件

## 更安全的配置（只允许 products 文件夹公开）

如果你只想让 `products/` 文件夹公开访问，使用这个 Bucket Policy：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::faux-flower-supply/products/*"
    }
  ]
}
```

这样只有 `products/` 文件夹下的文件可以公开访问，其他文件夹保持私有。

