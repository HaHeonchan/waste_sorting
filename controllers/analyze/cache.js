const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 간단한 파일 기반 캐시 시스템
const CACHE_DIR = 'cache/';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// 캐시 디렉토리 생성
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// 이미지 해시 생성
function generateImageHash(imageBuffer) {
    return crypto.createHash('md5').update(imageBuffer).digest('hex');
}

// 캐시 파일 경로 생성
function getCachePath(imageHash) {
    return path.join(CACHE_DIR, `${imageHash}.json`);
}

// 캐시에서 결과 가져오기
function getFromCache(imageHash) {
    try {
        const cachePath = getCachePath(imageHash);
        if (fs.existsSync(cachePath)) {
            const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            const now = Date.now();
            
            // 캐시가 유효한지 확인
            if (now - cacheData.timestamp < CACHE_DURATION) {
                console.log('📋 캐시에서 결과 가져옴');
                return cacheData.result;
            } else {
                // 만료된 캐시 삭제
                fs.unlinkSync(cachePath);
            }
        }
    } catch (error) {
        console.error('캐시 읽기 오류:', error);
    }
    return null;
}

// 결과를 캐시에 저장
function saveToCache(imageHash, result) {
    try {
        const cachePath = getCachePath(imageHash);
        const cacheData = {
            timestamp: Date.now(),
            result: result
        };
        fs.writeFileSync(cachePath, JSON.stringify(cacheData));
        console.log('💾 결과를 캐시에 저장');
    } catch (error) {
        console.error('캐시 저장 오류:', error);
    }
}

// 캐시 정리 (만료된 파일 삭제)
function cleanupCache() {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        const now = Date.now();
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(CACHE_DIR, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > CACHE_DURATION) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ 만료된 캐시 삭제:', file);
                }
            }
        });
    } catch (error) {
        console.error('캐시 정리 오류:', error);
    }
}

module.exports = {
    generateImageHash,
    getFromCache,
    saveToCache,
    cleanupCache
}; 