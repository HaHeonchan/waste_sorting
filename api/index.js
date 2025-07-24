// Vercel 서버리스 함수
const connectDB = require('../server/src/config/database');
const app = require('../server/src/app');

// MongoDB 연결
let isConnected = false;

const connectToDatabase = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('MongoDB 연결 성공');
    } catch (error) {
      console.log('MongoDB 연결 실패:', error.message);
    }
  }
};

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 데이터베이스 연결
  await connectToDatabase();

  // Express 앱으로 요청 처리
  return app(req, res);
}; 