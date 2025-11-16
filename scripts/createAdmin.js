#!/usr/bin/env node

/**
 * 创建管理员账号的脚本
 * 使用方法: node scripts/createAdmin.js
 * 
 * 或者带参数:
 * node scripts/createAdmin.js --email admin@example.com --password admin123 --name "Admin User"
 */

require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdmin = async () => {
  await connectDB();

  // 从命令行参数获取信息
  const args = process.argv.slice(2);
  let email, password, name;

  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[i + 1];
    }
  }

  try {
    // 如果没有通过参数提供，则交互式输入
    if (!name) {
      name = await question('请输入管理员姓名: ');
    }
    if (!email) {
      email = await question('请输入管理员邮箱: ');
    }
    if (!password) {
      password = await question('请输入管理员密码 (至少6位): ');
    }

    // 验证输入
    if (!name || !email || !password) {
      console.error('❌ 所有字段都是必填的');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ 密码长度至少为6位');
      process.exit(1);
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('\n⚠️  该邮箱已存在，正在更新为管理员...');
      
      // 更新现有用户为管理员
      existingUser.role = 'admin';
      if (password) {
        existingUser.password = password; // 密码会在保存时自动加密
      }
      await existingUser.save();
      
      console.log('✅ 用户已更新为管理员');
      console.log(`\n📧 邮箱: ${existingUser.email}`);
      console.log(`👤 姓名: ${existingUser.name}`);
      console.log(`🔑 角色: ${existingUser.role}`);
    } else {
      // 创建新管理员
      const admin = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'admin',
      });

      console.log('\n✅ 管理员账号创建成功！');
      console.log(`\n📧 邮箱: ${admin.email}`);
      console.log(`👤 姓名: ${admin.name}`);
      console.log(`🔑 角色: ${admin.role}`);
      console.log(`🆔 ID: ${admin._id}`);
    }

    console.log('\n💡 提示: 现在可以使用此账号登录，登录后即可访问管理员功能');
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
    if (error.code === 11000) {
      console.error('   该邮箱已被使用');
    }
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();

