#!/bin/bash

# 🚀 프론트엔드 배포 스크립트
echo "=== 프론트엔드 배포 시작 ==="

# 1. 프론트엔드 디렉토리로 이동
cd client

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 3. 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. env.example을 복사하여 .env 파일을 생성하세요."
    echo "cp env.example .env"
    echo "그리고 REACT_APP_API_URL을 백엔드 URL로 설정하세요."
    exit 1
fi

# 4. 빌드 테스트
echo "🔨 빌드 테스트 중..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패! 문제를 해결한 후 다시 시도하세요."
    exit 1
fi

# 5. Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI 설치 중..."
    npm install -g vercel
fi

# 6. Vercel 로그인 확인
if [ ! -f ~/.vercel/auth.json ]; then
    echo "🔐 Vercel 로그인이 필요합니다."
    vercel login
fi

# 7. 배포
echo "🚀 Vercel에 배포 중..."
vercel --prod

echo "✅ 프론트엔드 배포 완료!"
echo "📝 다음 단계:"
echo "1. Vercel 대시보드에서 환경 변수 설정"
echo "2. 백엔드와 프론트엔드 연결 테스트"
echo "3. 전체 기능 테스트" 