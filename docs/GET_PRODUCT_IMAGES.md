# 获取产品图片 API 指南

## 概述

前端有多种方式可以获取产品的图片，所有方式都会自动返回 Presigned URL（1小时内有效）。

## 方法 1：获取单个产品（推荐）

### API 端点

**GET** `/api/products/:id`

根据产品 ID 获取单个产品信息，包含图片的 Presigned URL。

### 请求示例

```javascript
// 使用产品 ID
const productId = '507f1f77bcf86cd799439011';
const response = await fetch(`http://localhost:3000/api/products/${productId}`);
const { data: product } = await response.json();

// 使用图片
const imageUrl = product.images.presignedUrl;
console.log('图片 URL:', imageUrl);
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Red Roses Bouquet",
    "description": "Beautiful red roses",
    "images": {
      "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=...",
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "alt": "Red roses bouquet"
    },
    "regularPrice": 49.99,
    // ... 其他产品字段
  }
}
```

### React 示例

```jsx
import React, { useState, useEffect } from 'react';

function ProductDetail({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        const { data } = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('获取产品失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  if (loading) return <div>加载中...</div>;
  if (!product) return <div>产品不存在</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      {/* 使用 presignedUrl 显示图片 */}
      <img 
        src={product.images.presignedUrl} 
        alt={product.images.alt || product.name}
        style={{ maxWidth: '500px' }}
      />
      <p>价格: ${product.regularPrice}</p>
    </div>
  );
}
```

## 方法 2：获取产品列表

### API 端点

**GET** `/api/products`

获取所有产品列表，每个产品都包含图片的 Presigned URL。

### 查询参数

- `category`: 按分类筛选
- `search`: 搜索关键词
- `color`: 按颜色筛选
- `minPrice`, `maxPrice`: 价格范围
- `onSale`: 是否在售
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 10）
- `sortBy`: 排序字段（popularity, price, name, createdAt）
- `sortOrder`: 排序方向（asc, desc）

### 请求示例

```javascript
// 获取所有产品
const response = await fetch('http://localhost:3000/api/products');
const { data: products } = await response.json();

// 获取特定分类的产品
const response = await fetch('http://localhost:3000/api/products?category=roses&page=1&limit=10');
const { data: products } = await response.json();

// 搜索产品
const response = await fetch('http://localhost:3000/api/products?search=red&sortBy=price&sortOrder=asc');
const { data: products } = await response.json();
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Red Roses Bouquet",
      "images": {
        "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
        "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=...",
        "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
        "alt": "Red roses bouquet"
      },
      "regularPrice": 49.99
    },
    // ... 更多产品
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 50
  }
}
```

### React 示例

```jsx
import React, { useState, useEffect } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://localhost:3000/api/products?page=1&limit=20');
        const { data } = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('获取产品列表失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="product-grid">
      {products.map(product => (
        <div key={product._id} className="product-card">
          {/* 使用 presignedUrl 显示图片 */}
          <img 
            src={product.images.presignedUrl} 
            alt={product.images.alt || product.name}
          />
          <h3>{product.name}</h3>
          <p>${product.regularPrice}</p>
        </div>
      ))}
    </div>
  );
}
```

## 方法 3：获取所有产品图片（不按产品名称）

### API 端点

**GET** `/api/products/images`

获取 S3 中 `products/` 文件夹下的所有图片，不管它们在哪个子文件夹中。

### 查询参数

- `maxKeys` (optional): 最大返回数量，默认 1000

### 请求示例

```javascript
// 获取所有图片
const response = await fetch('http://localhost:3000/api/products/images');
const { data: images } = await response.json();

// 限制返回数量
const response = await fetch('http://localhost:3000/api/products/images?maxKeys=100');
const { data: images } = await response.json();
```

### 响应示例

```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=...",
      "key": "products/red-roses-bouquet/123.jpg",
      "size": 245678,
      "lastModified": "2024-01-15T10:30:00.000Z",
      "productName": "Red Roses Bouquet"
    },
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/white-tulips/456.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/white-tulips/456.jpg?X-Amz-Algorithm=...",
      "key": "products/white-tulips/456.jpg",
      "size": 189234,
      "lastModified": "2024-01-15T11:00:00.000Z",
      "productName": "White Tulips"
    },
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/789.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/789.jpg?X-Amz-Algorithm=...",
      "key": "products/789.jpg",
      "size": 312456,
      "lastModified": "2024-01-14T09:15:00.000Z",
      "productName": null
    }
  ]
}
```

### React 示例

```jsx
import React, { useState, useEffect } from 'react';

function AllProductImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllImages() {
      try {
        const response = await fetch('http://localhost:3000/api/products/images?maxKeys=100');
        const { data } = await response.json();
        setImages(data);
      } catch (error) {
        console.error('获取图片失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllImages();
  }, []);

  if (loading) return <div>加载图片中...</div>;

  return (
    <div className="all-images-gallery">
      <h2>所有产品图片 ({images.length})</h2>
      <div className="image-grid">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img
              src={image.presignedUrl}
              alt={image.productName || `Image ${index + 1}`}
            />
            {image.productName && (
              <p className="product-name">{image.productName}</p>
            )}
            <p className="image-size">{(image.size / 1024).toFixed(2)} KB</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 按产品名称分组显示

```jsx
function AllProductImagesGrouped() {
  const [images, setImages] = useState([]);
  const [groupedImages, setGroupedImages] = useState({});

  useEffect(() => {
    async function fetchAllImages() {
      const response = await fetch('http://localhost:3000/api/products/images');
      const { data } = await response.json();
      setImages(data);

      // 按产品名称分组
      const grouped = data.reduce((acc, image) => {
        const productName = image.productName || '未分类';
        if (!acc[productName]) {
          acc[productName] = [];
        }
        acc[productName].push(image);
        return acc;
      }, {});

      setGroupedImages(grouped);
    }

    fetchAllImages();
  }, []);

  return (
    <div>
      {Object.entries(groupedImages).map(([productName, productImages]) => (
        <div key={productName}>
          <h3>{productName} ({productImages.length})</h3>
          <div className="product-images">
            {productImages.map((image, index) => (
              <img
                key={index}
                src={image.presignedUrl}
                alt={`${productName} - ${index + 1}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 方法 4：根据产品名称获取所有图片

### API 端点

**GET** `/api/products/images/:productName`

根据产品名称获取该产品在 S3 中的所有图片（如果按产品名称组织的话）。

### 请求示例

```javascript
// 根据产品名称获取所有图片
const productName = 'Red Roses Bouquet';
const response = await fetch(
  `http://localhost:3000/api/products/images/${encodeURIComponent(productName)}`
);
const { data: images } = await response.json();

// images 是一个数组，包含该产品的所有图片
images.forEach(image => {
  console.log('图片 URL:', image.presignedUrl);
});
```

### 响应示例

```json
{
  "success": true,
  "count": 3,
  "productName": "Red Roses Bouquet",
  "data": [
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=..."
    },
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/456.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/456.jpg?X-Amz-Algorithm=..."
    },
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/789.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/789.jpg?X-Amz-Algorithm=..."
    }
  ]
}
```

### React 示例

```jsx
import React, { useState, useEffect } from 'react';

function ProductImageGallery({ productName }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch(
          `http://localhost:3000/api/products/images/${encodeURIComponent(productName)}`
        );
        const { data } = await response.json();
        setImages(data);
      } catch (error) {
        console.error('获取图片失败:', error);
      } finally {
        setLoading(false);
      }
    }

    if (productName) {
      fetchImages();
    }
  }, [productName]);

  if (loading) return <div>加载图片中...</div>;
  if (images.length === 0) return <div>没有找到图片</div>;

  return (
    <div className="image-gallery">
      {images.map((image, index) => (
        <img
          key={index}
          src={image.presignedUrl}
          alt={`${productName} - Image ${index + 1}`}
          style={{ maxWidth: '300px', margin: '10px' }}
        />
      ))}
    </div>
  );
}
```

## 方法 5：获取分类产品

### API 端点

**GET** `/api/products/category/:category`

获取特定分类的所有产品，每个产品都包含图片的 Presigned URL。

### 请求示例

```javascript
const category = 'roses';
const response = await fetch(`http://localhost:3000/api/products/category/${category}`);
const { data: products } = await response.json();

products.forEach(product => {
  console.log('产品:', product.name);
  console.log('图片:', product.images.presignedUrl);
});
```

## 使用 Presigned URL

### 重要提示

所有 API 返回的图片 URL 都是 **Presigned URL**，具有以下特点：

1. **有效期：** 默认 1 小时
2. **自动生成：** 每次请求 API 都会生成新的 Presigned URL
3. **直接使用：** 可以直接在 `<img>` 标签中使用

### 处理 URL 过期

如果 Presigned URL 过期（1小时后），可以：

1. **重新请求 API**（推荐）
   ```javascript
   // 重新获取产品数据，会生成新的 Presigned URL
   const response = await fetch(`/api/products/${productId}`);
   const { data: product } = await response.json();
   const newImageUrl = product.images.presignedUrl;
   ```

2. **使用获取 Presigned URL 的 API**
   ```javascript
   // GET /api/upload/product-image/presigned?imageUrl=...
   const originalUrl = product.images.url;
   const response = await fetch(
     `/api/upload/product-image/presigned?imageUrl=${encodeURIComponent(originalUrl)}`
   );
   const { data } = await response.json();
   const newPresignedUrl = data.presignedUrl;
   ```

### 错误处理示例

```jsx
function ProductImage({ productId }) {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadImage() {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const { data } = await response.json();
        setImageUrl(data.images.presignedUrl);
        setError(false);
      } catch (err) {
        setError(true);
      }
    }
    loadImage();
  }, [productId]);

  const handleImageError = async () => {
    // URL 可能过期，重新获取
    try {
      const response = await fetch(`/api/products/${productId}`);
      const { data } = await response.json();
      setImageUrl(data.images.presignedUrl);
      setError(false);
    } catch (err) {
      setError(true);
    }
  };

  if (error) return <div>图片加载失败</div>;

  return (
    <img 
      src={imageUrl} 
      alt="Product"
      onError={handleImageError}
    />
  );
}
```

## 完整示例：产品详情页

```jsx
import React, { useState, useEffect } from 'react';

function ProductDetailPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState([]);

  // 获取产品信息
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        const { data } = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('获取产品失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  // 获取该产品的所有图片（如果按产品名称组织）
  useEffect(() => {
    async function fetchAllImages() {
      if (!product?.name) return;

      try {
        const response = await fetch(
          `http://localhost:3000/api/products/images/${encodeURIComponent(product.name)}`
        );
        const { data } = await response.json();
        setAllImages(data);
      } catch (error) {
        console.error('获取所有图片失败:', error);
      }
    }

    fetchAllImages();
  }, [product?.name]);

  if (loading) return <div>加载中...</div>;
  if (!product) return <div>产品不存在</div>;

  return (
    <div className="product-detail">
      <h1>{product.name}</h1>
      
      {/* 主图片 */}
      <div className="main-image">
        <img 
          src={product.images.presignedUrl} 
          alt={product.images.alt || product.name}
        />
      </div>

      {/* 所有图片（如果有多个） */}
      {allImages.length > 0 && (
        <div className="image-gallery">
          <h2>更多图片</h2>
          {allImages.map((image, index) => (
            <img
              key={index}
              src={image.presignedUrl}
              alt={`${product.name} - ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="product-info">
        <p>价格: ${product.regularPrice}</p>
        <p>描述: {product.description}</p>
      </div>
    </div>
  );
}
```

## 总结

| 方法 | API 端点 | 用途 | 返回内容 |
|------|---------|------|---------|
| **方法 1** | `GET /api/products/:id` | 获取单个产品 | 产品信息 + 主图片 Presigned URL |
| **方法 2** | `GET /api/products` | 获取产品列表 | 产品列表 + 每个产品的图片 Presigned URL |
| **方法 3** | `GET /api/products/images` | 获取所有产品图片 | 所有图片 Presigned URL（不按产品名称） |
| **方法 4** | `GET /api/products/images/:productName` | 获取产品的所有图片 | 该产品的所有图片 Presigned URL |
| **方法 5** | `GET /api/products/category/:category` | 获取分类产品 | 分类产品列表 + 图片 Presigned URL |

**推荐使用：**
- 显示单个产品：使用方法 1
- 显示产品列表：使用方法 2
- 获取所有图片（不按产品）：使用方法 3
- 显示特定产品的图片库：使用方法 4

**所有方法都会自动返回 Presigned URL，可以直接在 `<img>` 标签中使用！**

