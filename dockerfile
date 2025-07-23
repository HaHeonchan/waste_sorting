# ---- 1단계: React 클라이언트 빌드 ----
    FROM node:18-alpine AS client-build
    WORKDIR /app/client
    COPY client/package*.json ./
    RUN npm install
    COPY client/ ./
    RUN npm run build
    
    # ---- 2단계: Node.js 서버 준비 ----
    FROM node:18-alpine AS server-build
    WORKDIR /app/server
    COPY server/package*.json ./
    RUN npm install
    COPY server/ ./
    
    # ---- 3단계: 최종 운영 이미지 생성 ----
    FROM node:18-alpine
    WORKDIR /app
    
    # 2단계에서 준비한 서버 파일들 복사
    COPY --from=server-build /app/server ./
    # 1단계에서 빌드한 React 결과물 복사
    COPY --from=client-build /app/client/build ./client/build
    
    # 업로드 폴더 생성 (이 폴더는 아래 docker-compose에서 볼륨과 연결됨)
    RUN mkdir -p /app/uploads
    
    # 서버가 사용하는 포트 노출 (server.js에서 3000번 포트 사용)
    EXPOSE 3000
    
    # 서버 실행
    CMD ["node", "server.js"]