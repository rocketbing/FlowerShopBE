# Presigned URL 生成机制说明

## 概述

Product 模型中的 `images` 对象只存储了 `url` 和 `alt`，**不存储 `presignedUrl`**。`presignedUrl` 是在 API 返回时**动态生成**的。

## 生成流程

### 1. 数据存储（数据库）

Product 模型中的 `images` 对象：

```javascript
// models/Product.js
images: {
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
}
```

**数据库中存储的示例：**
```json
{
  "_id": "...",
  "name": "Red Roses Bouquet",
  "images": {
    "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
    "alt": "Red roses bouquet"
  }
}
```

### 2. API 请求处理（动态生成）

当客户端请求产品数据时，控制器会动态生成 `presignedUrl`：

```javascript
// controllers/productController.js
exports.getProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  // 动态生成 Presigned URL
  const productWithPresignedUrl = await addPresignedUrlToProduct(product, 3600);
  
  res.status(200).json({
    success: true,
    data: productWithPresignedUrl, // 包含 presignedUrl
  });
};
```

### 3. Presigned URL 生成步骤

#### 步骤 1：提取 S3 Key

从 `product.images.url` 中提取 S3 对象 key：

```javascript
// utils/imageUrlHelper.js
const imageUrl = "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg";

// 提取 key
const fileKey = s3Service.extractKeyFromUrl(imageUrl);
// 结果: "products/red-roses-bouquet/123.jpg"
```

#### 步骤 2：生成 Presigned URL

使用 AWS SDK 生成签名 URL：

```javascript
// utils/s3Service.js
async getSignedUrl(fileKey, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: this.bucketName,  // "faux-flower-supply"
    Key: fileKey,             // "products/red-roses-bouquet/123.jpg"
  });

  const signedUrl = await getSignedUrl(this.s3Client, command, { 
    expiresIn: 3600  // 1小时后过期
  });
  
  return signedUrl;
}
```

#### 步骤 3：添加到响应对象

```javascript
// utils/imageUrlHelper.js
productWithPresignedUrl.images = {
  ...product.images,           // 保留原有的 url 和 alt
  presignedUrl: presignedUrl,  // 添加新生成的 presignedUrl
  originalUrl: product.images.url,  // 保留原始 URL 的副本
};
```

### 4. 最终响应

API 返回的对象：

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Red Roses Bouquet",
    "images": {
      "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "alt": "Red roses bouquet"
    }
  }
}
```

## 生成依据

### presignedUrl 是根据以下信息生成的：

1. **S3 Bucket 名称**
   - 从环境变量 `S3_BUCKET` 获取
   - 例如：`faux-flower-supply`

2. **S3 对象 Key（文件路径）**
   - 从 `product.images.url` 中提取
   - 例如：`products/red-roses-bouquet/123.jpg`

3. **AWS 凭证**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - 用于签名 URL

4. **AWS 区域**
   - 从环境变量 `AWS_REGION` 获取
   - 例如：`us-east-2`

5. **过期时间**
   - 默认：3600 秒（1小时）
   - 可以在调用时自定义

## 代码流程

```
1. 客户端请求: GET /api/products/:id
   ↓
2. 从数据库获取产品: Product.findById(id)
   ↓
3. 提取 images.url: "https://.../products/red-roses-bouquet/123.jpg"
   ↓
4. 提取 S3 Key: "products/red-roses-bouquet/123.jpg"
   ↓
5. 调用 AWS SDK: getSignedUrl(key, expiresIn)
   ↓
6. AWS SDK 使用凭证签名 URL
   ↓
7. 返回 Presigned URL: "https://.../123.jpg?X-Amz-Algorithm=..."
   ↓
8. 添加到响应对象
   ↓
9. 返回给客户端
```

## 关键点

### 1. 不存储在数据库

`presignedUrl` **不存储在数据库中**，因为：
- 有过期时间（1小时）
- 每次请求都会生成新的 URL
- 节省数据库空间

### 2. 动态生成

每次 API 请求都会：
- 从数据库读取 `images.url`
- 动态生成新的 `presignedUrl`
- 添加到响应中

### 3. 过期机制

- **默认过期时间：** 1小时（3600秒）
- **过期后：** URL 无法访问
- **解决方案：** 重新请求 API 获取新的 URL

### 4. 安全性

Presigned URL 包含：
- AWS 签名
- 过期时间
- 访问权限（只读）

## 相关代码位置

| 功能 | 文件 | 函数 |
|------|------|------|
| 提取 S3 Key | `utils/s3Service.js` | `extractKeyFromUrl()` |
| 生成 Presigned URL | `utils/s3Service.js` | `getSignedUrl()` |
| 为产品添加 Presigned URL | `utils/imageUrlHelper.js` | `addPresignedUrlToProduct()` |
| 批量处理 | `utils/imageUrlHelper.js` | `addPresignedUrlsToProducts()` |
| API 控制器 | `controllers/productController.js` | `getProduct()`, `getProducts()` |

## 示例代码

### 生成单个产品的 Presigned URL

```javascript
// utils/imageUrlHelper.js
async function addPresignedUrlToProduct(product, expiresIn = 3600) {
  // 1. 获取原始 URL
  const originalUrl = product.images.url;
  
  // 2. 提取 S3 Key
  const fileKey = s3Service.extractKeyFromUrl(originalUrl);
  // "products/red-roses-bouquet/123.jpg"
  
  // 3. 生成 Presigned URL
  const presignedUrl = await s3Service.getSignedUrl(fileKey, expiresIn);
  // "https://.../123.jpg?X-Amz-Algorithm=..."
  
  // 4. 添加到产品对象
  return {
    ...product,
    images: {
      ...product.images,
      presignedUrl: presignedUrl,
      originalUrl: originalUrl,
    }
  };
}
```

### AWS SDK 生成 Presigned URL

```javascript
// utils/s3Service.js
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async getSignedUrl(fileKey, expiresIn = 3600) {
  // 创建 GetObject 命令
  const command = new GetObjectCommand({
    Bucket: 'faux-flower-supply',
    Key: fileKey,  // "products/red-roses-bouquet/123.jpg"
  });

  // 生成签名 URL（使用 AWS 凭证自动签名）
  const signedUrl = await getSignedUrl(this.s3Client, command, { 
    expiresIn: expiresIn  // 3600 秒
  });
  
  return signedUrl;
}
```

## 总结

**presignedUrl 的生成依据：**

1. ✅ **S3 Bucket 名称** - 从环境变量获取
2. ✅ **S3 对象 Key** - 从 `product.images.url` 提取
3. ✅ **AWS 凭证** - 用于签名
4. ✅ **AWS 区域** - 从环境变量获取
5. ✅ **过期时间** - 默认 1 小时

**重要特点：**
- 🔄 动态生成，不存储在数据库
- ⏰ 有过期时间（1小时）
- 🔒 使用 AWS 凭证签名，安全可靠
- 📦 每次 API 请求都会生成新的 URL

