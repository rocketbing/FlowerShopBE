# Google 登录问题修复指南

## ❌ 问题描述

使用 Google 返回的 token 调用后端 API 时，收到错误：
```
Bad Request: Invalid Google token
```

**原因**：前端发送的是 **Access Token** (`ya29.xxx`)，但后端需要的是 **ID Token** (JWT 格式，通常以 `eyJ` 开头)。

## 🔍 两种 Token 的区别

### Access Token (`ya29.xxx`)
- **用途**：用于访问 Google API（如 Gmail API, Drive API 等）
- **格式**：`ya29.A0ATi6K2tOpwCHccEqqqFU9OiiYS1wg2z_fM1th2DpK9_...`
- **不包含**：用户身份信息（邮箱、姓名等）
- **不能用于**：身份验证

### ID Token (JWT 格式)
- **用途**：用于身份验证，证明用户身份
- **格式**：`eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...` (JWT，通常以 `eyJ` 开头)
- **包含**：用户信息（邮箱、姓名、Google ID 等）
- **可以用于**：后端验证用户身份

## ✅ 解决方案

### 方案 1: 使用 Google Identity Services (推荐)

这是 Google 推荐的新方法，使用 `@react-oauth/google` 或原生 JavaScript。

#### React 示例（使用 @react-oauth/google）

```bash
# 安装依赖
npm install @react-oauth/google
```

```jsx
// App.js 或入口文件
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <LoginComponent />
    </GoogleOAuthProvider>
  );
}
```

```jsx
// Login.jsx
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function Login() {
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      // ⚠️ 注意：这里 response 包含的是 access_token，不是 id_token
      // 我们需要使用 access_token 获取用户信息，然后发送到后端
      
      try {
        // 使用 access_token 获取用户信息
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );

        // 但是，更好的方法是直接获取 credential (ID Token)
        // 见下面的方案 2
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
    },
  });

  return (
    <button onClick={handleGoogleLogin}>
      使用 Google 登录
    </button>
  );
}
```

#### 更好的方法：使用 `credential` (ID Token)

```jsx
// Login.jsx - 使用 credential 方式
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function Login() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // ✅ credentialResponse.credential 就是 ID Token
      const idToken = credentialResponse.credential;
      
      // 发送 ID Token 到后端
      const response = await axios.post('http://localhost:3000/api/auth/google', {
        idToken: idToken, // ✅ 这是正确的 ID Token
      });

      // 保存后端返回的 JWT Token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // 跳转到主页
      window.location.href = '/';
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
    />
  );
}
```

### 方案 2: 使用原生 Google Identity Services

```html
<!-- 在 HTML 中引入 -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```html
<!-- 在 HTML 中添加 Google 登录按钮 -->
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>
```

```javascript
// JavaScript 处理函数
function handleCredentialResponse(response) {
  // ✅ response.credential 就是 ID Token
  const idToken = response.credential;
  
  // 发送到后端
  fetch('http://localhost:3000/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: idToken, // ✅ 发送 ID Token
    }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // 保存 token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // 跳转
      window.location.href = '/';
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
```

### 方案 3: 如果只有 Access Token，转换为 ID Token

如果你已经获取了 Access Token，可以：

1. **使用 Access Token 获取用户信息，然后手动创建账号**（不推荐，因为无法验证用户身份）

2. **重新实现，使用 ID Token**（推荐）

## 🔧 完整的前端实现示例

### React + @react-oauth/google

```jsx
// components/GoogleLoginButton.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GoogleLoginButton = () => {
  const handleSuccess = async (credentialResponse) => {
    try {
      console.log('Google ID Token received:', credentialResponse.credential.substring(0, 20) + '...');
      
      // 发送 ID Token 到后端
      const response = await axios.post(
        'http://localhost:3000/api/auth/google',
        {
          idToken: credentialResponse.credential,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // 保存 token 和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 更新应用状态（如果使用 Context 或 Redux）
        // setUser(response.data.user);
        // setIsAuthenticated(true);
        
        // 跳转到主页
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message);
      alert(error.response?.data?.message || '登录失败，请重试');
    }
  };

  const handleError = () => {
    console.error('Google login failed');
    alert('Google 登录失败，请重试');
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap // 可选：显示一键登录提示
    />
  );
};

export default GoogleLoginButton;
```

### 纯 JavaScript 实现

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="g_id_onload"
       data-client_id="YOUR_GOOGLE_CLIENT_ID"
       data-callback="handleCredentialResponse">
  </div>
  <div class="g_id_signin" 
       data-type="standard" 
       data-size="large" 
       data-theme="outline" 
       data-text="sign_in_with" 
       data-shape="rectangular">
  </div>

  <script>
    function handleCredentialResponse(response) {
      const idToken = response.credential;
      
      fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        } else {
          alert('登录失败: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('登录失败，请重试');
      });
    }
  </script>
</body>
</html>
```

## 🧪 测试步骤

1. **检查 ID Token 格式**
   ```javascript
   const idToken = credentialResponse.credential;
   console.log('ID Token starts with:', idToken.substring(0, 20));
   // 应该输出类似: "eyJhbGciOiJSUzI1NiIs"
   ```

2. **验证后端接收**
   - 在后端添加日志（已存在）：
   ```javascript
   console.log('Received ID Token:', idToken.substring(0, 20) + '...');
   ```

3. **检查环境变量**
   - 确保 `.env` 中有 `GOOGLE_CLIENT_ID`
   - 确保前端使用的 `client_id` 与后端 `GOOGLE_CLIENT_ID` 相同

## 📝 检查清单

- [ ] 前端使用的是 `credential` (ID Token)，不是 `access_token`
- [ ] ID Token 格式正确（以 `eyJ` 开头）
- [ ] 前端和后端使用相同的 `GOOGLE_CLIENT_ID`
- [ ] 后端 `.env` 文件配置正确
- [ ] 前端请求 URL 正确：`http://localhost:3000/api/auth/google`
- [ ] 请求体格式正确：`{ idToken: "..." }`

## 🚨 常见错误

### 错误 1: 使用 access_token 而不是 credential
```javascript
// ❌ 错误
const accessToken = response.access_token;
fetch('/api/auth/google', { idToken: accessToken }); // 这会失败

// ✅ 正确
const idToken = response.credential;
fetch('/api/auth/google', { idToken: idToken });
```

### 错误 2: client_id 不匹配
- 前端使用的 `client_id` 必须与后端 `.env` 中的 `GOOGLE_CLIENT_ID` 完全相同

### 错误 3: 未配置授权重定向 URI
- 在 Google Cloud Console 中，确保配置了正确的授权重定向 URI
- 开发环境：`http://localhost:3001`（或你的前端端口）

## 📚 参考资源

- [Google Identity Services 文档](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google 文档](https://www.npmjs.com/package/@react-oauth/google)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)

