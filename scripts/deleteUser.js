#!/usr/bin/env node

/**
 * 删除用户的脚本
 * 使用方法: 
 *   node scripts/deleteUser.js <email>           # 通过邮箱删除
 *   node scripts/deleteUser.js --id <user_id>   # 通过ID删除
 *   node scripts/deleteUser.js --all             # 删除所有用户（危险操作）
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const deleteUser = async () => {
  await connectDB();

  const args = process.argv.slice(2);

  try {
    // Delete all users (dangerous)
    if (args.includes('--all')) {
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('📭 数据库中没有用户');
        mongoose.connection.close();
        process.exit(0);
      }

      console.log(`⚠️  警告：即将删除所有 ${count} 个用户！`);
      console.log('   这将同时删除相关的购物车和订单数据。\n');
      
      // In a real scenario, you might want to add a confirmation prompt
      await User.deleteMany({});
      await Cart.deleteMany({});
      // Note: Orders are usually kept for records, but you can delete them too
      // await Order.deleteMany({});
      
      console.log(`✅ 已删除所有 ${count} 个用户`);
      mongoose.connection.close();
      process.exit(0);
    }

    // Delete by ID
    if (args.includes('--id') && args[args.indexOf('--id') + 1]) {
      const userId = args[args.indexOf('--id') + 1];
      
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('❌ 无效的用户ID格式');
        mongoose.connection.close();
        process.exit(1);
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error(`❌ 未找到ID为 ${userId} 的用户`);
        mongoose.connection.close();
        process.exit(1);
      }

      // Delete related data
      await Cart.deleteOne({ user: userId });
      await User.findByIdAndDelete(userId);

      console.log(`✅ 已删除用户: ${user.email} (${user.name})`);
      mongoose.connection.close();
      process.exit(0);
    }

    // Delete by email (default)
    const email = args[0];
    if (!email) {
      console.error('❌ 请提供用户邮箱或使用 --id <user_id> 或 --all');
      console.log('\n使用方法:');
      console.log('  node scripts/deleteUser.js <email>');
      console.log('  node scripts/deleteUser.js --id <user_id>');
      console.log('  node scripts/deleteUser.js --all');
      mongoose.connection.close();
      process.exit(1);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`❌ 未找到邮箱为 ${email} 的用户`);
      mongoose.connection.close();
      process.exit(1);
    }

    // Delete related data
    await Cart.deleteOne({ user: user._id });
    // Note: Orders are usually kept for records
    // If you want to delete orders too, uncomment the next line:
    // await Order.deleteMany({ user: user._id });

    await User.findByIdAndDelete(user._id);

    console.log(`✅ 已删除用户: ${user.email} (${user.name})`);
    console.log(`   ID: ${user._id}`);
    console.log(`   角色: ${user.role}`);
    console.log(`   邮箱已验证: ${user.emailVerified ? '是' : '否'}`);
  } catch (error) {
    console.error('❌ 删除用户失败:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

deleteUser();

