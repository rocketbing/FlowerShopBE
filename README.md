# 花店后端 API (Flower Shop Backend API)

基于 Express.js 和 MongoDB 构建的在线花店后端系统。

## 功能特性

- ✅ 用户认证系统（注册、登录、JWT Token）
- ✅ 用户个人资料管理
- ✅ 商品管理（花卉列表、分类、详情）
- ✅ 购物车功能
- ✅ 订单管理（下单、订单状态跟踪）
- ✅ Stripe 支付集成

## 技术栈

- **Node.js** + **Express.js** - 后端框架
- **MongoDB** + **Mongoose** - 数据库
- **JWT** - 身份认证
- **Stripe** - 支付处理
- **bcryptjs** - 密码加密
- **express-validator** - 数据验证
- **Swagger** - API 文档

## 项目结构

```
flowershop_BE/
├── config/
│   ├── database.js          # MongoDB 连接配置
│   └── swagger.js           # Swagger 配置
├── controllers/              # 控制器 (业务逻辑)
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   └── paymentController.js
├── middleware/              # 中间件
│   ├── auth.js             # JWT 认证中间件
│   └── errorHandler.js     # 错误处理中间件
├── models/                  # 数据模型
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   └── Order.js
├── routes/                  # 路由
│   ├── healthRoutes.js
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   └── paymentRoutes.js
├── server.js                # 服务器入口文件
├── package.json
└── README.md
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/flowershop

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行。如果使用本地 MongoDB：

```bash
# macOS (使用 Homebrew)
brew services start mongodb-community

# 或直接运行
mongod
```

### 4. 启动服务器

```bash
# 开发模式（使用 nodemon）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 文档 (Swagger)

项目集成了 Swagger UI，提供了完整的 API 文档和交互式测试界面。

### 访问 Swagger 文档

启动服务器后，访问以下地址查看 API 文档：

```
http://localhost:3000/api-docs
```

### 功能特性

- 📚 完整的 API 端点文档
- 🔍 交互式 API 测试
- 🔐 支持 JWT Token 认证测试
- 📝 详细的请求/响应示例
- 🏷️ 按功能模块分类（Authentication, Products, Cart, Orders, Payments）

### 使用 Swagger UI 测试 API

1. 打开 `http://localhost:3000/api-docs`
2. 点击右上角的 **Authorize** 按钮
3. 输入 JWT Token（格式：`Bearer <your_token>` 或直接输入 token）
4. 点击 **Authorize** 确认
5. 现在可以测试所有需要认证的 API 端点

## API 端点

### 认证相关 (`/api/auth`)

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）
- `PUT /api/auth/profile` - 更新用户资料（需要认证）

### 商品相关 (`/api/products`)

- `GET /api/products` - 获取商品列表（支持分页、分类筛选、搜索）
- `GET /api/products/:id` - 获取单个商品详情
- `GET /api/products/category/:category` - 按分类获取商品
- `POST /api/products` - 创建商品（需要管理员权限）
- `PUT /api/products/:id` - 更新商品（需要管理员权限）
- `DELETE /api/products/:id` - 删除商品（需要管理员权限）

### 购物车相关 (`/api/cart`)

- `GET /api/cart` - 获取用户购物车（需要认证）
- `POST /api/cart` - 添加商品到购物车（需要认证）
- `PUT /api/cart/:itemId` - 更新购物车商品数量（需要认证）
- `DELETE /api/cart/:itemId` - 从购物车移除商品（需要认证）
- `DELETE /api/cart` - 清空购物车（需要认证）

### 订单相关 (`/api/orders`)

- `POST /api/orders` - 创建订单（需要认证）
- `GET /api/orders` - 获取用户的所有订单（需要认证）
- `GET /api/orders/:id` - 获取单个订单详情（需要认证）
- `GET /api/orders/all` - 获取所有订单（需要管理员权限）
- `PUT /api/orders/:id/status` - 更新订单状态（需要管理员权限）

### 支付相关 (`/api/payments`)

- `POST /api/payments/create-intent` - 创建 Stripe 支付意图（需要认证）
- `POST /api/payments/confirm` - 确认支付（需要认证）
- `POST /api/payments/webhook` - Stripe Webhook 端点（Stripe 调用）

### 健康检查

- `GET /api/health` - 检查 API 运行状态

### API 文档

- `GET /api-docs` - Swagger API 文档界面

## 使用示例

### 1. 用户注册

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### 2. 用户登录

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 3. 获取商品列表

```bash
GET /api/products?page=1&limit=10&category=roses&search=red
```

### 4. 添加商品到购物车

```bash
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id_here",
  "quantity": 2
}
```

### 5. 创建订单

```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "stripe"
}
```

### 6. 创建支付意图

```bash
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id_here"
}
```

## 认证方式

所有需要认证的端点都需要在请求头中包含 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

## 商品分类

支持以下商品分类：
- `roses` - 玫瑰
- `tulips` - 郁金香
- `lilies` - 百合
- `sunflowers` - 向日葵
- `orchids` - 兰花
- `carnations` - 康乃馨
- `mixed` - 混合花束
- `other` - 其他

## Stripe 支付配置

1. 在 [Stripe Dashboard](https://dashboard.stripe.com/) 获取 API 密钥
2. 将测试密钥添加到 `.env` 文件
3. 配置 Webhook 端点：`https://your-domain.com/api/payments/webhook`
4. 在 Stripe Dashboard 中获取 Webhook 签名密钥

## 创建管理员账号

有几种方式可以创建管理员账号：

### 方法 1: 使用创建管理员脚本（推荐）

```bash
# 交互式创建管理员（会提示输入信息）
node scripts/createAdmin.js

# 或者直接通过参数创建
node scripts/createAdmin.js --name "Admin User" --email admin@example.com --password admin123
```

### 方法 2: 将现有用户提升为管理员

如果你已经注册了普通用户，可以将其提升为管理员：

```bash
node scripts/promoteToAdmin.js user@example.com
```

### 方法 3: 手动修改数据库

使用 MongoDB Compass 或 mongosh：

```javascript
// 在 mongosh 中执行
use flowershop
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**注意**: 管理员账号可以：
- 创建、更新、删除商品
- 查看所有订单
- 更新订单状态

## 查看数据库数据

有几种方式可以查看数据库中的数据：

### 方法 1: 使用查看数据脚本（推荐）

项目提供了一个便捷的脚本来查看数据：

```bash
# 查看所有集合的统计信息
node scripts/viewData.js

# 查看指定集合的详细数据
node scripts/viewData.js users      # 查看所有用户
node scripts/viewData.js products  # 查看所有商品
node scripts/viewData.js carts     # 查看所有购物车
node scripts/viewData.js orders    # 查看所有订单
```

### 方法 2: 通过 API 端点

使用 Swagger UI (`http://localhost:3000/api-docs`) 或直接调用 API：

- **商品列表**: `GET http://localhost:3000/api/products`
- **用户信息**: `GET http://localhost:3000/api/auth/me` (需要认证)
- **订单列表**: `GET http://localhost:3000/api/orders` (需要认证)
- **购物车**: `GET http://localhost:3000/api/cart` (需要认证)

### 方法 3: 使用 MongoDB Compass（图形界面）

1. 下载并安装 [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. 连接字符串: `mongodb://localhost:27017`
3. 选择数据库: `flowershop`
4. 浏览集合: `users`, `products`, `carts`, `orders`

### 方法 4: 使用命令行 (mongosh)

```bash
# 连接到数据库
mongosh flowershop

# 在 mongosh 中执行：
show collections                    # 查看所有集合
db.users.find().pretty()           # 查看所有用户
db.products.find().pretty()        # 查看所有商品
db.carts.find().pretty()          # 查看所有购物车
db.orders.find().pretty()         # 查看所有订单

# 查看文档数量
db.users.countDocuments()
db.products.countDocuments()
```

## 错误处理

API 使用统一的错误响应格式：

```json
{
  "success": false,
  "message": "Error message here"
}
```

## 开发建议

1. 使用 Postman 或类似工具测试 API
2. 在生产环境中使用更强的 JWT_SECRET
3. 配置 CORS 以允许前端域名访问
4. 添加日志记录（如 winston）
5. 添加 API 限流保护
6. 使用环境变量管理敏感信息

## 许可证

ISC

