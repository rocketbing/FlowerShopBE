#!/usr/bin/env node

/**
 * 测试邮件发送功能的脚本
 * 使用方法: node scripts/testEmail.js
 */

require('dotenv').config();
const { sendActivationEmail, emailService, getEmailStatus } = require('../utils/emailService');

const testEmail = async () => {
  console.log('📧 Testing email configuration...\n');

  // Check configuration
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Email configuration is missing!');
    console.log('\nPlease add the following to your .env file:');
    console.log('SMTP_HOST=smtp.gmail.com (or smtp-mail.outlook.com for Hotmail)');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your_business_email@yourdomain.com');
    console.log('SMTP_PASS=your_app_password');
    console.log('FRONTEND_URL=http://localhost:3000');
    console.log('\n⚠️  SECURITY WARNING: Use a dedicated business email, NOT a personal email!');
    console.log('   ❌ Do NOT use: yourname@gmail.com, yourname@hotmail.com');
    console.log('   ✅ Use instead: noreply@yourdomain.com, support@yourdomain.com');
    process.exit(1);
  }

  console.log('Configuration found:');
  console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
  console.log(`  SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

  // Check email service status
  const status = getEmailStatus();
  console.log('Email Service Status:');
  console.log(`  Configured: ${status.configured}`);
  console.log(`  Host: ${status.host}`);
  console.log(`  Port: ${status.port}`);
  console.log(`  User: ${status.user}\n`);

  // Test email
  const testEmail = process.env.SMTP_USER; // Send to yourself
  const testName = 'Test User';
  const testCode = 'test_activation_code_123456789';

  try {
    console.log(`Sending test email to: ${testEmail}...\n`);
    await sendActivationEmail(testEmail, testName, testCode);
    console.log('\n✅ Test email sent successfully!');
    console.log(`Please check your inbox (${testEmail}) and spam folder.`);
  } catch (error) {
    console.error('\n❌ Failed to send test email:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Possible reasons:');
      console.error('  - Wrong email or password');
      console.error('  - For Gmail: Need to use App Password (not regular password)');
      console.error('  - For Hotmail/Outlook: Need to enable "Less secure app access" or use App Password');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Connection failed. Check:');
      console.error('  - SMTP_HOST is correct');
      console.error('  - SMTP_PORT is correct');
      console.error('  - Internet connection');
    }
    
    process.exit(1);
  }
};

testEmail();

