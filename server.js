const app = require('./src/app');

const PORT = 3000; // 기본적으로 localhost:3000에서 실행

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});