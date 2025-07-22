const connectDB = require('./server/config/db');
const app = require('./server/src/app');

const PORT = process.env.PORT || 3001;

connectDB(); // MongoDB 연결

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
