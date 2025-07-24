// 환경 변수 로드 (프로젝트 루트의 .env 파일 사용)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}

const connectDB = require('./src/config/database');
const app = require('./src/app');

// MongoDB 연결 (비동기로 처리)
const startServer = async () => {
    try {
        // MongoDB 연결 시도
        await connectDB();
        console.log('✅ MongoDB 연결 성공');
    } catch (error) {
        console.error('❌ MongoDB 연결 실패:', error.message);
        console.log('MongoDB 연결 실패했지만 서버는 계속 실행됩니다.');
    }
};

// Vercel 환경이 아닐 때만 서버 시작
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3001;
    startServer().then(() => {
        // 서버 시작
        app.listen(PORT, () => {
            console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
            console.log(`📱 클라이언트: http://localhost:3000`);
            console.log(`🔧 서버 API: http://localhost:${PORT}`);
        });
    });
} else {
    // Vercel 환경에서는 MongoDB만 연결하고 서버는 시작하지 않음
    console.log('🚀 Vercel 환경에서 서버 실행 중...');
    console.log('📊 Vercel에서 포트는 자동으로 할당됩니다.');
    startServer();
}

module.exports = app;