# 前端图片上传 API 调用示例

## 基础示例（原生 JavaScript）

### HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>图片上传示例</title>
</head>
<body>
  <div>
    <h2>上传产品图片</h2>
    <input type="file" id="imageInput" accept="image/*" />
    <input type="text" id="productName" placeholder="产品名称（可选）" />
    <input type="text" id="altText" placeholder="图片描述（可选）" />
    <button onclick="uploadImage()">上传图片</button>
    <div id="result"></div>
    <div id="preview"></div>
  </div>

  <script>
    async function uploadImage() {
      const fileInput = document.getElementById('imageInput');
      const productNameInput = document.getElementById('productName');
      const altTextInput = document.getElementById('altText');
      const resultDiv = document.getElementById('result');
      const previewDiv = document.getElementById('preview');

      // 检查是否选择了文件
      if (!fileInput.files || fileInput.files.length === 0) {
        alert('请选择一张图片');
        return;
      }

      const file = fileInput.files[0];
      const productName = productNameInput.value.trim();
      const altText = altTextInput.value.trim();

      // 创建 FormData
      const formData = new FormData();
      formData.append('image', file);
      
      if (productName) {
        formData.append('productName', productName);
      }
      
      if (altText) {
        formData.append('alt', altText);
      }

      // 显示加载状态
      resultDiv.innerHTML = '上传中...';
      previewDiv.innerHTML = '';

      try {
        // 调用上传 API
        const response = await fetch('http://localhost:3000/api/upload/product-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`, // 从 localStorage 或其他地方获取 token
          },
          body: formData, // 不要设置 Content-Type，浏览器会自动设置
        });

        const result = await response.json();

        if (result.success) {
          // 上传成功
          resultDiv.innerHTML = `
            <div style="color: green;">
              <h3>✅ 上传成功！</h3>
              <p><strong>原始 URL:</strong> ${result.data.url}</p>
              <p><strong>文件 Key:</strong> ${result.data.key}</p>
              <p><strong>文件大小:</strong> ${(result.data.size / 1024).toFixed(2)} KB</p>
              <p><strong>文件类型:</strong> ${result.data.mimetype}</p>
            </div>
          `;

          // 显示图片预览（使用 Presigned URL）
          if (result.data.presignedUrl) {
            previewDiv.innerHTML = `
              <h3>图片预览：</h3>
              <img src="${result.data.presignedUrl}" alt="${result.data.alt || 'Uploaded image'}" 
                   style="max-width: 500px; max-height: 500px; border: 1px solid #ccc; padding: 10px;" />
            `;
          }

          // 可以在这里将图片 URL 保存到产品数据中
          console.log('图片 URL:', result.data.url);
          console.log('Presigned URL:', result.data.presignedUrl);
        } else {
          // 上传失败
          resultDiv.innerHTML = `
            <div style="color: red;">
              <h3>❌ 上传失败</h3>
              <p>${result.message}</p>
            </div>
          `;
        }
      } catch (error) {
        // 网络错误或其他错误
        resultDiv.innerHTML = `
          <div style="color: red;">
            <h3>❌ 错误</h3>
            <p>${error.message}</p>
          </div>
        `;
        console.error('上传错误:', error);
      }
    }

    // 获取认证 token（示例）
    function getAuthToken() {
      return localStorage.getItem('authToken') || '';
    }
  </script>
</body>
</html>
```

## React 示例

### 基础组件

```jsx
import React, { useState } from 'react';

function ImageUpload({ productName, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  // 获取认证 token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || '';
  };

  // 处理文件选择
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('不支持的文件类型。只支持 JPEG, PNG, WebP, GIF');
        return;
      }

      // 验证文件大小（10MB）
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件太大。最大支持 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);

      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // 上传图片
  const handleUpload = async () => {
    if (!file) {
      setError('请选择一张图片');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // 如果提供了产品名称，添加到 FormData
      if (productName) {
        formData.append('productName', productName);
      }
      
      if (altText) {
        formData.append('alt', altText);
      }

      const response = await fetch('http://localhost:3000/api/upload/product-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          // 不要设置 Content-Type，浏览器会自动设置
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        
        // 调用成功回调
        if (onUploadSuccess) {
          onUploadSuccess(data.data);
        }
      } else {
        setError(data.message || '上传失败');
      }
    } catch (err) {
      setError(err.message || '网络错误，请重试');
      console.error('上传错误:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>上传产品图片</h2>

      {/* 文件选择 */}
      <div style={{ marginBottom: '15px' }}>
        <label>
          选择图片：
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      {/* 产品名称（如果未通过 props 传入） */}
      {!productName && (
        <div style={{ marginBottom: '15px' }}>
          <label>
            产品名称（可选）：
            <input
              type="text"
              placeholder="例如：Red Roses Bouquet"
              onChange={(e) => formData.append('productName', e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            />
          </label>
        </div>
      )}

      {/* Alt 文本 */}
      <div style={{ marginBottom: '15px' }}>
        <label>
          图片描述（可选）：
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="例如：Red roses bouquet"
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </label>
      </div>

      {/* 上传按钮 */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          padding: '10px 20px',
          backgroundColor: uploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? '上传中...' : '上传图片'}
      </button>

      {/* 错误信息 */}
      {error && (
        <div style={{ marginTop: '15px', color: 'red' }}>
          ❌ {error}
        </div>
      )}

      {/* 预览 */}
      {preview && (
        <div style={{ marginTop: '15px' }}>
          <h3>预览：</h3>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {/* 上传结果 */}
      {result && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h3 style={{ color: 'green' }}>✅ 上传成功！</h3>
          <p><strong>原始 URL:</strong> {result.url}</p>
          <p><strong>文件 Key:</strong> {result.key}</p>
          <p><strong>文件大小:</strong> {(result.size / 1024).toFixed(2)} KB</p>
          
          {/* 显示上传的图片（使用 Presigned URL） */}
          {result.presignedUrl && (
            <div style={{ marginTop: '15px' }}>
              <h4>上传的图片：</h4>
              <img
                src={result.presignedUrl}
                alt={result.alt || 'Uploaded image'}
                style={{ maxWidth: '500px', maxHeight: '500px', border: '1px solid #ccc' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
```

### 在创建产品时使用

```jsx
import React, { useState } from 'react';
import ImageUpload from './ImageUpload';

function CreateProduct() {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    stems: 12,
    color: '',
    regularPrice: 0,
    quantity: 1,
    category: 'roses',
    images: {
      url: '',
      alt: '',
    },
  });

  const [imageUrl, setImageUrl] = useState('');

  // 图片上传成功回调
  const handleImageUploadSuccess = (uploadResult) => {
    setImageUrl(uploadResult.url);
    setProductData({
      ...productData,
      images: {
        url: uploadResult.url,
        alt: uploadResult.alt || productData.name,
      },
    });
  };

  // 创建产品
  const handleCreateProduct = async () => {
    if (!imageUrl) {
      alert('请先上传产品图片');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('产品创建成功！');
        // 重置表单
        setProductData({
          name: '',
          description: '',
          stems: 12,
          color: '',
          regularPrice: 0,
          quantity: 1,
          category: 'roses',
          images: { url: '', alt: '' },
        });
        setImageUrl('');
      } else {
        alert('创建失败：' + result.message);
      }
    } catch (error) {
      console.error('创建产品错误:', error);
      alert('网络错误，请重试');
    }
  };

  return (
    <div>
      <h1>创建新产品</h1>

      {/* 产品信息表单 */}
      <div>
        <label>产品名称：</label>
        <input
          type="text"
          value={productData.name}
          onChange={(e) => setProductData({ ...productData, name: e.target.value })}
        />
      </div>

      {/* 图片上传组件（传入产品名称） */}
      <ImageUpload
        productName={productData.name}
        onUploadSuccess={handleImageUploadSuccess}
      />

      {/* 其他产品字段... */}
      
      <button onClick={handleCreateProduct}>创建产品</button>
    </div>
  );
}

export default CreateProduct;
```

## 使用 Axios 的示例

```javascript
import axios from 'axios';

async function uploadImage(file, productName = null, altText = '') {
  const formData = new FormData();
  formData.append('image', file);
  
  if (productName) {
    formData.append('productName', productName);
  }
  
  if (altText) {
    formData.append('alt', altText);
  }

  try {
    const response = await axios.post(
      'http://localhost:3000/api/upload/product-image',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        // 显示上传进度
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`上传进度: ${percentCompleted}%`);
        },
      }
    );

    if (response.data.success) {
      console.log('上传成功:', response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message || '上传失败');
    }
  } catch (error) {
    if (error.response) {
      // 服务器返回错误
      console.error('上传失败:', error.response.data);
      throw new Error(error.response.data.message || '上传失败');
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.request);
      throw new Error('网络错误，请检查连接');
    } else {
      // 其他错误
      console.error('错误:', error.message);
      throw error;
    }
  }
}

// 使用示例
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const result = await uploadImage(file, 'Red Roses Bouquet', 'Red roses bouquet');
      console.log('图片 URL:', result.url);
      console.log('Presigned URL:', result.presignedUrl);
    } catch (error) {
      console.error('上传错误:', error);
    }
  }
});
```

## 带进度条的上传示例

```jsx
import React, { useState } from 'react';

function ImageUploadWithProgress() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      // 监听完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setResult(response.data);
          }
        }
        setUploading(false);
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        console.error('上传错误');
        setUploading(false);
      });

      xhr.open('POST', 'http://localhost:3000/api/upload/product-image');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('authToken')}`);
      xhr.send(formData);
    } catch (error) {
      console.error('上传错误:', error);
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        上传
      </button>

      {uploading && (
        <div>
          <div>上传进度: {progress.toFixed(0)}%</div>
          <progress value={progress} max="100" />
        </div>
      )}

      {result && (
        <div>
          <h3>上传成功！</h3>
          <img src={result.presignedUrl} alt="Uploaded" />
        </div>
      )}
    </div>
  );
}
```

## 关键要点

### 1. FormData 使用
```javascript
const formData = new FormData();
formData.append('image', file); // 字段名必须是 'image'
formData.append('productName', 'Red Roses Bouquet'); // 可选
formData.append('alt', 'Red roses bouquet'); // 可选
```

### 2. 请求头设置
```javascript
// ✅ 正确：不要手动设置 Content-Type
headers: {
  'Authorization': `Bearer ${token}`,
  // 浏览器会自动设置 Content-Type: multipart/form-data; boundary=...
}

// ❌ 错误：不要手动设置 Content-Type
headers: {
  'Content-Type': 'multipart/form-data', // 这会破坏请求！
}
```

### 3. 错误处理
- 检查文件类型和大小
- 处理网络错误
- 处理服务器错误响应

### 4. 使用 Presigned URL
上传成功后，使用 `result.data.presignedUrl` 来显示图片（1小时内有效）。

## 完整工作流程

```javascript
// 1. 用户选择文件
const file = fileInput.files[0];

// 2. 创建 FormData
const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet');

// 3. 上传
const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

// 4. 获取结果
const { data } = await response.json();

// 5. 使用图片 URL 创建产品
const productData = {
  name: 'Red Roses Bouquet',
  images: {
    url: data.url, // 或使用 data.presignedUrl
    alt: data.alt,
  },
  // ... 其他字段
};

// 6. 创建产品
await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(productData),
});
```

## 测试

可以使用以下 curl 命令测试：

```bash
curl -X POST http://localhost:3000/api/upload/product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "productName=Red Roses Bouquet" \
  -F "alt=Red roses bouquet"
```

