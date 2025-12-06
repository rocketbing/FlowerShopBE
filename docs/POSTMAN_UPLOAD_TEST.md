# Postman 上传图片测试指南

## 问题：alt 字段返回的是文件名而不是输入的值

### 原因

当使用 `multipart/form-data` 时，需要确保在 Postman 中正确设置字段类型。

## 正确的 Postman 设置

### 步骤 1：选择请求方法
- **方法：** POST
- **URL：** `http://localhost:3000/api/upload/product-image`

### 步骤 2：设置 Headers
- **Authorization：** `Bearer YOUR_TOKEN`
- **不要手动设置 Content-Type！** Postman 会自动设置

### 步骤 3：设置 Body

1. 选择 **Body** 标签
2. 选择 **form-data**（不是 x-www-form-urlencoded）
3. 添加以下字段：

| Key | Type | Value | 说明 |
|-----|------|-------|------|
| `image` | **File** | 选择图片文件 | 必需，类型必须是 **File** |
| `alt` | **Text** | `flower photo sample` | 可选，类型必须是 **Text** |
| `productName` | **Text** | `Red Roses Bouquet` | 可选，类型必须是 **Text** |

### 重要提示

1. **字段名必须完全匹配：**
   - `image` - 文件字段（类型：File）
   - `alt` - 文本字段（类型：Text）
   - `productName` - 文本字段（类型：Text）

2. **字段类型必须正确：**
   - `image` 必须是 **File** 类型
   - `alt` 和 `productName` 必须是 **Text** 类型

3. **不要使用 x-www-form-urlencoded：**
   - 必须使用 **form-data** 才能上传文件

## 常见错误

### ❌ 错误 1：使用 x-www-form-urlencoded
```
Body → x-www-form-urlencoded
```
**问题：** 无法上传文件

### ❌ 错误 2：字段类型错误
```
Key: alt
Type: File  ❌ 错误！应该是 Text
```

### ❌ 错误 3：字段名拼写错误
```
Key: Alt  ❌ 错误！应该是 alt（小写）
Key: ALT  ❌ 错误！应该是 alt（小写）
```

### ✅ 正确设置

```
Body → form-data

Key: image
Type: File
Value: [选择图片文件]

Key: alt
Type: Text
Value: flower photo sample

Key: productName
Type: Text
Value: Red Roses Bouquet
```

## 测试步骤

1. **打开 Postman**
2. **创建新请求**
   - Method: POST
   - URL: `http://localhost:3000/api/upload/product-image`
3. **设置 Authorization**
   - Type: Bearer Token
   - Token: 你的 JWT token
4. **设置 Body**
   - 选择 `form-data`
   - 添加字段：
     - `image` (File) - 选择图片
     - `alt` (Text) - 输入 `flower photo sample`
     - `productName` (Text) - 可选
5. **发送请求**
6. **检查响应**

## 预期响应

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/...",
    "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/...?X-Amz-Algorithm=...",
    "key": "products/...",
    "alt": "flower photo sample",  // ✅ 应该是你输入的值
    "size": 245678,
    "mimetype": "image/jpeg"
  }
}
```

## 如果还是返回文件名

### 检查 1：查看服务器日志

代码中已添加调试日志，检查服务器控制台输出：

```
📝 Upload request body: {
  productName: '...',
  alt: 'flower photo sample',  // 检查这里是否有值
  altText: 'flower photo sample',
  originalName: 'image.jpg'
}
```

### 检查 2：验证 Postman 设置

1. 确保 `alt` 字段的 **Type** 是 **Text**（不是 File）
2. 确保字段名是 `alt`（小写，完全匹配）
3. 确保 Value 有内容（不是空字符串）

### 检查 3：使用 curl 测试

```bash
curl -X POST http://localhost:3000/api/upload/product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "alt=flower photo sample" \
  -F "productName=Red Roses Bouquet"
```

如果 curl 可以正常工作，说明问题在 Postman 的设置上。

## 代码修复

代码已更新，现在会：
1. 检查 `req.body.alt` 是否存在且不为空
2. 使用 `trim()` 去除空格
3. 如果 `alt` 为空或未提供，才使用文件名
4. 添加调试日志帮助排查问题

## 调试技巧

如果问题仍然存在，可以在控制器中添加更多日志：

```javascript
console.log('req.body:', req.body);
console.log('req.body.alt:', req.body.alt);
console.log('typeof req.body.alt:', typeof req.body.alt);
console.log('file.originalname:', file.originalname);
```

这样可以确认 `req.body.alt` 是否正确接收。

