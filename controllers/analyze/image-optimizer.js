const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 이미지 최적화 함수
async function optimizeImage(imagePath) {
    try {
        const outputPath = imagePath.replace(/\.[^/.]+$/, '_optimized.jpg');
        
        await sharp(imagePath)
            .resize(512, 512, { // 더 작은 크기로 조정
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ 
                quality: 75, // 품질을 더 낮춤
                progressive: true,
                mozjpeg: true // 더 나은 압축
            })
            .toFile(outputPath);
        
        return outputPath;
    } catch (error) {
        console.error('이미지 최적화 실패:', error);
        return imagePath; // 실패 시 원본 반환
    }
}

// 이미지 크기 확인
function getImageSize(imagePath) {
    const stats = fs.statSync(imagePath);
    return stats.size;
}

// 이미지 픽셀이 너무 큰지 확인 (400x400을 넘는 경우)
async function isImageTooLarge(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        const maxDimension = Math.max(metadata.width, metadata.height);
        return maxDimension > 400; // 400픽셀을 넘으면 최적화
    } catch (error) {
        console.error('이미지 크기 확인 실패:', error);
        // 에러 시 파일 크기로 판단
        const size = getImageSize(imagePath);
        return size > 1 * 1024 * 1024; // 1MB
    }
}

// 더 강력한 최적화 함수 (텍스트 분석용)
async function optimizeForTextAnalysis(imagePath) {
    try {
        const outputPath = imagePath.replace(/\.[^/.]+$/, '_text_optimized.jpg');
        
        await sharp(imagePath)
            .resize(400, 400, { // 텍스트 분석에 충분한 크기
                fit: 'inside',
                withoutEnlargement: true
            })
            .sharpen({ // 텍스트 선명도 향상
                sigma: 1,
                flat: 1,
                jagged: 2
            })
            .jpeg({ 
                quality: 70, // 더 낮은 품질
                progressive: true,
                mozjpeg: true
            })
            .toFile(outputPath);
        
        return outputPath;
    } catch (error) {
        console.error('텍스트 분석용 최적화 실패:', error);
        return imagePath;
    }
}

// 이미지 메타데이터 분석
async function getImageInfo(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: getImageSize(imagePath)
        };
    } catch (error) {
        console.error('이미지 정보 가져오기 실패:', error);
        return null;
    }
}

module.exports = {
    optimizeImage,
    optimizeForTextAnalysis,
    getImageSize,
    getImageInfo,
    isImageTooLarge
}; 