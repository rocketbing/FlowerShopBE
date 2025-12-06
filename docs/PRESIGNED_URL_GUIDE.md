# Presigned URL 使用指南

## 概述

项目现在使用 **Presigned URL（签名 URL）** 方案来访问 S3 中的私有图片。这样不需要配置 S3 bucket 的公开访问，更加安全。

## 工作原理

```
1. 图片上传到 S3（私有）
2. 后端生成 Presigned URL（带签名的临时访问链接）
3. 前端使用 Presigned URL 显示图片
4. URL 过期后需要重新生成
```

## 自动生成 Presigned URL

### 产品列表 API

**GET** `/api/products`

返回的产品数据中，每个产品的 `images` 对象包含：
- `url`: 原始 S3 URL（私有，不能直接访问）
- `presignedUrl`: Presigned URL（可以用于显示图片，1小时内有效）
- `originalUrl`: 原始 URL 的副本

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Red Roses",
      "images": {
        "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/123.jpg",
        "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/123.jpg?X-Amz-Algorithm=...",
        "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/123.jpg",
        "alt": "Red roses"
      }
    }
  ]
}
```

### 单个产品 API

**GET** `/api/products/:id`

同样包含 `presignedUrl` 字段。

### 上传图片 API

**POST** `/api/upload/product-image`

上传成功后，响应中同时返回：
- `url`: 原始 S3 URL
- `presignedUrl`: 立即可用的 Presigned URL（1小时内有效）

**响应示例：**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/123.jpg",
    "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/123.jpg?X-Amz-Algorithm=...",
    "key": "products/123.jpg",
    "alt": "Product image",
    "size": 245678,
    "mimetype": "image/jpeg"
  }
}
```

## 前端使用

### 使用 Presigned URL 显示图片

```javascript
// 获取产品列表
const response = await fetch('/api/products');
const { data: products } = await response.json();

// 使用 presignedUrl 显示图片
products.forEach(product => {
  const img = document.createElement('img');
  img.src = product.images.presignedUrl; // 使用 Presigned URL
  img.alt = product.images.alt;
  document.body.appendChild(img);
});
```

### React 示例

```jsx
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.data));
  }, []);

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>
          <img 
            src={product.images.presignedUrl} // 使用 Presigned URL
            alt={product.images.alt}
          />
          <h3>{product.name}</h3>
        </div>
      ))}
    </div>
  );
}
```

### 处理 URL 过期

Presigned URL 默认 1 小时后过期。如果图片无法显示，可以：

1. **重新获取产品数据**（推荐）
   ```javascript
   // 重新请求 API，会生成新的 Presigned URL
   const response = await fetch('/api/products');
   const { data: products } = await response.json();
   ```

2. **使用获取 Presigned URL 的 API**
   ```javascript
   // GET /api/upload/product-image/presigned?imageUrl=...
   const response = await fetch(
     `/api/upload/product-image/presigned?imageUrl=${encodeURIComponent(product.images.url)}&expiresIn=3600`
   );
   const { data } = await response.json();
   const newPresignedUrl = data.presignedUrl;
   ```

## 手动获取 Presigned URL API

如果需要单独获取 Presigned URL：

**GET** `/api/upload/product-image/presigned`

**查询参数：**
- `imageUrl` (required): S3 图片 URL
- `expiresIn` (optional): 过期时间（秒），默认 3600（1小时）

**示例：**
```javascript
const imageUrl = 'https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/123.jpg';
const response = await fetch(
  `/api/upload/product-image/presigned?imageUrl=${encodeURIComponent(imageUrl)}&expiresIn=3600`
);
const { data } = await response.json();
console.log(data.presignedUrl); // 新的 Presigned URL
```

## URL 过期时间

- **默认过期时间：** 1 小时（3600 秒）
- **可配置：** 通过 `expiresIn` 参数自定义
- **建议：** 
  - 产品列表：1 小时（用户浏览时间）
  - 单个产品：2-4 小时（用户可能长时间查看）
  - 上传后立即使用：1 小时

## 优势

### ✅ 安全性
- 图片保持私有，不能直接访问
- 只有通过 Presigned URL 才能访问
- URL 有过期时间，自动失效

### ✅ 灵活性
- 可以控制访问时间
- 可以为不同场景设置不同的过期时间
- 不需要配置 S3 bucket 公开访问

### ✅ 性能
- Presigned URL 直接从 S3 加载
- 无需后端代理
- 利用 S3 的 CDN 优势

## 注意事项

### 1. URL 过期处理

前端应该处理 URL 过期的情况：

```javascript
function ProductImage({ product }) {
  const [imageUrl, setImageUrl] = useState(product.images.presignedUrl);
  const [error, setError] = useState(false);

  const handleImageError = async () => {
    // URL 可能过期，重新获取
    try {
      const response = await fetch(
        `/api/upload/product-image/presigned?imageUrl=${encodeURIComponent(product.images.url)}`
      );
      const { data } = await response.json();
      setImageUrl(data.presignedUrl);
      setError(false);
    } catch (err) {
      setError(true);
    }
  };

  if (error) {
    return <div>Failed to load image</div>;
  }

  return (
    <img 
      src={imageUrl} 
      alt={product.images.alt}
      onError={handleImageError}
    />
  );
}
```

### 2. 缓存策略

- **不要缓存 Presigned URL**：URL 会过期
- **可以缓存产品数据**：但需要定期刷新以获取新的 Presigned URL
- **建议：** 在显示图片前检查 URL 是否过期

### 3. 性能优化

- 批量获取产品时，Presigned URL 是并行生成的
- 对于大量产品，考虑分页加载
- 可以使用图片懒加载技术

## 与公开访问方案对比

| 特性 | Presigned URL | 公开访问 |
|------|--------------|----------|
| 安全性 | ⭐⭐⭐⭐⭐ 高 | ⭐⭐ 低 |
| 实现复杂度 | ⭐⭐⭐ 中等 | ⭐ 简单 |
| 性能 | ⭐⭐⭐⭐⭐ 好 | ⭐⭐⭐⭐⭐ 好 |
| 访问控制 | ✅ 是 | ❌ 否 |
| URL 过期 | ✅ 是 | ❌ 否 |
| 需要配置 S3 | ❌ 否 | ✅ 是 |

## 迁移说明

如果你之前使用公开访问方案：

1. **不需要配置 S3 bucket 公开访问**
2. **不需要 Bucket Policy**
3. **代码已自动处理 Presigned URL 生成**
4. **前端只需使用 `presignedUrl` 字段**

## 常见问题

### Q: Presigned URL 过期了怎么办？

A: 重新请求产品 API 或使用 `/api/upload/product-image/presigned` 获取新的 URL。

### Q: 可以延长过期时间吗？

A: 可以，通过 `expiresIn` 参数设置，但建议不超过 24 小时。

### Q: 会影响性能吗？

A: 不会。Presigned URL 生成很快，且是并行处理的。

### Q: 前端需要做什么改动？

A: 只需要使用 `images.presignedUrl` 而不是 `images.url` 来显示图片。

## 总结

Presigned URL 方案提供了更好的安全性和灵活性，同时保持了良好的性能。代码已经自动处理了 URL 生成，前端只需要使用返回的 `presignedUrl` 字段即可。

