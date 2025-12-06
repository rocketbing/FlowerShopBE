# 产品图片组织指南

## 概述

现在图片可以按产品名称组织到不同的文件夹中，方便管理和查找。

## 文件夹结构

### 之前（扁平结构）
```
products/
  ├── 1234567890-abc123-image1.jpg
  ├── 1234567891-def456-image2.jpg
  └── 1234567892-ghi789-image3.jpg
```

### 现在（按产品名称组织）
```
products/
  ├── red-roses-bouquet/
  │   ├── 1234567890-abc123-image1.jpg
  │   └── 1234567891-def456-image2.jpg
  ├── white-tulips/
  │   └── 1234567892-ghi789-image3.jpg
  └── yellow-sunflowers/
      └── 1234567893-jkl012-image4.jpg
```

## 上传图片时指定产品名称

### 方法 1：在上传时提供产品名称

**POST** `/api/upload/product-image`

**请求参数：**
- `image` (file, required): 图片文件
- `productName` (string, optional): 产品名称
- `alt` (string, optional): 图片 alt 文本

**示例：**
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet'); // 指定产品名称
formData.append('alt', 'Red roses bouquet');

const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

**结果：**
- 图片会存储在：`products/red-roses-bouquet/1234567890-abc123-image.jpg`
- 产品名称会被自动转换为安全的文件夹名（小写、去除特殊字符、空格变连字符）

### 方法 2：不提供产品名称（向后兼容）

如果不提供 `productName`，图片会存储在 `products/` 根目录下（扁平结构）。

## 产品名称转换规则

产品名称会被自动转换为安全的文件夹名：

| 产品名称 | 文件夹名 |
|---------|---------|
| `Red Roses Bouquet` | `red-roses-bouquet` |
| `White Tulips (12 stems)` | `white-tulips-12-stems` |
| `Yellow Sunflowers!!!` | `yellow-sunflowers` |
| `Mixed Flowers & More` | `mixed-flowers-more` |

**转换规则：**
1. 转为小写
2. 去除特殊字符（只保留字母、数字、空格、连字符）
3. 空格替换为连字符
4. 多个连字符合并为一个
5. 去除首尾连字符

## 根据产品名称获取图片

### API 端点

**GET** `/api/products/images/:productName`

根据产品名称获取该产品的所有图片。

**参数：**
- `productName` (path parameter): 产品名称

**响应示例：**
```json
{
  "success": true,
  "count": 3,
  "productName": "Red Roses Bouquet",
  "data": [
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1234567890-abc123-image1.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1234567890-abc123-image1.jpg?X-Amz-Algorithm=..."
    },
    {
      "originalUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1234567891-def456-image2.jpg",
      "presignedUrl": "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/1234567891-def456-image2.jpg?X-Amz-Algorithm=..."
    }
  ]
}
```

### 前端使用示例

```javascript
// 获取某个产品的所有图片
async function getProductImages(productName) {
  const response = await fetch(
    `/api/products/images/${encodeURIComponent(productName)}`
  );
  const { data } = await response.json();
  return data;
}

// 使用示例
const images = await getProductImages('Red Roses Bouquet');
images.forEach(image => {
  const img = document.createElement('img');
  img.src = image.presignedUrl; // 使用 Presigned URL
  document.body.appendChild(img);
});
```

### React 示例

```jsx
function ProductImageGallery({ productName }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch(
          `/api/products/images/${encodeURIComponent(productName)}`
        );
        const { data } = await response.json();
        setImages(data);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    }

    if (productName) {
      fetchImages();
    }
  }, [productName]);

  if (loading) return <div>Loading images...</div>;
  if (images.length === 0) return <div>No images found</div>;

  return (
    <div className="image-gallery">
      {images.map((image, index) => (
        <img
          key={index}
          src={image.presignedUrl}
          alt={`${productName} - Image ${index + 1}`}
        />
      ))}
    </div>
  );
}
```

## 工作流程建议

### 场景 1：创建新产品时上传图片

```javascript
// 1. 先上传图片（提供产品名称）
const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet');

const uploadResponse = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

const { data } = await uploadResponse.json();
const imageUrl = data.url; // 或使用 data.presignedUrl

// 2. 创建产品（使用返回的图片 URL）
const productData = {
  name: 'Red Roses Bouquet',
  images: {
    url: imageUrl,
    alt: 'Red roses bouquet'
  },
  // ... 其他产品字段
};

await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(productData),
});
```

### 场景 2：为现有产品添加更多图片

```javascript
// 1. 获取产品信息
const product = await fetch(`/api/products/${productId}`).then(r => r.json());

// 2. 上传新图片（使用产品名称）
const formData = new FormData();
formData.append('image', newFile);
formData.append('productName', product.data.name); // 使用产品名称

const uploadResponse = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

### 场景 3：获取产品的所有图片

```javascript
// 获取产品的所有图片
const product = await fetch(`/api/products/${productId}`).then(r => r.json());
const productName = product.data.name;

const imagesResponse = await fetch(
  `/api/products/images/${encodeURIComponent(productName)}`
);
const { data: images } = await imagesResponse.json();

// 显示所有图片
images.forEach(image => {
  console.log('Image URL:', image.presignedUrl);
});
```

## 注意事项

### 1. 产品名称匹配

- API 会自动将产品名称转换为安全的文件夹名
- 确保上传时使用的产品名称与数据库中存储的产品名称一致
- 大小写不敏感，但特殊字符会影响匹配

### 2. 向后兼容

- 如果上传时不提供 `productName`，图片会存储在 `products/` 根目录
- 旧图片不会自动移动，仍可正常访问

### 3. 产品名称更改

- 如果更改了产品名称，新上传的图片会存储在新的文件夹中
- 旧图片仍在原文件夹中，需要手动管理

### 4. 多个产品同名

- 如果多个产品使用相同的名称，它们的图片会存储在同一个文件夹中
- 建议使用唯一的产品名称，或使用产品ID作为文件夹名（需要修改代码）

## 高级用法

### 使用产品ID作为文件夹名（可选）

如果需要更精确的组织方式，可以修改代码使用产品ID：

```javascript
// 在 uploadController.js 中
const productId = req.body.productId;
const fileName = s3Service.generateFileName(
  file.originalname, 
  'products', 
  productId // 使用产品ID而不是名称
);
```

这样可以确保每个产品有唯一的文件夹，即使产品名称相同。

## 总结

- ✅ 上传时提供 `productName` 参数，图片会按产品名称组织
- ✅ 使用 `GET /api/products/images/:productName` 获取某个产品的所有图片
- ✅ 产品名称会自动转换为安全的文件夹名
- ✅ 向后兼容：不提供 `productName` 时使用扁平结构

