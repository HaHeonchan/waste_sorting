const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 환경 변수가 없으면 로컬 MongoDB 사용
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/waste_sorting';
        
        const conn = await mongoose.connect(mongoURI, {
            // deprecated 옵션들 제거
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB 연결 실패:', error.message);
        console.log('MongoDB URI 확인 필요:', process.env.MONGODB_URI || '환경 변수 없음');
        // 연결 실패 시에도 서버를 종료하지 않고 계속 실행
        // process.exit(1);
    }
};

module.exports = connectDB; 