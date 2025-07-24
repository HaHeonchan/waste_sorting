#!/bin/bash

# 🚀 백엔드 배포 스크립트
echo "=== 백엔드 배포 시작 ==="

# 1. 백엔드 디렉토리로 이동
cd server

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 3. 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. env.example을 복사하여 .env 파일을 생성하세요."
    echo "cp env.example .env"
    exit 1
fi

# 4. Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI 설치 중..."
    npm install -g vercel
fi

# 5. Vercel 로그인 확인
if [ ! -f ~/.vercel/auth.json ]; then
    echo "🔐 Vercel 로그인이 필요합니다."
    vercel login
fi

# 6. 배포
echo "🚀 Vercel에 배포 중..."
vercel --prod

echo "✅ 백엔드 배포 완료!"
echo "📝 다음 단계:"
echo "1. Vercel 대시보드에서 환경 변수 설정"
echo "2. 프론트엔드 배포"
echo "3. CORS 설정 확인" 