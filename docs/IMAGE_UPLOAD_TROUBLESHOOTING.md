# 图片上传问题排查指南

## 错误：Field name missing

### 错误信息
```
MulterError: Field name missing
```

### 原因
这个错误表示前端发送的请求中缺少正确的文件字段名。Multer 期望字段名为 `image`，但请求中没有找到。

### 解决方案

#### 1. 检查字段名
确保前端使用 **`image`** 作为字段名：

**✅ 正确示例：**
```javascript
const formData = new FormData();
formData.append('image', file);  // 字段名必须是 'image'
```

**❌ 错误示例：**
```javascript
const formData = new FormData();
formData.append('file', file);      // ❌ 错误：字段名应该是 'image'
formData.append('photo', file);     // ❌ 错误：字段名应该是 'image'
formData.append('upload', file);    // ❌ 错误：字段名应该是 'image'
```

#### 2. 检查 Content-Type
确保请求头设置为 `multipart/form-data`：

**✅ 正确示例（使用 Fetch API）：**
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('alt', 'Product image');

const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // ❌ 不要手动设置 Content-Type，浏览器会自动设置
    // 'Content-Type': 'multipart/form-data'  // 这会破坏请求！
  },
  body: formData,
});
```

**✅ 正确示例（使用 Axios）：**
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('alt', 'Product image');

const response = await axios.post('/api/upload/product-image', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',  // Axios 会自动处理
  },
});
```

#### 3. 检查文件对象
确保传递的是有效的文件对象：

```javascript
// 从 input 元素获取文件
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

if (!file) {
  console.error('No file selected');
  return;
}

const formData = new FormData();
formData.append('image', file);  // 确保 file 不是 null 或 undefined
```

#### 4. 完整的前端示例

**React 示例：**
```jsx
import React, { useState } from 'react';

function ImageUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);  // ✅ 字段名必须是 'image'
    formData.append('alt', 'Product image');

    setUploading(true);
    try {
      const response = await fetch('http://localhost:3000/api/upload/product-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${yourToken}`,
          // ❌ 不要设置 Content-Type，让浏览器自动设置
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Image URL:', result.data.url);
        // 使用 result.data.url 创建产品
      } else {
        console.error('Upload failed:', result.message);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

**使用 Axios 的示例：**
```javascript
import axios from 'axios';

const uploadImage = async (file, token) => {
  const formData = new FormData();
  formData.append('image', file);  // ✅ 字段名必须是 'image'
  formData.append('alt', 'Product image');

  try {
    const response = await axios.post(
      'http://localhost:3000/api/upload/product-image',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data.url;
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    throw error;
  }
};
```

#### 5. 使用 Postman 测试

1. 选择 **POST** 方法
2. URL: `http://localhost:3000/api/upload/product-image`
3. 在 **Headers** 中添加：
   - `Authorization: Bearer YOUR_TOKEN`
4. 在 **Body** 中选择 **form-data**
5. 添加字段：
   - Key: `image` (类型选择 File)
   - Value: 选择图片文件
   - Key: `alt` (类型选择 Text，可选)
   - Value: `Product image`

#### 6. 使用 curl 测试

```bash
curl -X POST http://localhost:3000/api/upload/product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "alt=Product image"
```

### 常见错误总结

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Field name missing | 字段名不是 'image' | 使用 `formData.append('image', file)` |
| Field name missing | 没有使用 multipart/form-data | 不要手动设置 Content-Type，让浏览器自动设置 |
| Field name missing | 文件对象为 null | 检查文件选择是否正确 |
| LIMIT_FILE_SIZE | 文件超过 10MB | 压缩图片或使用更小的文件 |
| Invalid file type | 文件类型不支持 | 只支持 JPEG, PNG, WebP, GIF |

### 调试技巧

1. **检查请求格式：**
```javascript
// 在浏览器控制台检查 FormData
const formData = new FormData();
formData.append('image', file);
console.log('FormData entries:');
for (let [key, value] of formData.entries()) {
  console.log(key, value);
}
```

2. **检查网络请求：**
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 找到上传请求
   - 检查 Request Headers 中的 Content-Type 应该是 `multipart/form-data; boundary=...`
   - 检查 Request Payload 中是否有 `image` 字段

3. **后端日志：**
   - 检查服务器控制台是否有错误日志
   - 查看请求是否到达了 multer 中间件

