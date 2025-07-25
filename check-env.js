const fs = require('fs');
const path = require('path');

console.log('🔍 환경변수 확인 시작...\n');

// .env 파일 존재 여부 확인
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log(`📁 .env 파일: ${envExists ? '✅ 존재함' : '❌ 존재하지 않음'}`);

if (!envExists) {
  console.log('\n⚠️  .env 파일이 없습니다!');
  process.exit(1);
}