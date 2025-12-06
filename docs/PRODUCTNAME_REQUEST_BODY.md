# productName 在 Request Body 中的位置

## 重要说明

当使用 `multipart/form-data` 上传文件时，`productName` 应该作为 **FormData 的一部分**，和 `image` 文件一起发送。

## 请求格式

### Content-Type
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

### Request Body 结构

```
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="image"; filename="image.jpg"
Content-Type: image/jpeg

[文件二进制数据]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="productName"

Red Roses Bouquet
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="alt"

Red roses bouquet
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

## 前端实现

### 方法 1：使用 FormData（推荐）

```javascript
// ✅ 正确：使用 FormData
const formData = new FormData();
formData.append('image', file);              // 文件字段
formData.append('productName', 'Red Roses Bouquet');  // 文本字段
formData.append('alt', 'Red roses bouquet'); // 文本字段

const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // 不要设置 Content-Type，浏览器会自动设置
  },
  body: formData,  // FormData 作为 body
});
```

### 方法 2：使用 Axios

```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet');
formData.append('alt', 'Red roses bouquet');

const response = await axios.post('/api/upload/product-image', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data', // Axios 会自动处理
  },
});
```

### 方法 3：使用 XMLHttpRequest

```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet');
formData.append('alt', 'Red roses bouquet');

const xhr = new XMLHttpRequest();
xhr.open('POST', '/api/upload/product-image');
xhr.setRequestHeader('Authorization', `Bearer ${token}`);
xhr.send(formData);
```

## 字段说明

| 字段名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `image` | File | ✅ 是 | 图片文件 |
| `productName` | String | ❌ 否 | 产品名称（用于组织文件夹） |
| `alt` | String | ❌ 否 | 图片 alt 文本 |

## 完整示例

### HTML 表单方式

```html
<form id="uploadForm">
  <input type="file" name="image" accept="image/*" required />
  <input type="text" name="productName" placeholder="产品名称（可选）" />
  <input type="text" name="alt" placeholder="图片描述（可选）" />
  <button type="submit">上传</button>
</form>

<script>
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  // 可以在这里添加额外的字段
  // formData.append('productName', 'Red Roses Bouquet');
  
  const response = await fetch('/api/upload/product-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  const result = await response.json();
  console.log(result);
});
</script>
```

### React 示例

```jsx
function ImageUpload() {
  const [file, setFile] = useState(null);
  const [productName, setProductName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('image', file);
    
    // productName 作为 FormData 的一部分
    if (productName) {
      formData.append('productName', productName);
    }

    const response = await fetch('/api/upload/product-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData, // FormData 包含 image 和 productName
    });

    const result = await response.json();
    console.log(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
        required 
      />
      <input 
        type="text" 
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="产品名称（可选）"
      />
      <button type="submit">上传</button>
    </form>
  );
}
```

## 常见错误

### ❌ 错误 1：使用 JSON 格式

```javascript
// ❌ 错误：不能使用 JSON 发送文件
const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // ❌ 错误
  },
  body: JSON.stringify({
    image: file,  // ❌ 文件不能这样发送
    productName: 'Red Roses Bouquet',
  }),
});
```

### ❌ 错误 2：手动设置 Content-Type

```javascript
// ❌ 错误：不要手动设置 Content-Type
const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet');

const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data', // ❌ 错误！浏览器会自动设置
  },
  body: formData,
});
```

### ✅ 正确做法

```javascript
// ✅ 正确：让浏览器自动设置 Content-Type
const formData = new FormData();
formData.append('image', file);
formData.append('productName', 'Red Roses Bouquet');

const response = await fetch('/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // 不设置 Content-Type，浏览器会自动设置为：
    // Content-Type: multipart/form-data; boundary=...
  },
  body: formData,
});
```

## 使用 Postman 测试

1. **方法：** POST
2. **URL：** `http://localhost:3000/api/upload/product-image`
3. **Headers：**
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body：** 选择 `form-data`
5. **添加字段：**
   - Key: `image` (类型选择 **File**)
     - Value: 选择图片文件
   - Key: `productName` (类型选择 **Text**)
     - Value: `Red Roses Bouquet`
   - Key: `alt` (类型选择 **Text**，可选)
     - Value: `Red roses bouquet`

## 使用 curl 测试

```bash
curl -X POST http://localhost:3000/api/upload/product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "productName=Red Roses Bouquet" \
  -F "alt=Red roses bouquet"
```

## 后端如何接收

后端使用 `multer` 中间件处理 `multipart/form-data`：

```javascript
// 文件在 req.file 中
const file = req.file; // { fieldname: 'image', originalname: '...', ... }

// 其他字段在 req.body 中
const productName = req.body.productName; // 'Red Roses Bouquet'
const alt = req.body.alt; // 'Red roses bouquet'
```

## 总结

**productName 的位置：**
- ✅ 作为 FormData 的一部分
- ✅ 和 `image` 文件一起发送
- ✅ 使用 `formData.append('productName', value)` 添加
- ❌ 不在 JSON body 中
- ❌ 不在 URL 参数中（虽然可以，但不推荐）

**关键点：**
1. 使用 `FormData` 对象
2. 使用 `formData.append()` 添加所有字段（包括文件）
3. 不要手动设置 `Content-Type` 头
4. 让浏览器自动处理 `multipart/form-data` 格式

