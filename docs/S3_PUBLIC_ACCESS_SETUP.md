# S3 公开访问配置指南

## 问题：AccessDenied 错误

当你在浏览器中打开 S3 图片 URL 时，如果看到 `AccessDenied` 错误，说明 S3 bucket 或文件没有配置公开访问权限。

## 解决方案

有两种方法可以让 S3 文件公开访问：

### 方案 1：使用 ACL（推荐，已自动配置）

代码已经在上传时设置了 `ACL: 'public-read'`，但需要确保：

1. **IAM 用户权限**
   - IAM 用户需要 `s3:PutObjectAcl` 权限
   - 在 IAM 策略中添加：
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "s3:PutObject",
       "s3:PutObjectAcl",
       "s3:GetObject",
       "s3:DeleteObject"
     ],
     "Resource": [
       "arn:aws:s3:::faux-flower-supply/*"
     ]
   }
   ```

2. **Bucket ACL 设置**
   - 在 S3 Console 中，进入 bucket 设置
   - 找到 "Block public access" 设置
   - 确保允许公共访问（或至少允许通过 ACL 的公共访问）

### 方案 2：配置 Bucket Policy（更安全，推荐用于生产环境）

如果方案 1 不工作，或者你想更精细地控制访问权限，可以使用 Bucket Policy。

#### 步骤 1：在 AWS S3 Console 配置

1. 登录 AWS Console
2. 进入 S3 服务
3. 选择你的 bucket：`faux-flower-supply`
4. 点击 "Permissions" 标签
5. 在 "Bucket policy" 部分，点击 "Edit"
6. 添加以下策略（替换 `YOUR_ACCOUNT_ID` 为你的 AWS 账户 ID）：

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

**完整版本（允许所有公开文件）：**
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

#### 步骤 2：关闭 Block Public Access（如果需要）

1. 在同一个 "Permissions" 页面
2. 找到 "Block public access" 设置
3. 点击 "Edit"
4. 取消勾选以下选项（根据你的需求）：
   - ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
5. 点击 "Save changes"
6. 确认更改

**⚠️ 注意：** 关闭 Block Public Access 会让你的 bucket 可以公开访问。确保你只允许必要的文件公开。

#### 步骤 3：验证配置

上传一个新文件，然后在浏览器中打开 URL，应该可以正常访问。

### 方案 3：使用 CloudFront（高级，推荐用于生产环境）

对于生产环境，建议使用 CloudFront CDN：
- 更好的性能
- 更低的成本
- 更安全的访问控制
- 支持 HTTPS

## 快速修复步骤（推荐）

### 方法 A：使用 Bucket Policy（最简单）

1. **登录 AWS Console** → S3 → 选择 `faux-flower-supply` bucket
2. **Permissions** → **Bucket policy** → **Edit**
3. **粘贴以下策略：**
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
4. **Save changes**
5. **Permissions** → **Block public access** → **Edit**
6. **取消勾选：**
   - ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
7. **Save changes** 并确认

### 方法 B：只允许 products 文件夹公开访问（更安全）

如果你只想让 `products/` 文件夹公开访问：

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

## 验证配置

配置完成后，测试访问：

```bash
# 测试你的图片 URL
curl -I https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1764850697422-ce52da5987adf8aa-WechatIMG79.jpeg
```

应该返回 `200 OK` 而不是 `403 Forbidden`。

## 常见问题

### Q: 为什么需要公开访问？

A: 产品图片需要在网站前端显示，用户需要能够直接访问这些图片 URL。

### Q: 安全吗？

A: 如果只允许 `s3:GetObject` 操作，用户只能读取文件，不能修改或删除。这是安全的。

### Q: 如何限制只允许特定文件类型？

A: 可以在 Bucket Policy 中使用条件：
```json
{
  "Condition": {
    "StringEquals": {
      "s3:x-amz-server-side-encryption": "AES256"
    }
  }
}
```

或者限制文件扩展名：
```json
{
  "Condition": {
    "StringLike": {
      "s3:key": "products/*.jpg"
    }
  }
}
```

### Q: 上传新文件后还是 AccessDenied？

A: 检查：
1. Bucket Policy 是否正确配置
2. Block Public Access 是否已关闭
3. IAM 用户是否有 `s3:PutObjectAcl` 权限
4. 文件路径是否匹配策略中的 Resource（如 `products/*`）

## 生产环境建议

对于生产环境，建议：

1. **使用 CloudFront CDN**
   - 更好的性能和缓存
   - 支持 HTTPS
   - 可以设置访问控制

2. **限制访问范围**
   - 只允许 `products/*` 路径公开
   - 其他路径保持私有

3. **监控访问**
   - 使用 CloudWatch 监控 S3 访问
   - 设置告警

4. **定期审查**
   - 定期检查公开访问的文件
   - 删除不需要的文件

## 相关文档

- [AWS S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [AWS S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/)

