const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    console.log('ℹ️ 이미 MongoDB에 연결되어 있음.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser / useUnifiedTopology 더 이상 필요 없음 (경고 제거)
    });
    console.log(`✅ MongoDB 연결 성공: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err);
    process.exit(1);
  }
};

module.exports = connectDB;