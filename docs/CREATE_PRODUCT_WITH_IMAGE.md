# 创建产品时上传图片指南

## 概述

现在创建产品的 API 支持两种方式：

1. **方式 1：multipart/form-data** - 直接上传图片文件（推荐）
2. **方式 2：application/json** - 使用已上传的图片 URL

## 方式 1：直接上传图片文件（推荐）

### API 端点

**POST** `/api/products`

**Content-Type：** `multipart/form-data`

### 请求格式

使用 `FormData` 发送请求，包含：
- 产品信息（文本字段）
- 图片文件（文件字段）

### 前端示例

#### JavaScript (Fetch API)

```javascript
async function createProductWithImage(productData, imageFile) {
  const formData = new FormData();
  
  // 添加产品信息
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('stems', productData.stems.toString());
  formData.append('color', productData.color);
  formData.append('regularPrice', productData.regularPrice.toString());
  formData.append('quantity', productData.quantity.toString());
  formData.append('category', productData.category);
  
  if (productData.discountedPrice) {
    formData.append('discountedPrice', productData.discountedPrice.toString());
  }
  if (productData.popularity) {
    formData.append('popularity', productData.popularity.toString());
  }
  
  // 添加图片文件（可选，如果提供会直接上传到 S3）
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  // 添加图片描述（可选）
  if (productData.imageAlt) {
    formData.append('alt', productData.imageAlt);
  }

  const response = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // 不要设置 Content-Type，浏览器会自动设置
    },
    body: formData,
  });

  const result = await response.json();
  return result;
}

// 使用示例
const productData = {
  name: 'Red Roses Bouquet',
  description: 'Beautiful red roses',
  stems: 12,
  color: 'red',
  regularPrice: 49.99,
  quantity: 10,
  category: 'roses',
  imageAlt: 'Red roses bouquet',
};

const imageFile = document.getElementById('imageInput').files[0];

const result = await createProductWithImage(productData, imageFile);
console.log('Product created:', result.data);
```

#### React 示例

```jsx
import React, { useState } from 'react';

function CreateProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stems: 12,
    color: '',
    regularPrice: 0,
    quantity: 1,
    category: 'roses',
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      
      // 添加所有产品字段
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key].toString());
        }
      });
      
      // 添加图片文件
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Product created successfully!');
        // 重置表单
        setFormData({...});
        setImageFile(null);
      } else {
        alert('Failed to create product: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      
      {/* 其他字段... */}
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

### Postman 设置

1. **方法：** POST
2. **URL：** `http://localhost:3000/api/products`
3. **Headers：**
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body：** 选择 `form-data`
5. **添加字段：**

| Key | Type | Value | 说明 |
|-----|------|-------|------|
| `image` | **File** | 选择图片文件 | 可选（如果提供会直接上传） |
| `name` | **Text** | `Red Roses Bouquet` | 必需 |
| `description` | **Text** | `Beautiful red roses` | 必需 |
| `stems` | **Text** | `12` | 必需（数字转字符串） |
| `color` | **Text** | `red` | 必需 |
| `regularPrice` | **Text** | `49.99` | 必需（数字转字符串） |
| `quantity` | **Text** | `10` | 必需（数字转字符串） |
| `category` | **Text** | `roses` | 必需 |
| `discountedPrice` | **Text** | `39.99` | 可选 |
| `popularity` | **Text** | `4` | 可选 |
| `alt` | **Text** | `Red roses bouquet` | 可选（图片描述） |

## 方式 2：使用已上传的图片 URL

### API 端点

**POST** `/api/products`

**Content-Type：** `application/json`

### 请求格式

```json
{
  "name": "Red Roses Bouquet",
  "description": "Beautiful red roses",
  "stems": 12,
  "color": "red",
  "regularPrice": 49.99,
  "quantity": 10,
  "category": "roses",
  "images": {
    "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
    "alt": "Red roses bouquet"
  }
}
```

### 前端示例

```javascript
// 先上传图片
const uploadResponse = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: uploadFormData,
});
const { data: uploadData } = await uploadResponse.json();

// 然后创建产品（使用上传返回的 URL）
const productData = {
  name: 'Red Roses Bouquet',
  description: 'Beautiful red roses',
  stems: 12,
  color: 'red',
  regularPrice: 49.99,
  quantity: 10,
  category: 'roses',
  images: {
    url: uploadData.url,  // 使用上传返回的 URL
    alt: uploadData.alt,
  },
};

const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(productData),
});
```

## 两种方式对比

| 特性 | 方式 1：multipart/form-data | 方式 2：application/json |
|------|---------------------------|-------------------------|
| **请求次数** | 1 次 | 2 次（先上传图片，再创建产品） |
| **复杂度** | 简单 | 稍复杂 |
| **推荐度** | ⭐⭐⭐⭐⭐ 推荐 | ⭐⭐⭐ |
| **适用场景** | 创建新产品时上传图片 | 已有图片 URL 或需要先上传 |

## 工作流程

### 方式 1：一步完成（推荐）

```
前端 → POST /api/products (multipart/form-data)
  ↓
后端 → 上传图片到 S3
  ↓
后端 → 创建产品（使用上传的图片 URL）
  ↓
返回 → 产品数据（包含 Presigned URL）
```

### 方式 2：两步完成

```
前端 → POST /api/upload/product-image
  ↓
返回 → 图片 URL
  ↓
前端 → POST /api/products (JSON with image URL)
  ↓
返回 → 产品数据
```

## 响应格式

两种方式返回的响应格式相同：

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Red Roses Bouquet",
    "images": {
      "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=...",
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "alt": "Red roses bouquet"
    },
    // ... 其他产品字段
  }
}
```

## 注意事项

### 1. 数字字段处理

使用 `multipart/form-data` 时，所有字段都是字符串，后端会自动转换：

```javascript
// 前端发送字符串
formData.append('stems', '12');
formData.append('regularPrice', '49.99');

// 后端自动转换为数字
stems: 12
regularPrice: 49.99
```

### 2. 图片文件可选

- 如果提供了 `image` 文件，会直接上传到 S3
- 如果没有提供 `image` 文件，必须提供 `images.url`（JSON 格式）

### 3. 图片组织

如果提供了 `name` 字段，图片会按产品名称组织到对应文件夹：

```
products/red-roses-bouquet/1764992949924-5c6e3bb04004c8d-Flower_Sample.png
```

### 4. 错误处理

```javascript
try {
  const response = await fetch('/api/products', {...});
  const result = await response.json();
  
  if (!result.success) {
    console.error('Error:', result.message);
    // 处理错误
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## 完整示例

### React 完整组件

```jsx
import React, { useState } from 'react';

function CreateProduct() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stems: 12,
    color: '',
    regularPrice: 0,
    quantity: 1,
    category: 'roses',
    discountedPrice: null,
    popularity: 3,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageAlt, setImageAlt] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      
      // 产品基本信息
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('stems', formData.stems.toString());
      formDataToSend.append('color', formData.color);
      formDataToSend.append('regularPrice', formData.regularPrice.toString());
      formDataToSend.append('quantity', formData.quantity.toString());
      formDataToSend.append('category', formData.category);
      
      if (formData.discountedPrice) {
        formDataToSend.append('discountedPrice', formData.discountedPrice.toString());
      }
      if (formData.popularity) {
        formDataToSend.append('popularity', formData.popularity.toString());
      }
      
      // 图片文件
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // 图片描述
      if (imageAlt) {
        formDataToSend.append('alt', imageAlt);
      }

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Product created successfully!');
        // 重置表单
        setFormData({...});
        setImageFile(null);
        setImageAlt('');
      } else {
        alert('Failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        required
      />
      
      <input
        type="number"
        placeholder="Stems"
        value={formData.stems}
        onChange={(e) => setFormData({...formData, stems: parseInt(e.target.value)})}
        required
      />
      
      <input
        type="text"
        placeholder="Color"
        value={formData.color}
        onChange={(e) => setFormData({...formData, color: e.target.value})}
        required
      />
      
      <input
        type="number"
        step="0.01"
        placeholder="Regular Price"
        value={formData.regularPrice}
        onChange={(e) => setFormData({...formData, regularPrice: parseFloat(e.target.value)})}
        required
      />
      
      <input
        type="number"
        placeholder="Quantity"
        value={formData.quantity}
        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
        required
      />
      
      <select
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
        required
      >
        <option value="roses">Roses</option>
        <option value="tulips">Tulips</option>
        {/* ... 其他分类 */}
      </select>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      
      <input
        type="text"
        placeholder="Image description (optional)"
        value={imageAlt}
        onChange={(e) => setImageAlt(e.target.value)}
      />
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

## 总结

### ✅ 推荐使用方式 1（multipart/form-data）

**优势：**
- 一次请求完成所有操作
- 代码更简单
- 用户体验更好

**使用场景：**
- 创建新产品时上传图片
- 需要一步完成的操作

### 方式 2（application/json）仍然可用

**使用场景：**
- 已有图片 URL
- 需要先上传图片再创建产品
- 批量创建产品

两种方式都已支持，可以根据需求选择！

