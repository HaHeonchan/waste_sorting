// 환경 변수 로드
require('dotenv').config();

const connectDB = require('./src/config/database');
const app = require('./src/app');

// MongoDB 연결 (비동기로 처리)
const startServer = async () => {
    try {
        // MongoDB 연결 시도
        await connectDB();
        console.log('✅ MongoDB 연결 성공');
    } catch (error) {
        console.log('⚠️ MongoDB 연결 실패했지만 서버는 계속 실행됩니다.');
    }
};

// 개발 환경에서만 서버 시작
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    startServer().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 개발 서버가 포트 ${PORT}에서 실행 중입니다.`);
            console.log(`📱 클라이언트: http://localhost:3000`);
            console.log(`🔧 서버 API: http://localhost:${PORT}`);
        });
    });
} else {
    // 프로덕션 환경에서는 서버를 시작하지 않음
    startServer();
}

module.exports = app;