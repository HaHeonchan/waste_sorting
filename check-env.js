#!/usr/bin/env node

/**
 * 환경변수 확인 스크립트
 * 서버 실행 전 필요한 환경변수들이 설정되어 있는지 확인합니다.
 */

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

// .env 파일 내용 확인
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('📋 설정된 환경변수:');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      const displayValue = key.includes('SECRET') || key.includes('KEY') 
        ? (value === 'your_openai_api_key' ? '❌ 설정되지 않음' : '✅ 설정됨')
        : value;
      console.log(`  ${key}: ${displayValue}`);
    }
  });
  
  // 필수 환경변수 확인
  const requiredVars = ['OPENAI_API_KEY'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('\n❌ 필수 환경변수가 설정되지 않았습니다:');
    missingVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log('\n⚠️  서버 실행 전 필수 환경변수를 설정해주세요!');
    process.exit(1);
  }
  
  console.log('\n✅ 모든 필수 환경변수가 설정되었습니다!');
  console.log('🚀 서버를 실행할 수 있습니다.');
  
} catch (error) {
  console.error('❌ .env 파일 읽기 오류:', error.message);
  process.exit(1);
} 