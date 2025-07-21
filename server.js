const app = require('./server/src/app');

const PORT = process.env.PORT || 3001;  // ✅ 여기 3001로 바꾸기

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});