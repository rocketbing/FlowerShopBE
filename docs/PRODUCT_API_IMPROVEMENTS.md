# Product API 改进说明

## 已完成的改进

### 1. ✅ POST /api/products - 创建产品
**改进：** 支持直接上传图片文件
- 支持 `multipart/form-data` 格式
- 支持 `application/json` 格式
- 如果上传图片文件，自动上传到 S3
- 自动按产品名称组织图片

### 2. ✅ PUT /api/products/:id - 更新产品
**改进：** 支持上传新图片并自动删除旧图片
- 支持 `multipart/form-data` 格式
- 支持 `application/json` 格式
- 如果上传新图片，自动删除 S3 中的旧图片
- 避免存储空间浪费

### 3. ✅ DELETE /api/products/:id - 删除产品
**改进：** 自动删除 S3 中的图片
- 删除产品时，同时删除 S3 中的图片文件
- 避免存储空间浪费
- 即使图片删除失败，产品仍会从数据库删除（不会阻塞）

## API 功能对比

| API | 支持文件上传 | 自动删除旧图片 | 自动删除 S3 图片 | Presigned URL |
|-----|------------|--------------|----------------|---------------|
| **GET /api/products** | ❌ | - | - | ✅ |
| **GET /api/products/:id** | ❌ | - | - | ✅ |
| **POST /api/products** | ✅ | - | - | ✅ |
| **PUT /api/products/:id** | ✅ | ✅ | ✅ | ✅ |
| **DELETE /api/products/:id** | ❌ | - | ✅ | - |
| **GET /api/products/category/:category** | ❌ | - | - | ✅ |
| **GET /api/products/images** | ❌ | - | - | ✅ |
| **GET /api/products/images/:productName** | ❌ | - | - | ✅ |

## 详细说明

### PUT /api/products/:id - 更新产品

#### 功能增强

1. **支持上传新图片**
   - 可以上传新图片文件替换旧图片
   - 自动上传到 S3
   - 自动按产品名称组织

2. **自动删除旧图片**
   - 如果上传了新图片，自动删除 S3 中的旧图片
   - 避免存储空间浪费
   - 即使删除失败也不会阻塞更新操作

#### 使用示例

**方式 1：上传新图片（multipart/form-data）**

```javascript
const formData = new FormData();
formData.append('name', 'Updated Product Name');
formData.append('regularPrice', '59.99');
formData.append('image', newImageFile); // 新图片

const response = await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

**方式 2：只更新数据（application/json）**

```javascript
const productData = {
  name: 'Updated Product Name',
  regularPrice: 59.99,
  // 不提供 images，保持原有图片
};

const response = await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(productData),
});
```

**方式 3：更新图片 URL（application/json）**

```javascript
const productData = {
  name: 'Updated Product Name',
  images: {
    url: 'https://...', // 新的图片 URL
    alt: 'New image description',
  },
};

const response = await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(productData),
});
```

### DELETE /api/products/:id - 删除产品

#### 功能增强

1. **自动删除 S3 图片**
   - 删除产品时，自动删除 S3 中的图片文件
   - 避免存储空间浪费
   - 即使图片删除失败，产品仍会从数据库删除

#### 工作流程

```
1. 查找产品
   ↓
2. 提取图片 URL
   ↓
3. 从 URL 提取 S3 key
   ↓
4. 删除 S3 中的图片文件
   ↓
5. 删除数据库中的产品记录
   ↓
6. 返回成功响应
```

#### 错误处理

如果 S3 图片删除失败：
- ⚠️ 记录警告日志
- ✅ 产品仍会从数据库删除
- ✅ 不会阻塞删除操作

## 最佳实践

### 创建产品

**推荐：** 使用 `multipart/form-data` 直接上传图片

```javascript
const formData = new FormData();
formData.append('name', 'Red Roses');
formData.append('image', imageFile); // 直接上传
// ... 其他字段

await fetch('/api/products', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

### 更新产品

**场景 1：更新图片**
```javascript
// 上传新图片，自动删除旧图片
const formData = new FormData();
formData.append('image', newImageFile);
// ... 其他字段

await fetch(`/api/products/${id}`, {
  method: 'PUT',
  body: formData,
});
```

**场景 2：只更新数据**
```javascript
// 不提供图片，保持原有图片
await fetch(`/api/products/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Name' }),
});
```

### 删除产品

**自动处理：**
- 删除产品时自动删除 S3 图片
- 无需手动清理

```javascript
await fetch(`/api/products/${id}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

## 注意事项

### 1. 图片删除失败

如果 S3 图片删除失败（例如网络问题、权限问题），产品仍会从数据库删除。这是设计决定，因为：
- 避免阻塞删除操作
- 可以后续手动清理 S3
- 产品数据已删除，图片成为孤立文件

### 2. 更新图片时的旧图片删除

- 只有在上传新图片时才会删除旧图片
- 如果只更新其他字段，不会删除图片
- 如果提供新的图片 URL（JSON），不会删除旧图片（需要手动处理）

### 3. 批量删除

如果需要批量删除产品，建议：
1. 先获取所有产品
2. 逐个删除（会自动删除图片）
3. 或者创建批量删除 API

## 总结

### ✅ 已改进的 API

1. **POST /api/products** - 支持直接上传图片
2. **PUT /api/products/:id** - 支持上传新图片并自动删除旧图片
3. **DELETE /api/products/:id** - 自动删除 S3 图片

### ✅ 已完善的 API

1. **GET /api/products** - 自动生成 Presigned URL
2. **GET /api/products/:id** - 自动生成 Presigned URL
3. **GET /api/products/category/:category** - 自动生成 Presigned URL

### 📋 所有 Product API 状态

| API | 状态 | 说明 |
|-----|------|------|
| GET /api/products | ✅ 完善 | 支持 Presigned URL |
| GET /api/products/:id | ✅ 完善 | 支持 Presigned URL |
| POST /api/products | ✅ 已改进 | 支持文件上传 |
| PUT /api/products/:id | ✅ 已改进 | 支持文件上传 + 自动删除旧图片 |
| DELETE /api/products/:id | ✅ 已改进 | 自动删除 S3 图片 |
| GET /api/products/category/:category | ✅ 完善 | 支持 Presigned URL |
| GET /api/products/images | ✅ 完善 | 获取所有图片 |
| GET /api/products/images/:productName | ✅ 完善 | 按产品名称获取图片 |

**所有 Product 相关的 API 都已完善！** 🎉

