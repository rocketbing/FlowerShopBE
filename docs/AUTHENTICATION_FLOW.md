# 用户认证和身份识别流程

## 🔐 认证流程概述

当用户更新信息时，系统通过 **JWT Token** 来识别用户身份。整个过程如下：

```
前端请求 (带 Token)
    ↓
中间件 protect (验证 Token)
    ↓
从 Token 中提取用户 ID
    ↓
从数据库查找用户
    ↓
将用户信息存储在 req.user
    ↓
控制器使用 req.user.id 更新用户
```

## 📋 详细流程

### 1. 前端发送请求

前端在请求头中携带 JWT Token：

```javascript
// 前端代码示例
fetch('http://localhost:3000/api/userinfo', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // ✅ JWT Token 在这里
  },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '1234567890',
  }),
});
```

### 2. 路由层 - 使用 protect 中间件

```javascript
// routes/userInfoRoutes.js
router.put('/', protect, updateUserInfo);
//              ↑
//         protect 中间件会验证 Token
```

### 3. protect 中间件验证 Token

```javascript
// middleware/auth.js
exports.protect = async (req, res, next) => {
  // 步骤 1: 从请求头提取 Token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // 例如: "Bearer eyJhbGci..." → "eyJhbGci..."
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // 步骤 2: 验证 Token 并解码
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded 包含: { id: "user_id_here", iat: ..., exp: ... }

    // 步骤 3: 根据 ID 从数据库查找用户
    req.user = await User.findById(decoded.id).select('-password');
    // ✅ 用户信息现在存储在 req.user 中

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // 步骤 4: 继续到下一个中间件/控制器
    next();
  } catch (error) {
    // Token 无效或过期
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};
```

### 4. 控制器使用 req.user.id

```javascript
// controllers/userInfoController.js
exports.updateUserInfo = async (req, res, next) => {
  try {
    // ✅ req.user 已经在 protect 中间件中设置好了
    // ✅ req.user.id 就是当前登录用户的 ID
    
    const user = await User.findByIdAndUpdate(
      req.user.id, // ✅ 使用 Token 中的用户 ID
      updateFields,
      { new: true, runValidators: true }
    );
    
    // ...
  }
};
```

## 🔑 JWT Token 的结构

JWT Token 包含以下信息：

```json
{
  "id": "507f1f77bcf86cd799439011",  // 用户 ID（最重要）
  "iat": 1234567890,                  // 签发时间
  "exp": 1234567890                   // 过期时间
}
```

这些信息在用户登录时被编码到 Token 中：

```javascript
// models/User.js
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id },              // ✅ 用户 ID 存储在 Token 中
    process.env.JWT_SECRET,        // 密钥
    { expiresIn: process.env.JWT_EXPIRE } // 过期时间
  );
};
```

## ✅ 安全性保证

### 1. Token 验证
- ✅ Token 必须有效（未过期、签名正确）
- ✅ Token 必须由服务器签发的（使用 JWT_SECRET 验证）

### 2. 用户身份确认
- ✅ 从 Token 中提取用户 ID
- ✅ 从数据库验证用户存在
- ✅ 用户信息存储在 `req.user` 中

### 3. 防止篡改
- ✅ 用户只能更新自己的信息（使用 `req.user.id`）
- ✅ 无法通过修改请求体来更新其他用户的信息
- ✅ Token 包含签名，无法伪造

## 🚨 常见问题

### Q1: 如果用户修改了 Token 中的 ID 会怎样？

**A:** 不会成功。因为：
1. Token 包含签名，任何修改都会导致签名验证失败
2. `jwt.verify()` 会检查签名，如果 Token 被修改，验证会失败
3. 请求会被拒绝，返回 401 错误

### Q2: 用户能否通过修改请求体来更新其他用户的信息？

**A:** 不能。因为：
1. 控制器使用 `req.user.id`（来自 Token），而不是请求体中的 ID
2. 即使请求体包含其他用户的 ID，也会被忽略
3. 只能更新 Token 对应的用户信息

### Q3: Token 过期了怎么办？

**A:** 
1. `jwt.verify()` 会检测到 Token 过期
2. 返回 401 错误
3. 用户需要重新登录获取新的 Token

### Q4: 如何确保用户只能更新自己的信息？

**A:** 
- ✅ 使用 `req.user.id`（来自 Token），而不是请求参数
- ✅ 不接收用户 ID 作为请求参数
- ✅ 所有更新操作都基于 `req.user.id`

## 📝 代码示例对比

### ❌ 不安全的做法（不要这样做）

```javascript
// 危险：允许用户指定要更新的用户 ID
exports.updateUserInfo = async (req, res, next) => {
  const { userId, name, phone } = req.body; // ❌ 危险！
  
  const user = await User.findByIdAndUpdate(userId, { // ❌ 用户可以更新任何人的信息
    name,
    phone,
  });
};
```

### ✅ 安全的做法（当前实现）

```javascript
// 安全：使用 Token 中的用户 ID
exports.updateUserInfo = async (req, res, next) => {
  const { name, phone } = req.body; // ✅ 只接收要更新的字段
  
  // ✅ 使用 req.user.id（来自 Token），用户无法修改
  const user = await User.findByIdAndUpdate(req.user.id, {
    name,
    phone,
  });
};
```

## 🔄 完整请求流程示例

### 场景：用户更新自己的姓名

1. **前端发送请求**
   ```
   PUT /api/userinfo
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Content-Type: application/json
   
   {
     "name": "John Smith"
   }
   ```

2. **protect 中间件处理**
   ```javascript
   // 提取 Token
   token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   
   // 验证并解码
   decoded = { id: "507f1f77bcf86cd799439011", ... }
   
   // 查找用户
   req.user = { _id: "507f1f77bcf86cd799439011", name: "John Doe", ... }
   ```

3. **控制器更新**
   ```javascript
   // 使用 req.user.id 更新
   User.findByIdAndUpdate(
     "507f1f77bcf86cd799439011", // ✅ 来自 Token，无法伪造
     { name: "John Smith" }
   )
   ```

4. **返回结果**
   ```json
   {
     "success": true,
     "data": {
       "id": "507f1f77bcf86cd799439011",
       "name": "John Smith",
       ...
     }
   }
   ```

## 📚 相关文件

- **中间件**: `middleware/auth.js` - Token 验证逻辑
- **控制器**: `controllers/userInfoController.js` - 更新用户信息逻辑
- **路由**: `routes/userInfoRoutes.js` - 路由定义
- **模型**: `models/User.js` - JWT Token 生成方法

## 🎯 总结

**是的，系统完全基于 JWT Token 来识别用户身份：**

1. ✅ Token 包含用户 ID
2. ✅ protect 中间件验证 Token 并提取用户信息
3. ✅ 控制器使用 `req.user.id` 更新用户信息
4. ✅ 用户无法修改 Token（签名保护）
5. ✅ 用户只能更新自己的信息

这是标准的、安全的身份认证方式！

