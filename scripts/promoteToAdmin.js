#!/usr/bin/env node

/**
 * 将现有用户提升为管理员的脚本
 * 使用方法: node scripts/promoteToAdmin.js <email>
 * 
 * 示例:
 *   node scripts/promoteToAdmin.js user@example.com
 */

require('dotenv').config();
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

const promoteToAdmin = async () => {
  await connectDB();

  const email = process.argv[2];

  if (!email) {
    console.error('❌ 请提供用户邮箱');
    console.log('\n使用方法: node scripts/promoteToAdmin.js <email>');
    console.log('示例: node scripts/promoteToAdmin.js user@example.com');
    mongoose.connection.close();
    process.exit(1);
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ 未找到邮箱为 ${email} 的用户`);
      mongoose.connection.close();
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`⚠️  用户 ${email} 已经是管理员了`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`✅ 用户 ${email} 已成功提升为管理员`);
    }

    console.log(`\n📧 邮箱: ${user.email}`);
    console.log(`👤 姓名: ${user.name}`);
    console.log(`🔑 角色: ${user.role}`);
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

promoteToAdmin();

