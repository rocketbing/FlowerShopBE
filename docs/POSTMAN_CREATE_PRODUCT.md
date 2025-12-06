# Postman 创建产品指南（包含图片）

## 步骤详解

### 步骤 1：创建新请求

1. 打开 Postman
2. 点击 **New** → **HTTP Request**
3. 或者点击 **+** 号创建新标签页

### 步骤 2：设置请求方法

- **方法：** 选择 **POST**
- **URL：** `http://localhost:3000/api/products`
  - 如果部署在其他服务器，替换为对应的 URL

### 步骤 3：设置 Authorization（认证）

1. 点击 **Authorization** 标签
2. **Type：** 选择 **Bearer Token**
3. **Token：** 输入你的 JWT token
   - 可以从登录 API 获取
   - 格式：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**或者：**

1. 点击 **Headers** 标签
2. 添加 Header：
   - **Key：** `Authorization`
   - **Value：** `Bearer YOUR_TOKEN_HERE`

### 步骤 4：设置 Body（重要！）

1. 点击 **Body** 标签
2. **重要：** 选择 **form-data**（不是 x-www-form-urlencoded 或 raw）
3. 添加以下字段：

#### 必需字段

| Key | Type | Value | 说明 |
|-----|------|-------|------|
| `name` | **Text** | `Red Roses Bouquet` | 产品名称 |
| `description` | **Text** | `Beautiful red roses arranged in a bouquet` | 产品描述 |
| `stems` | **Text** | `12` | 花的头数（数字转字符串） |
| `color` | **Text** | `red` | 颜色 |
| `regularPrice` | **Text** | `49.99` | 正常价格（数字转字符串） |
| `quantity` | **Text** | `10` | 数量（数字转字符串） |
| `category` | **Text** | `roses` | 分类（必须是：roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other） |

#### 可选字段

| Key | Type | Value | 说明 |
|-----|------|-------|------|
| `image` | **File** | [选择图片文件] | 产品图片（重要：类型必须是 File） |
| `alt` | **Text** | `Red roses bouquet` | 图片描述（可选） |
| `discountedPrice` | **Text** | `39.99` | 折扣价格（可选） |
| `popularity` | **Text** | `4` | 流行程度 1-5（可选，默认 3） |

### 步骤 5：添加图片文件

1. 在 Body 的 form-data 中，找到 `image` 字段
2. **重要：** 确保 `image` 字段的 **Type** 是 **File**（不是 Text）
3. 点击 **Select Files** 或 **Choose Files**
4. 选择你的图片文件（支持 JPEG, PNG, WebP, GIF，最大 10MB）

### 步骤 6：完整示例

#### 字段设置示例

```
Body → form-data

Key: name
Type: Text
Value: Red Roses Bouquet

Key: description
Type: Text
Value: Beautiful red roses arranged in a bouquet

Key: stems
Type: Text
Value: 12

Key: color
Type: Text
Value: red

Key: regularPrice
Type: Text
Value: 49.99

Key: quantity
Type: Text
Value: 10

Key: category
Type: Text
Value: roses

Key: image
Type: File  ← 重要：必须是 File 类型
Value: [选择图片文件，例如：red-roses.jpg]

Key: alt
Type: Text
Value: Red roses bouquet

Key: discountedPrice
Type: Text
Value: 39.99

Key: popularity
Type: Text
Value: 4
```

### 步骤 7：发送请求

1. 点击右上角的 **Send** 按钮
2. 等待响应

### 步骤 8：查看响应

#### 成功响应（201 Created）

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Red Roses Bouquet",
    "description": "Beautiful red roses arranged in a bouquet",
    "stems": 12,
    "color": "red",
    "regularPrice": 49.99,
    "discountedPrice": 39.99,
    "quantity": 10,
    "popularity": 4,
    "category": "roses",
    "images": {
      "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1764992949924-5c6e3bb04004c8d-red-roses.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1764992949924-5c6e3bb04004c8d-red-roses.jpg?X-Amz-Algorithm=...",
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1764992949924-5c6e3bb04004c8d-red-roses.jpg",
      "alt": "Red roses bouquet"
    },
    "isAvailable": true,
    "numReviews": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 错误响应示例

**401 Unauthorized（未授权）**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```
**解决：** 检查 Authorization token 是否正确

**403 Forbidden（禁止访问）**
```json
{
  "success": false,
  "message": "User role admin is not authorized to access this route"
}
```
**解决：** 确保你的用户角色是 admin

**400 Bad Request（请求错误）**
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
}
```
**解决：** 检查图片格式是否正确

## 常见错误和解决方法

### ❌ 错误 1：Field name missing

**错误信息：**
```json
{
  "success": false,
  "message": "Field name missing"
}
```

**原因：** 图片字段名不是 `image`

**解决：**
- 确保字段名是 `image`（小写，完全匹配）
- 确保 Type 是 **File**（不是 Text）

### ❌ 错误 2：File size too large

**错误信息：**
```json
{
  "success": false,
  "message": "File size too large. Maximum file size is 10MB."
}
```

**解决：** 压缩图片或使用更小的图片文件

### ❌ 错误 3：Invalid file type

**错误信息：**
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
}
```

**解决：** 使用支持的图片格式（JPEG, PNG, WebP, GIF）

### ❌ 错误 4：Not authorized

**错误信息：**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**解决：**
1. 检查 Authorization header 是否正确设置
2. 确保 token 没有过期
3. 重新登录获取新 token

### ❌ 错误 5：Validation Error

**错误信息：**
```json
{
  "success": false,
  "message": ["Please add a product name", "Please add a description"]
}
```

**解决：** 确保所有必需字段都已填写

## 完整 Postman 设置截图说明

### 1. 请求设置

```
Method: POST
URL: http://localhost:3000/api/products
```

### 2. Headers 设置

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**注意：** 不要手动设置 `Content-Type`，Postman 会自动设置 `multipart/form-data`

### 3. Body 设置

```
Body → form-data

字段列表：
- name (Text)
- description (Text)
- stems (Text)
- color (Text)
- regularPrice (Text)
- quantity (Text)
- category (Text)
- image (File) ← 重要
- alt (Text) [可选]
- discountedPrice (Text) [可选]
- popularity (Text) [可选]
```

## 快速测试步骤

### 1. 获取 Token（如果还没有）

**POST** `http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

**响应：**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 创建产品

按照上面的步骤设置 POST 请求，使用获取的 token。

## 分类选项

`category` 字段必须是以下值之一：
- `roses`
- `tulips`
- `lilies`
- `sunflowers`
- `orchids`
- `carnations`
- `mixed`
- `other`

## 数字字段注意事项

使用 `form-data` 时，所有数字字段都需要作为字符串发送：
- `stems`: `"12"`（不是 `12`）
- `regularPrice`: `"49.99"`（不是 `49.99`）
- `quantity`: `"10"`（不是 `10`）

后端会自动转换为数字。

## 图片组织

上传的图片会自动按产品名称组织到 S3 文件夹：
- 产品名称：`Red Roses Bouquet`
- S3 路径：`products/red-roses-bouquet/时间戳-随机字符串-文件名.jpg`

## 验证成功

创建成功后，你可以：
1. 使用 `GET /api/products/:id` 获取产品
2. 检查返回的 `presignedUrl` 是否可以访问图片
3. 在数据库中查看产品记录

## 总结

### ✅ 关键点

1. **Body 类型：** 必须选择 `form-data`
2. **图片字段：** `image` 字段的 Type 必须是 **File**
3. **Authorization：** 必须设置 Bearer Token
4. **必需字段：** name, description, stems, color, regularPrice, quantity, category
5. **数字字段：** 作为字符串发送（后端会自动转换）

### 📝 完整示例

```
POST http://localhost:3000/api/products

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body (form-data):
  name: Red Roses Bouquet
  description: Beautiful red roses
  stems: 12
  color: red
  regularPrice: 49.99
  quantity: 10
  category: roses
  image: [选择图片文件]
  alt: Red roses bouquet
  discountedPrice: 39.99
  popularity: 4
```

按照这些步骤，你就可以在 Postman 中成功创建包含图片的产品了！🎉

