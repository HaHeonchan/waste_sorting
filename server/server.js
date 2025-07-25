// 환경 변수 로드 (프로젝트 루트의 .env 파일 사용)
require('dotenv').config({ path: '../.env' });

const connectDB = require('./src/config/database');
const app = require('./src/app');
const PORT = process.env.PORT || 3001;

// MongoDB 연결 (비동기로 처리)
const startServer = async () => {
    try {
        // MongoDB 연결 시도
        await connectDB();
    } catch (error) {
        console.log('MongoDB 연결 실패했지만 서버는 계속 실행됩니다.');
    }
    
    // 서버 시작
    app.listen(PORT, () => {
        console.log(`🔧 서버 API: ${REACT_APP_API_URL}`);
    });
};

startServer();

module.exports = app;