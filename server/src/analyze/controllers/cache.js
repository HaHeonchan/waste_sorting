/**
 * 간단한 파일 기반 캐시 시스템
 * 이미지 분석 결과를 캐시하여 성능 향상
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 캐시 설정
// ============================================================================

const CACHE_DIR = 'cache/';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// 캐시 디렉토리 생성
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log('📁 캐시 디렉토리 생성:', CACHE_DIR);
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 이미지 해시 생성
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @returns {string} MD5 해시값
 */
function generateImageHash(imageBuffer) {
    return crypto.createHash('md5').update(imageBuffer).digest('hex');
}

/**
 * 캐시 파일 경로 생성
 * @param {string} imageHash - 이미지 해시
 * @returns {string} 캐시 파일 경로
 */
function getCachePath(imageHash) {
    return path.join(CACHE_DIR, `${imageHash}.json`);
}

// ============================================================================
// 캐시 조작 함수들
// ============================================================================

/**
 * 캐시에서 결과 가져오기
 * @param {string} imageHash - 이미지 해시
 * @returns {Object|null} 캐시된 결과 또는 null
 */
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
                console.log('🗑️ 만료된 캐시 삭제:', imageHash);
            }
        }
    } catch (error) {
        console.error('❌ 캐시 읽기 오류:', error);
    }
    
    return null;
}

/**
 * 결과를 캐시에 저장
 * @param {string} imageHash - 이미지 해시
 * @param {Object} result - 저장할 결과
 */
function saveToCache(imageHash, result) {
    try {
        const cachePath = getCachePath(imageHash);
        const cacheData = {
            timestamp: Date.now(),
            result: result
        };
        
        fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
        console.log('💾 결과를 캐시에 저장:', imageHash);
    } catch (error) {
        console.error('❌ 캐시 저장 오류:', error);
    }
}

// ============================================================================
// 캐시 관리 함수들
// ============================================================================

/**
 * 캐시 정리 (만료된 파일 삭제)
 */
function cleanupCache() {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        const now = Date.now();
        let deletedCount = 0;
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(CACHE_DIR, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > CACHE_DURATION) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log('🗑️ 만료된 캐시 삭제:', file);
                }
            }
        });
        
        if (deletedCount > 0) {
            console.log(`🧹 캐시 정리 완료: ${deletedCount}개 파일 삭제`);
        } else {
            console.log('✅ 만료된 캐시 파일 없음');
        }
    } catch (error) {
        console.error('❌ 캐시 정리 오류:', error);
    }
}

/**
 * 캐시 통계 정보 가져오기
 * @returns {Object} 캐시 통계
 */
function getCacheStats() {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        const now = Date.now();
        let totalFiles = 0;
        let validFiles = 0;
        let totalSize = 0;
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                totalFiles++;
                const filePath = path.join(CACHE_DIR, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                
                if (now - stats.mtime.getTime() < CACHE_DURATION) {
                    validFiles++;
                }
            }
        });
        
        return {
            totalFiles,
            validFiles,
            expiredFiles: totalFiles - validFiles,
            totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB'
        };
    } catch (error) {
        console.error('❌ 캐시 통계 오류:', error);
        return null;
    }
}

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    generateImageHash,
    getFromCache,
    saveToCache,
    cleanupCache,
    getCacheStats
}; 