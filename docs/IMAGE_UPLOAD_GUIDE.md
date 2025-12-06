# 产品图片上传指南

## 概述

产品图片上传功能允许管理员通过 API 上传图片文件到 AWS S3，并将 S3 图片地址保存到数据库。

## API 端点

### 上传产品图片

**POST** `/api/upload/product-image`

**权限要求：** 管理员（Admin）

**请求格式：** `multipart/form-data`

**请求参数：**
- `image` (file, required): 图片文件（JPEG, PNG, WebP, GIF，最大 5MB）
- `alt` (string, optional): 图片的 alt 文本

**响应示例：**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1234567890-abc123-red_roses.jpg",
    "key": "products/1234567890-abc123-red_roses.jpg",
    "alt": "Red roses bouquet",
    "size": 245678,
    "mimetype": "image/jpeg"
  }
}
```

### 删除产品图片

**DELETE** `/api/upload/product-image`

**权限要求：** 管理员（Admin）

**请求体：**
```json
{
  "imageUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1234567890-abc123-red_roses.jpg"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## 前端使用示例

### 使用 Fetch API

```javascript
// 上传图片
const uploadProductImage = async (imageFile, altText = '') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (altText) {
    formData.append('alt', altText);
  }

  try {
    const response = await fetch('http://localhost:3000/api/upload/product-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Image uploaded:', data.data.url);
      return data.data.url; // 返回图片 URL
    } else {
      console.error('Upload failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// 使用示例
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const imageUrl = await uploadProductImage(file, 'Product image');
    if (imageUrl) {
      // 使用 imageUrl 创建或更新产品
      await createProduct({
        name: 'Red Roses',
        images: {
          url: imageUrl,
          alt: 'Red roses bouquet'
        },
        // ... 其他产品字段
      });
    }
  }
};
```

### 使用 Axios

```javascript
import axios from 'axios';

const uploadProductImage = async (imageFile, altText = '') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (altText) {
    formData.append('alt', altText);
  }

  try {
    const response = await axios.post(
      'http://localhost:3000/api/upload/product-image',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${yourAuthToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success) {
      return response.data.data.url;
    }
    return null;
  } catch (error) {
    console.error('Error uploading image:', error.response?.data || error.message);
    return null;
  }
};
```

### 创建产品时使用上传的图片

```javascript
// 1. 先上传图片
const imageUrl = await uploadProductImage(imageFile, 'Product image');

if (imageUrl) {
  // 2. 使用返回的 URL 创建产品
  const productData = {
    name: 'Red Roses Bouquet',
    description: 'Beautiful red roses',
    stems: 12,
    color: 'red',
    regularPrice: 49.99,
    quantity: 10,
    category: 'roses',
    images: {
      url: imageUrl,  // 使用上传返回的 URL
      alt: 'Red roses bouquet'
    }
  };

  const response = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourAuthToken}`,
    },
    body: JSON.stringify(productData),
  });

  const result = await response.json();
  console.log('Product created:', result);
}
```

## 工作流程

1. **前端上传图片**
   - 用户选择图片文件
   - 前端调用 `/api/upload/product-image` API
   - 后端接收文件并上传到 S3
   - 后端返回 S3 图片 URL

2. **保存到数据库**
   - 前端收到图片 URL
   - 前端调用创建/更新产品 API
   - 将图片 URL 保存到产品的 `images.url` 字段

3. **显示图片**
   - 前端从产品数据中读取 `images.url`
   - 使用该 URL 显示图片

## 文件限制

- **允许的文件类型：** JPEG, JPG, PNG, WebP, GIF
- **最大文件大小：** 5MB
- **存储位置：** AWS S3 bucket (`faux-flower-supply`)
- **文件路径格式：** `products/{timestamp}-{random}-{filename}.{ext}`

## 错误处理

### 常见错误

1. **400 - 没有上传文件**
   ```json
   {
     "success": false,
     "message": "No file uploaded. Please provide an image file."
   }
   ```

2. **400 - 无效的文件类型**
   ```json
   {
     "success": false,
     "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
   }
   ```

3. **400 - 文件太大**
   ```json
   {
     "success": false,
     "message": "File size too large. Maximum file size is 5MB."
   }
   ```

4. **401 - 未认证**
   ```json
   {
     "success": false,
     "message": "Not authorized to access this route"
   }
   ```

5. **403 - 权限不足**
   ```json
   {
     "success": false,
     "message": "User role user is not authorized to access this route"
   }
   ```

## 环境变量配置

确保 `.env` 文件中包含以下 AWS S3 配置：

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-2
S3_BUCKET=faux-flower-supply
```

## 注意事项

1. **权限要求：** 只有管理员（admin）角色可以上传和删除图片
2. **文件验证：** 后端会自动验证文件类型和大小
3. **唯一文件名：** 系统会自动生成唯一的文件名，避免文件名冲突
4. **S3 权限：** 确保 IAM 用户具有 `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` 权限
5. **公开访问：** 当前配置下，上传的图片 URL 是公开可访问的。如果需要私有访问，需要配置 S3 bucket policy 并使用签名 URL

## 测试

可以使用 Postman 或 curl 测试上传功能：

```bash
curl -X POST http://localhost:3000/api/upload/product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "alt=Test image"
```

