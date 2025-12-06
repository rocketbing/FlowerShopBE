# 邮箱两步验证设置指南

本指南将帮助你为发送验证邮件的邮箱账户设置两步验证（2-Step Authentication），并生成应用专用密码（App Password）。

## 🚨 重要安全提示

**⚠️ 禁止使用个人邮箱账户作为系统发件邮箱！**

- ❌ **不要使用**：`yourname@gmail.com`, `yourname@hotmail.com` 等个人邮箱
- ✅ **应该使用**：`noreply@yourdomain.com`, `support@yourdomain.com` 等专门的业务邮箱

**为什么不能使用个人邮箱？**
- 个人邮箱可能收到垃圾邮件/退信通知
- 安全风险：如果账户被入侵，会影响个人账户
- 违反邮件服务提供商政策，可能导致账户被暂停
- 系统会自动检测并阻止使用已知的个人邮箱（如 `torontobing@gmail.com`）

**解决方案：**
- ✅ **推荐：使用 Google Workspace 企业邮箱**（Google 企业邮箱）
- 为项目创建专门的业务邮箱账户
- 使用你拥有的域名创建邮箱（如 `noreply@yourdomain.com`）
- 或使用专门的服务邮箱（如 SendGrid, Mailgun 等专业邮件服务）

---

## 🏢 Google Workspace 企业邮箱配置（推荐）

Google Workspace（原 G Suite）企业邮箱是最推荐的方案，使用你自己的域名（如 `@yourcompany.com`）。

### 优势
- ✅ 使用自己的域名，更专业
- ✅ 与 Gmail 相同的 SMTP 配置，简单易用
- ✅ 企业级安全和管理功能
- ✅ 不会被误判为个人邮箱

### 配置步骤

#### 步骤 1: 确保已启用两步验证

1. **登录 Google Workspace 账户**
   - 访问：https://myaccount.google.com/security
   - 使用你的企业邮箱账户登录（如 `admin@yourcompany.com`）

2. **启用两步验证**
   - 在"登录 Google"部分，找到"两步验证"（2-Step Verification）
   - 如果未启用，点击"开始使用"并完成设置
   - 详细步骤请参考下面的"Gmail 两步验证设置"部分

#### 步骤 2: 生成应用专用密码

1. **访问应用专用密码页面**
   - 访问：https://myaccount.google.com/apppasswords
   - 或：Google 账户 → 安全性 → 两步验证 → 应用专用密码

2. **生成应用专用密码**
   - **应用**：选择"邮件"或"其他（自定义名称）"
   - **设备**：选择"其他（自定义名称）"，输入"Flower Shop Backend"
   - 点击"生成"

3. **复制应用专用密码**
   - Google 会生成一个 16 位的密码（格式：`xxxx xxxx xxxx xxxx`）
   - **重要**：立即复制这个密码，它只会显示一次！

#### 步骤 3: 配置 .env 文件

```env
# Google Workspace 企业邮箱配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourcompany.com  # 你的企业邮箱地址
SMTP_PASS=xxxx xxxx xxxx xxxx  # 应用专用密码（可以去掉空格）
FRONTEND_URL=http://localhost:3000
```

**配置说明：**
- `SMTP_HOST`: 使用 `smtp.gmail.com`（与普通 Gmail 相同）
- `SMTP_PORT`: 使用 `587`
- `SMTP_USER`: 你的 Google Workspace 企业邮箱地址（如 `noreply@yourcompany.com`）
- `SMTP_PASS`: 刚才生成的应用专用密码

#### 步骤 4: 验证配置

运行测试脚本验证配置：

```bash
node scripts/testEmail.js
```

如果看到 "✅ Email sent successfully!"，说明配置成功！

---

## 📋 为什么需要两步验证？

- ✅ **提高安全性**：即使密码泄露，账户仍然安全
- ✅ **支持应用专用密码**：第三方应用（如我们的后端）需要使用应用专用密码
- ✅ **Gmail/Outlook 要求**：使用 SMTP 发送邮件时，启用了两步验证的账户必须使用应用专用密码

---

## 🔵 Gmail 个人邮箱两步验证设置（不推荐用于生产环境）

⚠️ **注意**：虽然可以配置 Gmail 个人邮箱，但强烈建议使用 Google Workspace 企业邮箱。个人邮箱仅用于开发测试。

### 步骤 1: 启用两步验证

**重要提示**：如果你看到 "Passkeys and security keys"，这是 Google 的新式验证方式。要生成应用专用密码，你需要启用传统的"两步验证"（2-Step Verification）。

#### 方法 1: 在电脑浏览器上设置（推荐）

1. **访问 Google 账户安全页面**
   - 在电脑浏览器中打开：https://myaccount.google.com/security
   - 或直接访问：https://myaccount.google.com/signinoptions/two-step-verification

2. **登录你的 Google 账户**
   - 确保使用要用于发送邮件的 Gmail 账户登录

3. **找到"两步验证"选项**
   - 在"登录 Google"部分，向下滚动找到"两步验证"（2-Step Verification）
   - 如果显示"关闭"或"未启用"，点击进入设置
   - 如果显示"Passkeys and security keys"，继续向下找"两步验证"

4. **开始设置两步验证**
   - 点击"开始使用"或"Get started"
   - 按照提示完成设置

#### 方法 2: 在手机上设置

1. **打开 Google 应用或访问网页**
   - 在手机浏览器中打开：https://myaccount.google.com/security
   - 或使用 Google 应用

2. **找到两步验证设置**
   - 在手机上，可能需要：
     - 点击菜单（三条横线）
     - 选择"安全性"或"Security"
     - 找到"两步验证"（2-Step Verification）
   - **注意**：如果只看到 "Passkeys"，需要切换到桌面版网页或使用电脑

3. **启用两步验证**
   - 点击"两步验证"选项
   - 按照提示完成设置

5. **选择验证方式**
   - **推荐：Google Authenticator 应用**
     - 在手机上安装 Google Authenticator
     - 扫描二维码
     - 输入验证码确认
   - **备选：短信验证码**
     - 输入手机号码
     - 接收并输入验证码
   - **也可以使用 Passkeys**（但建议同时启用传统两步验证）

6. **完成设置**
   - 按照提示完成设置
   - 保存备用验证码（重要！）
   - **确认"两步验证"已启用**（状态应显示为"开启"）

### 步骤 2: 生成应用专用密码

**前提条件**：必须先启用"两步验证"（不是 Passkeys），才能生成应用专用密码。

1. **访问应用专用密码页面**
   - **在电脑浏览器中访问**：https://myaccount.google.com/apppasswords
   - 或：Google 账户 → 安全性 → 两步验证 → 应用专用密码
   - **注意**：如果页面显示"无法使用应用专用密码"，说明两步验证未启用

2. **如果看不到"应用专用密码"选项**
   - 确认已启用传统的"两步验证"（不是 Passkeys）
   - 如果只启用了 Passkeys，需要额外启用两步验证：
     - 访问：https://myaccount.google.com/signinoptions/two-step-verification
     - 点击"开始使用"
     - 完成设置后，应用专用密码选项就会出现

3. **选择应用和设备**
   - **应用**：选择"邮件"或"其他（自定义名称）"
   - **设备**：选择"其他（自定义名称）"，输入"Flower Shop Backend"
   - 点击"生成"

4. **复制应用专用密码**
   - Google 会生成一个 16 位的密码（格式：`xxxx xxxx xxxx xxxx`）
   - **重要**：立即复制这个密码，它只会显示一次！
   - 这个密码就是你要在 `.env` 文件中使用的 `SMTP_PASS`

5. **更新 .env 文件**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_business_email@yourdomain.com  # ⚠️ 使用业务邮箱，不要使用个人邮箱！
   SMTP_PASS=xxxx xxxx xxxx xxxx  # 使用刚才生成的应用专用密码（可以去掉空格）
   ```
   
   **⚠️ 重要**：确保 `SMTP_USER` 是业务邮箱，不是个人邮箱（如 `yourname@gmail.com`）

### 步骤 3: 验证设置

运行测试脚本验证配置：

```bash
node scripts/testEmail.js
```

如果看到 "✅ Email sent successfully!"，说明配置成功！

---

## 🔴 Hotmail/Outlook 两步验证设置

### 步骤 1: 启用两步验证

1. **访问 Microsoft 账户安全页面**
   - 访问：https://account.microsoft.com/security
   - 登录你的 Microsoft 账户（Hotmail/Outlook 邮箱）

2. **启用两步验证**
   - 在"安全基础"部分，找到"两步验证"
   - 点击"启用"或"Turn on"

3. **选择验证方式**
   - **推荐：Microsoft Authenticator 应用**
     - 在手机上安装 Microsoft Authenticator
     - 扫描二维码或手动输入密钥
   - **备选：短信验证码**
     - 输入手机号码
     - 接收并输入验证码

4. **完成设置**
   - 按照提示完成设置
   - 保存备用验证码

### 步骤 2: 生成应用专用密码

1. **访问应用专用密码页面**
   - 访问：https://account.microsoft.com/security/app-passwords
   - 或：Microsoft 账户 → 安全性 → 高级安全选项 → 应用专用密码

2. **创建应用专用密码**
   - 点击"创建新的应用专用密码"
   - **应用名称**：输入"Flower Shop Backend"
   - 点击"生成"

3. **复制应用专用密码**
   - Microsoft 会生成一个密码
   - **重要**：立即复制这个密码，它只会显示一次！
   - 这个密码就是你要在 `.env` 文件中使用的 `SMTP_PASS`

4. **更新 .env 文件**
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=your_business_email@yourdomain.com  # ⚠️ 使用业务邮箱，不要使用个人邮箱！
   SMTP_PASS=生成的应用专用密码
   ```
   
   **⚠️ 重要**：确保 `SMTP_USER` 是业务邮箱，不是个人邮箱（如 `yourname@hotmail.com`）

### 步骤 3: 验证设置

运行测试脚本验证配置：

```bash
node scripts/testEmail.js
```

---

## 🔧 其他邮箱服务商

### Yahoo Mail

1. **启用两步验证**
   - 访问：https://login.yahoo.com/account/security
   - 启用"两步验证"

2. **生成应用专用密码**
   - 访问：https://login.yahoo.com/account/security/app-passwords
   - 生成应用专用密码

3. **配置 .env**
   ```env
   SMTP_HOST=smtp.mail.yahoo.com
   SMTP_PORT=587
   SMTP_USER=your_business_email@yourdomain.com  # ⚠️ 使用业务邮箱，不要使用个人邮箱！
   SMTP_PASS=应用专用密码
   ```
   
   **⚠️ 重要**：确保 `SMTP_USER` 是业务邮箱，不是个人邮箱

### 企业邮箱（Office 365 / Exchange）

1. **联系 IT 管理员**
   - 企业邮箱通常由 IT 部门管理
   - 请求生成应用专用密码或启用 SMTP 访问

2. **配置 .env**
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=your_business_email@yourdomain.com  # ⚠️ 使用业务邮箱
   SMTP_PASS=应用专用密码或IT提供的密码
   ```

---

## ⚠️ 常见问题

### Q1: 为什么不能使用普通密码？

**A:** 启用了两步验证的账户，Google/Microsoft 会阻止第三方应用使用普通密码登录。必须使用应用专用密码。

### Q2: 应用专用密码在哪里查看？

**A:** 
- **Google Workspace / Gmail**: https://myaccount.google.com/apppasswords
- **Outlook**: https://account.microsoft.com/security/app-passwords

### Q2.1: Google Workspace 和 Gmail 的配置有什么区别？

**A:** 配置完全相同！Google Workspace 企业邮箱使用与 Gmail 相同的 SMTP 服务器：
- **SMTP_HOST**: `smtp.gmail.com`（相同）
- **SMTP_PORT**: `587`（相同）
- **SMTP_USER**: `your_email@yourdomain.com`（企业邮箱地址，不是 @gmail.com）
- **SMTP_PASS**: 应用专用密码（生成方式相同）

唯一的区别是邮箱地址：Google Workspace 使用你自己的域名（如 `@yourcompany.com`），而 Gmail 使用 `@gmail.com`。

### Q3: 忘记了应用专用密码怎么办？

**A:** 删除旧的应用专用密码，重新生成一个新的即可。

### Q4: 可以为一个账户生成多个应用专用密码吗？

**A:** 可以！每个应用可以有自己的专用密码。例如：
- "Flower Shop Backend" - 用于后端服务器
- "Flower Shop Development" - 用于开发环境

### Q5: 应用专用密码安全吗？

**A:** 是的！应用专用密码：
- ✅ 只能用于特定应用
- ✅ 可以随时撤销
- ✅ 不会影响主账户密码
- ✅ 即使泄露，也只能访问邮件发送功能

### Q6: 我只看到 "Passkeys and security keys"，没有看到"两步验证"选项

**A:** Passkeys 是 Google 的新式验证方式，但要生成应用专用密码，需要启用传统的"两步验证"：

1. **在电脑浏览器中访问**：https://myaccount.google.com/signinoptions/two-step-verification
2. 如果页面显示 Passkeys，向下滚动找到"两步验证"选项
3. 点击"开始使用"启用两步验证
4. 完成设置后，应用专用密码选项就会出现

**注意**：Passkeys 和两步验证可以同时启用，它们不冲突。

### Q7: 测试时出现 "535-5.7.8 Username and Password not accepted" 错误

**A:** 这通常意味着：
1. ❌ 使用了普通密码而不是应用专用密码
2. ❌ 应用专用密码复制错误（注意空格）
3. ❌ 两步验证未启用

**解决方法**：
1. 确认已启用两步验证
2. 重新生成应用专用密码
3. 确保 `.env` 文件中的密码正确（可以去掉空格）

### Q8: 如何撤销应用专用密码？

**A:** 
- **Gmail**: 访问应用专用密码页面，点击对应密码的"删除"
- **Outlook**: 访问应用专用密码页面，点击"删除"

---

## 📝 完整配置示例

### Google Workspace 企业邮箱配置示例（推荐）

```env
# .env 文件 - Google Workspace 企业邮箱
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourcompany.com  # 你的 Google Workspace 企业邮箱地址
SMTP_PASS=abcd efgh ijkl mnop  # Google Workspace 应用专用密码（16位，可以去掉空格）
FRONTEND_URL=http://localhost:3001
```

**✅ 这是推荐的配置方式！**
- 使用你自己的域名（如 `@yourcompany.com`）
- 企业级安全和管理
- 不会被误判为个人邮箱

### Gmail 个人邮箱配置示例（仅用于开发测试，不推荐生产环境）

```env
# .env 文件 - Gmail 个人邮箱（仅开发测试）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com  # ⚠️ 仅用于开发测试，生产环境请使用企业邮箱
SMTP_PASS=abcd efgh ijkl mnop  # Gmail 应用专用密码（16位，可以去掉空格）
FRONTEND_URL=http://localhost:3001
```

**⚠️ 重要提示**：
- ❌ 生产环境不要使用：`yourname@gmail.com` 等个人邮箱
- ✅ 生产环境应该使用：`noreply@yourcompany.com` 等 Google Workspace 企业邮箱

### Hotmail/Outlook 配置示例

```env
# .env 文件
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com  # ⚠️ 使用业务邮箱，不要使用个人邮箱！
SMTP_PASS=生成的Outlook应用专用密码
FRONTEND_URL=http://localhost:3001
```

**⚠️ 重要提示**：
- ❌ 不要使用：`yourname@hotmail.com`, `flowershop@hotmail.com` 等个人邮箱
- ✅ 应该使用：`noreply@yourdomain.com`, `support@yourdomain.com` 等业务邮箱

---

## ✅ 验证清单

完成以下步骤后，你的邮箱配置就完成了：

- [ ] 已启用两步验证
- [ ] 已生成应用专用密码
- [ ] 已更新 `.env` 文件
- [ ] 已运行 `node scripts/testEmail.js` 测试
- [ ] 测试邮件发送成功
- [ ] 用户注册时能收到激活邮件

---

## 🔒 安全建议

1. **定期更换应用专用密码**
   - 建议每 6 个月更换一次

2. **使用专用邮箱**
   - 建议使用专门用于发送系统邮件的邮箱账户
   - 不要使用个人主要邮箱

3. **保护 .env 文件**
   - 确保 `.env` 文件在 `.gitignore` 中
   - 不要将 `.env` 文件提交到 Git

4. **监控异常活动**
   - 定期检查邮箱的登录活动
   - 如果发现异常，立即撤销应用专用密码

---

## 📚 相关资源

- [Gmail 应用专用密码帮助](https://support.google.com/accounts/answer/185833)
- [Microsoft 应用专用密码帮助](https://support.microsoft.com/zh-cn/account-billing/%E4%BD%BF%E7%94%A8%E5%BA%94%E7%94%A8%E4%B8%93%E7%94%A8%E5%AF%86%E7%A0%81%E7%99%BB%E5%BD%95%E5%88%B0-microsoft-%E8%B4%A6%E6%88%B7-5896ed9b-4261-e186-0cd1-3eabfac95b25)
- [项目邮件配置文档](../README.md#邮件配置说明)

---

## 🆘 需要帮助？

如果遇到问题：

1. 运行测试脚本：`node scripts/testEmail.js`
2. 查看错误信息
3. 检查 `.env` 文件配置
4. 确认两步验证已启用
5. 确认使用的是应用专用密码，不是普通密码

