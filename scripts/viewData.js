#!/usr/bin/env node

/**
 * 快速查看数据库数据的脚本
 * 使用方法: node scripts/viewData.js [collection]
 * 
 * 示例:
 *   node scripts/viewData.js          # 查看所有集合的统计
 *   node scripts/viewData.js users    # 查看所有用户
 *   node scripts/viewData.js products # 查看所有商品
 *   node scripts/viewData.js carts    # 查看所有购物车
 *   node scripts/viewData.js orders   # 查看所有订单
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const viewData = async () => {
  await connectDB();

  const collection = process.argv[2];

  if (!collection) {
    // 显示所有集合的统计信息
    console.log('📊 数据库统计信息\n');
    console.log('='.repeat(50));
    
    const collections = ['users', 'products', 'carts', 'orders'];
    
    for (const coll of collections) {
      try {
        const count = await mongoose.connection.db.collection(coll).countDocuments();
        console.log(`📦 ${coll.padEnd(10)} : ${count} 条记录`);
      } catch (error) {
        console.log(`📦 ${coll.padEnd(10)} : 集合不存在`);
      }
    }
    
    console.log('='.repeat(50));
    console.log('\n💡 提示: 使用 node scripts/viewData.js [collection] 查看详细数据');
    console.log('   例如: node scripts/viewData.js products\n');
  } else {
    // 显示指定集合的数据
    try {
      const data = await mongoose.connection.db.collection(collection).find({}).toArray();
      
      if (data.length === 0) {
        console.log(`\n📭 ${collection} 集合中没有数据\n`);
      } else {
        console.log(`\n📋 ${collection} 集合 (共 ${data.length} 条记录)\n`);
        console.log('='.repeat(50));
        console.log(JSON.stringify(data, null, 2));
        console.log('='.repeat(50));
      }
    } catch (error) {
      console.error(`❌ 错误: ${error.message}`);
      console.log('\n💡 可用的集合: users, products, carts, orders');
    }
  }

  mongoose.connection.close();
  process.exit(0);
};

viewData();

