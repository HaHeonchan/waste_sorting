// 환경 변수 로드
require('dotenv').config();

const connectDB = require('./config/database');
const app = require('./src/app');
const PORT = process.env.PORT || 3000;

// MongoDB 연결
connectDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});