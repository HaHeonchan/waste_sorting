/**
 * 이미지 최적화 모듈
 * API 호출을 위한 이미지 크기 및 품질 최적화
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 설정 상수
// ============================================================================

const MAX_PIXEL_SIZE = 2048; // 최대 픽셀 크기
const JPEG_QUALITY = 75; // JPEG 품질
const TEXT_JPEG_QUALITY = 70; // 텍스트 분석용 JPEG 품질

// ============================================================================
// 기본 이미지 최적화 함수들
// ============================================================================

/**
 * 일반적인 이미지 최적화
 * @param {string} imagePath - 원본 이미지 경로
 * @returns {string} 최적화된 이미지 경로
 */
async function optimizeImage(imagePath) {
    try {
        const outputPath = imagePath.replace(/\.[^/.]+$/, '_optimized.jpg');
        
        await sharp(imagePath)
            .resize(MAX_PIXEL_SIZE, MAX_PIXEL_SIZE, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ 
                quality: JPEG_QUALITY,
                progressive: true,
                mozjpeg: true
            })
            .toFile(outputPath);
        
        console.log('✅ 이미지 최적화 완료:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('❌ 이미지 최적화 실패:', error);
        return imagePath; // 실패 시 원본 반환
    }
}

/**
 * 텍스트 분석을 위한 강화된 최적화
 * @param {string} imagePath - 원본 이미지 경로
 * @returns {string} 최적화된 이미지 경로
 */
async function optimizeForTextAnalysis(imagePath) {
    try {
        const outputPath = imagePath.replace(/\.[^/.]+$/, '_text_optimized.jpg');
        
        await sharp(imagePath)
            .resize(MAX_PIXEL_SIZE, MAX_PIXEL_SIZE, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .sharpen({ // 텍스트 선명도 향상
                sigma: 1,
                flat: 1,
                jagged: 2
            })
            .jpeg({ 
                quality: TEXT_JPEG_QUALITY,
                progressive: true,
                mozjpeg: true
            })
            .toFile(outputPath);
        
        console.log('✅ 텍스트 분석용 이미지 최적화 완료:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('❌ 텍스트 분석용 최적화 실패:', error);
        return imagePath;
    }
}

// ============================================================================
// 이미지 정보 및 크기 확인 함수들
// ============================================================================

/**
 * 이미지 파일 크기 확인
 * @param {string} imagePath - 이미지 경로
 * @returns {number} 파일 크기 (bytes)
 */
function getImageSize(imagePath) {
    try {
        const stats = fs.statSync(imagePath);
        return stats.size;
    } catch (error) {
        console.error('❌ 이미지 크기 확인 실패:', error);
        return 0;
    }
}

/**
 * 이미지가 너무 큰지 확인 (픽셀 기준)
 * @param {string} imagePath - 이미지 경로
 * @returns {boolean} 최적화 필요 여부
 */
async function isImageTooLarge(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        const maxDimension = Math.max(metadata.width, metadata.height);
        const needsOptimization = maxDimension > MAX_PIXEL_SIZE;
        
        if (needsOptimization) {
            console.log(`📏 이미지 크기: ${metadata.width}x${metadata.height} (최대: ${MAX_PIXEL_SIZE})`);
        }
        
        return needsOptimization;
    } catch (error) {
        console.error('❌ 이미지 크기 확인 실패:', error);
        // 에러 시 파일 크기로 판단
        const size = getImageSize(imagePath);
        const sizeLimit = 1 * 1024 * 1024; // 1MB
        return size > sizeLimit;
    }
}

/**
 * 이미지 메타데이터 분석
 * @param {string} imagePath - 이미지 경로
 * @returns {Object|null} 이미지 정보
 */
async function getImageInfo(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        const fileSize = getImageSize(imagePath);
        
        const info = {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: fileSize,
            sizeMB: (fileSize / 1024 / 1024).toFixed(2),
            aspectRatio: (metadata.width / metadata.height).toFixed(2)
        };
        
        console.log('📊 이미지 정보:', info);
        return info;
    } catch (error) {
        console.error('❌ 이미지 정보 가져오기 실패:', error);
        return null;
    }
}

// ============================================================================
// 고급 최적화 함수들
// ============================================================================

/**
 * 특정 용도에 맞는 이미지 최적화
 * @param {string} imagePath - 원본 이미지 경로
 * @param {Object} options - 최적화 옵션
 * @returns {string} 최적화된 이미지 경로
 */
async function optimizeImageWithOptions(imagePath, options = {}) {
    const {
        maxWidth = MAX_PIXEL_SIZE,
        maxHeight = MAX_PIXEL_SIZE,
        quality = JPEG_QUALITY,
        sharpen = false,
        format = 'jpeg'
    } = options;
    
    try {
        const outputPath = imagePath.replace(/\.[^/.]+$/, `_custom_optimized.${format}`);
        
        let sharpInstance = sharp(imagePath)
            .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            });
        
        if (sharpen) {
            sharpInstance = sharpInstance.sharpen({
                sigma: 1,
                flat: 1,
                jagged: 2
            });
        }
        
        if (format === 'jpeg') {
            sharpInstance = sharpInstance.jpeg({
                quality: quality,
                progressive: true,
                mozjpeg: true
            });
        } else if (format === 'png') {
            sharpInstance = sharpInstance.png({
                quality: quality,
                progressive: true
            });
        }
        
        await sharpInstance.toFile(outputPath);
        
        console.log('✅ 커스텀 이미지 최적화 완료:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('❌ 커스텀 이미지 최적화 실패:', error);
        return imagePath;
    }
}

/**
 * 이미지 품질 비교
 * @param {string} originalPath - 원본 이미지 경로
 * @param {string} optimizedPath - 최적화된 이미지 경로
 * @returns {Object} 품질 비교 결과
 */
async function compareImageQuality(originalPath, optimizedPath) {
    try {
        const originalInfo = await getImageInfo(originalPath);
        const optimizedInfo = await getImageInfo(optimizedPath);
        
        const compressionRatio = ((originalInfo.size - optimizedInfo.size) / originalInfo.size * 100).toFixed(2);
        
        return {
            original: originalInfo,
            optimized: optimizedInfo,
            compressionRatio: `${compressionRatio}%`,
            sizeReduction: `${(originalInfo.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedInfo.size / 1024 / 1024).toFixed(2)}MB`
        };
    } catch (error) {
        console.error('❌ 이미지 품질 비교 실패:', error);
        return null;
    }
}

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    optimizeImage,
    optimizeForTextAnalysis,
    optimizeImageWithOptions,
    getImageSize,
    getImageInfo,
    isImageTooLarge,
    compareImageQuality
}; 