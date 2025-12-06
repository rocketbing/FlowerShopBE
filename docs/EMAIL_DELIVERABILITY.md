# 邮件送达率优化指南

## 为什么邮件会被标记为垃圾邮件？

邮件被标记为垃圾邮件通常由以下原因导致：

### 1. 使用个人邮箱发送
- ❌ **问题**：使用 `@gmail.com`, `@hotmail.com` 等个人邮箱发送系统邮件
- ✅ **解决方案**：使用 Google Workspace 企业邮箱（`@yourdomain.com`）

### 2. 缺少邮件认证记录
- ❌ **问题**：域名没有配置 SPF、DKIM、DMARC 记录
- ✅ **解决方案**：为域名配置邮件认证记录

### 3. 邮件内容触发过滤器
- ❌ **问题**：邮件内容包含垃圾邮件关键词、过多链接、全大写标题等
- ✅ **解决方案**：优化邮件内容格式

### 4. 发件人信誉度低
- ❌ **问题**：新邮箱或发送量少的邮箱信誉度低
- ✅ **解决方案**：使用信誉度高的企业邮箱，逐步建立发送历史

---

## 解决方案

### 方案 1: 使用 Google Workspace 企业邮箱（推荐）

**优势：**
- ✅ 使用自己的域名，更专业
- ✅ 自动配置 SPF 和 DKIM
- ✅ 更高的送达率
- ✅ 不会被误判为个人邮箱

**配置步骤：**
1. 注册 Google Workspace（或使用现有账户）
2. 创建专门的系统邮箱（如 `noreply@yourdomain.com`）
3. 启用两步验证并生成应用专用密码
4. 更新 `.env` 文件：
   ```env
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASS=your_app_password
   ```

### 方案 2: 配置域名邮件认证记录

如果你使用自己的域名邮箱，需要配置以下 DNS 记录：

#### SPF 记录（Sender Policy Framework）

在域名的 DNS 设置中添加 TXT 记录：

```
类型: TXT
名称: @ (或 yourdomain.com)
值: v=spf1 include:_spf.google.com ~all
```

**说明：**
- `include:_spf.google.com` - 允许 Google 邮件服务器发送邮件
- `~all` - 其他服务器发送的邮件标记为可能伪造（soft fail）

#### DKIM 记录（DomainKeys Identified Mail）

Google Workspace 会自动生成 DKIM 密钥。在 Google Workspace 管理控制台：
1. 访问：Apps → Google Workspace → Gmail
2. 找到 "Authenticate email" 部分
3. 生成 DKIM 密钥
4. 将生成的 TXT 记录添加到域名 DNS

#### DMARC 记录（Domain-based Message Authentication）

添加 TXT 记录：

```
类型: TXT
名称: _dmarc
值: v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
```

**说明：**
- `p=none` - 初始阶段不拒绝未通过验证的邮件（仅监控）
- 逐步改为 `p=quarantine`（隔离）或 `p=reject`（拒绝）

### 方案 3: 优化邮件内容

#### 避免触发垃圾邮件过滤器的做法：

✅ **应该做的：**
- 使用清晰、专业的邮件主题
- 保持文本和 HTML 内容平衡
- 使用相对链接而不是绝对链接（如果可能）
- 包含明确的发件人信息
- 提供退订链接

❌ **避免做的：**
- 全大写标题（如 "RESET YOUR PASSWORD!!!"）
- 过多感叹号或特殊字符
- 垃圾邮件关键词（"FREE", "CLICK NOW", "URGENT" 等）
- 只有图片没有文字
- 可疑的链接或附件

### 方案 4: 使用专业邮件服务（高级）

对于生产环境，考虑使用专业邮件服务：

- **SendGrid** - 提供高送达率和详细分析
- **Mailgun** - 开发者友好的邮件 API
- **Amazon SES** - AWS 的邮件服务
- **Postmark** - 专注于交易邮件

这些服务通常：
- ✅ 自动处理 SPF/DKIM/DMARC
- ✅ 提供详细的送达率分析
- ✅ 自动处理退信和投诉
- ✅ 更高的送达率

---

## 当前配置的改进

### 已添加的改进：

1. **邮件头信息**
   - 添加了 `X-Mailer` 标识
   - 添加了 `Reply-To` 地址
   - 添加了 `Message-ID` 用于追踪

2. **邮件格式**
   - 使用专业的 HTML 模板
   - 包含清晰的文本版本
   - 避免垃圾邮件关键词

### 建议的下一步：

1. **迁移到企业邮箱**
   - 从 `fauxflowersupply@gmail.com` 迁移到 `noreply@yourdomain.com`

2. **配置 DNS 记录**
   - 添加 SPF 记录
   - 配置 DKIM（如果使用 Google Workspace，自动配置）
   - 添加 DMARC 记录

3. **监控送达率**
   - 检查邮件是否到达收件箱
   - 监控垃圾邮件投诉率
   - 逐步建立发送信誉

---

## 如何检查邮件认证状态

### 在线工具：

1. **MXToolbox** - https://mxtoolbox.com/
   - 检查 SPF 记录
   - 检查 DMARC 记录
   - 检查黑名单状态

2. **Mail-Tester** - https://www.mail-tester.com/
   - 发送测试邮件
   - 获得详细的垃圾邮件评分
   - 提供改进建议

3. **Google Postmaster Tools** - https://postmaster.google.com/
   - 监控 Gmail 送达率
   - 查看垃圾邮件投诉率
   - 分析发送数据

---

## 临时解决方案

如果暂时无法迁移到企业邮箱，可以：

1. **将发件人添加到联系人**
   - 在 Hotmail 中将 `fauxflowersupply@gmail.com` 添加到联系人
   - 标记为"不是垃圾邮件"

2. **检查垃圾邮件文件夹**
   - 定期检查垃圾邮件文件夹
   - 将重要邮件标记为"不是垃圾邮件"

3. **使用邮件过滤器**
   - 在 Hotmail 中创建规则
   - 自动将来自该地址的邮件移到收件箱

---

## 总结

**最佳实践：**
1. ✅ 使用 Google Workspace 企业邮箱
2. ✅ 配置 SPF、DKIM、DMARC 记录
3. ✅ 优化邮件内容格式
4. ✅ 监控送达率和投诉率
5. ✅ 逐步建立发送信誉

**当前状态：**
- ⚠️ 使用个人 Gmail 邮箱（建议迁移）
- ✅ 邮件格式已优化
- ⚠️ 需要配置 DNS 记录（如果使用企业邮箱）

