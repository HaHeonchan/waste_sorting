/**
 * Google Vision API를 사용한 로고 탐지 및 텍스트 분석 모듈
 * 쓰레기 분류를 위한 재활용 마크 및 텍스트 인식
 */

const vision = require('@google-cloud/vision');
const fs = require('fs');

// Node.js 18+ 내장 fetch 사용, 없으면 node-fetch 사용
let fetch;
if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
} else {
    try {
        fetch = require('node-fetch');
    } catch (error) {
        console.error('❌ fetch 함수를 사용할 수 없습니다. node-fetch를 설치하거나 Node.js 18+를 사용하세요.');
        fetch = null;
    }
}

// ============================================================================
// 설정 및 상수
// ============================================================================

// Google Vision API 클라이언트
let client = null;

// 재활용 마크 키워드 정의
const WASTE_TYPE_KEYWORDS = [
    "비닐류", "캔류", "종이", "일반팩", "유리", "플라스틱", "폴리에틸렌"
];

const SUB_TYPE_KEYWORDS = [
    "바이오", "PET", "HDPE", "LDPE", "PP", "PS", "OTHER",
    "바이오PET", "바이오HDPE", "바이오LDPE", "바이오PP", "바이오PS",
    "철", "알미늄"
];

const RECYCLING_MARK_KEYWORDS = [
    ...WASTE_TYPE_KEYWORDS,
    ...SUB_TYPE_KEYWORDS
];

// 재활용 마크 우선순위 (더 구체적인 마크가 우선)
const RECYCLING_MARK_PRIORITY = {
    'HDPE': 1, 'PP': 1, 'PET': 1, 'LDPE': 1, 'PS': 1, 'OTHER': 1,
    '플라스틱': 2, '무색페트': 2, '비닐류': 2, '캔류': 2, '종이': 2,
    '일반팩': 2, '유리': 2, '폴리에틸렌': 2
};

// ============================================================================
// 초기화 함수들
// ============================================================================

/**
 * Google Vision API 클라이언트 초기화
 */
function initializeVisionClient() {
    try {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // 방법 1: 서비스 계정 키 파일 경로
            client = new vision.ImageAnnotatorClient({
                keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
            });
        } else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
            // 방법 2: 환경 변수로 직접 설정
            client = new vision.ImageAnnotatorClient({
                projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                credentials: {
                    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL
                }
            });
        } else {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

// 클라이언트 초기화 실행
initializeVisionClient();

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 이미지 버퍼 가져오기 (Cloudinary URL 및 로컬 파일 지원)
 * @param {string} imagePath - 이미지 경로 또는 Cloudinary URL
 * @returns {Promise<Buffer>} 이미지 버퍼
 */
async function getImageBuffer(imagePath) {
    if (imagePath.includes('cloudinary.com')) {
        // Cloudinary URL인 경우
        if (!fetch) {
            throw new Error('fetch 함수를 사용할 수 없어 Cloudinary URL을 처리할 수 없습니다.');
        }
        const response = await fetch(imagePath);
        return Buffer.from(await response.arrayBuffer());
    } else {
        // 로컬 파일인 경우
        return fs.readFileSync(imagePath);
    }
}

/**
 * 불필요한 텍스트 필터링
 * @param {string} text - 필터링할 텍스트
 * @returns {boolean} 건너뛸지 여부
 */
function shouldSkipText(text) {
    // 너무 긴 텍스트만 제외 (100자 이상)
    if (text.length > 100) {
        return true;
    }
    
    // 모든 텍스트를 포함 (특수문자, 숫자, 기호 등 모두 포함)
    return false;
}

// ============================================================================
// 통합 Vision API 분석 함수
// ============================================================================

/**
 * 통합 Vision API 분석 함수 (객체, 라벨, 텍스트 모두 탐지)
 * @param {string} imagePath - 이미지 경로 또는 Cloudinary URL
 * @returns {Promise<Object>} 통합 분석 결과
 */
async function performUnifiedVisionAnalysis(imagePath) {
    try {
        if (!client) {
            return {
                objects: [],
                labels: [],
                texts: [],
                error: 'Google Vision API 클라이언트가 초기화되지 않았습니다.'
            };
        }
                
        const imageBuffer = await getImageBuffer(imagePath);
        
        // 모든 분석을 병렬로 실행
        const [objectResult, labelResult, textResult] = await Promise.allSettled([
            client.objectLocalization(imageBuffer),
            client.labelDetection(imageBuffer),
            client.textDetection(imageBuffer)
        ]);
        
        // 결과 처리
        const objects = objectResult.status === 'fulfilled' ? 
            objectResult.value[0].localizedObjectAnnotations || [] : [];
        
        const labels = labelResult.status === 'fulfilled' ? 
            labelResult.value[0].labelAnnotations || [] : [];
        
        const textAnalysis = textResult.status === 'fulfilled' ? {
            detections: textResult.value[0].textAnnotations || [],
            usage: {
                imageSize: imageBuffer.length,
                estimatedTokens: Math.ceil(imageBuffer.length / 4 * 1.37),
                textRegions: textResult.value[0].textAnnotations?.length || 0,
                api: 'Google Vision API'
            }
        } : { detections: [], usage: null };
        
        // 텍스트에서 재활용 마크 추출 (모든 텍스트 포함)
        const recyclingMarks = [];
        if (textAnalysis.detections && textAnalysis.detections.length > 0) {
            textAnalysis.detections.forEach(detection => {
                const text = detection.description;
                
                // 모든 텍스트를 포함 (특수문자, 숫자, 기호 등 모두)
                if (shouldSkipText(text)) {
                    return;
                }
                
                // 재활용 마크 키워드 매칭
                RECYCLING_MARK_KEYWORDS.forEach(keyword => {
                    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                    if (regex.test(text)) {
                        recyclingMarks.push(keyword);
                    }
                });
            });
        }
        
        return {
            objects,
            labels,
            texts: textAnalysis.detections,
            recyclingMarks,
            usage: textAnalysis.usage,
            comprehensive: true
        };
        
    } catch (error) {
        return {
            objects: [],
            labels: [],
            texts: [],
            recyclingMarks: [],
            error: error.message
        };
    }
}

/**
 * 개선된 분리수거 마크 분석 함수 (객체와 라벨 포함)
 * @param {string} imagePath - 이미지 경로
 * @returns {Object} 분석 결과
 */
async function analyzeRecyclingMarksWithObjectsAndLabels(imagePath) {
    try {
        // 통합 Vision API 분석 실행
        const visionAnalysis = await performUnifiedVisionAnalysis(imagePath);
        
        const analysis = {
            logos: [],
            recyclingTexts: [],
            recyclingMarks: [],
            objects: visionAnalysis.objects || [],
            labels: visionAnalysis.labels || [],
            confidence: 0,
            summary: '',
            usage: visionAnalysis.usage || null,
            comprehensive: visionAnalysis.comprehensive || false
        };
        
        // 텍스트 분석
        if (visionAnalysis.texts && visionAnalysis.texts.length > 0) {
            const analysisResults = {
                keywords: [],
                parts: [],
                matchedTexts: []
            };
            
            visionAnalysis.texts.forEach(detection => {
                const text = detection.description;
                
                if (shouldSkipText(text)) {
                    return;
                }
                
                // 개선된 단순 키워드 매칭 - 정확한 단어 매칭
                RECYCLING_MARK_KEYWORDS.forEach(keyword => {
                    // 정확한 단어 매칭 (대소문자 구분 없이)
                    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                    if (regex.test(text)) {
                        analysisResults.keywords.push(keyword);
                        analysisResults.matchedTexts.push(text);
                        console.log(`   ✅ 키워드 매칭: "${keyword}" in "${text}"`);
                    }
                });
            });
            
            // 결과 정리 (중복 제거 및 우선순위 정리)
            if (analysisResults.keywords.length > 0) {
                const uniqueKeywords = [...new Set(analysisResults.keywords)];
                
                // 우선순위에 따라 정렬 (구체적인 마크가 우선)
                const sortedKeywords = uniqueKeywords.sort((a, b) => {
                    const priorityA = RECYCLING_MARK_PRIORITY[a] || 3;
                    const priorityB = RECYCLING_MARK_PRIORITY[b] || 3;
                    return priorityA - priorityB;
                });
                
                analysis.recyclingTexts = sortedKeywords;
                
                console.log('♻️ 발견된 분리수거 정보:', analysis.recyclingTexts);
                console.log('🎯 우선순위 정렬된 마크:', analysis.recyclingTexts);
            } else {
                console.log('❌ 분리수거 관련 키워드를 찾을 수 없습니다.');
            }
        } else {
            console.log('❌ 텍스트가 발견되지 않았습니다.');
        }
        
        // 객체 분석 (재활용 관련 객체 필터링)
        if (visionAnalysis.objects && visionAnalysis.objects.length > 0) {
            const recyclingObjects = visionAnalysis.objects.filter(obj => {
                const objectName = obj.name.toLowerCase();
                // 재활용 관련 객체 키워드
                const recyclingObjectKeywords = [
                    'bottle', 'can', 'container', 'package', 'box', 'bag',
                    'plastic', 'glass', 'metal', 'paper', 'cardboard',
                    'bottle', 'can', 'container', 'package', 'box', 'bag',
                    'plastic', 'glass', 'metal', 'paper', 'cardboard'
                ];
                
                return recyclingObjectKeywords.some(keyword => 
                    objectName.includes(keyword)
                ) && obj.score > 0.7; // 신뢰도 70% 이상
            });
            
            analysis.recyclingObjects = recyclingObjects;
        }
        
        // 라벨 분석 (재활용 관련 라벨 필터링)
        if (visionAnalysis.labels && visionAnalysis.labels.length > 0) {
            const recyclingLabels = visionAnalysis.labels.filter(label => {
                const labelName = label.description.toLowerCase();
                // 재활용 관련 라벨 키워드
                const recyclingLabelKeywords = [
                    'plastic', 'glass', 'metal', 'paper', 'cardboard',
                    'bottle', 'can', 'container', 'package', 'waste',
                    'recycling', 'recyclable', 'packaging', 'material'
                ];
                
                return recyclingLabelKeywords.some(keyword => 
                    labelName.includes(keyword)
                ) && label.score > 0.6; // 신뢰도 60% 이상
            });
            
            analysis.recyclingLabels = recyclingLabels;
        }
        
        // 분리수거 마크 판단
        const hasRecyclingText = analysis.recyclingTexts.length > 0;
        const hasRecyclingObjects = analysis.recyclingObjects && analysis.recyclingObjects.length > 0;
        const hasRecyclingLabels = analysis.recyclingLabels && analysis.recyclingLabels.length > 0;
        
        if (hasRecyclingText || hasRecyclingObjects || hasRecyclingLabels) {
            analysis.recyclingMarks = [...analysis.recyclingTexts];
            
            // 신뢰도 계산 (더 많은 정보가 있으면 더 높은 신뢰도)
            let confidence = 0.8; // 기본 신뢰도
            if (hasRecyclingObjects) confidence += 0.05;
            if (hasRecyclingLabels) confidence += 0.05;
            
            analysis.confidence = Math.min(confidence, 0.98); // 최대 98%
            
            // 요약 생성
            const summaryParts = [];
            if (hasRecyclingText) {
                summaryParts.push(`텍스트: ${analysis.recyclingTexts.join(', ')}`);
            }
            if (hasRecyclingObjects) {
                const objectSummary = analysis.recyclingObjects.map(obj => obj.name).join(', ');
                summaryParts.push(`객체: ${objectSummary}`);
            }
            if (hasRecyclingLabels) {
                const labelSummary = analysis.recyclingLabels.map(label => label.description).join(', ');
                summaryParts.push(`라벨: ${labelSummary}`);
            }
            
            analysis.summary = summaryParts.join(' | ');
        } else {
            analysis.summary = '분리수거 마크가 발견되지 않음';
        }
        
        return analysis;
        
    } catch (error) {
        return {
            logos: [],
            recyclingTexts: [],
            recyclingMarks: [],
            objects: [],
            labels: [],
            confidence: 0,
            summary: '분석 중 오류 발생',
            error: error.message
        };
    }
}

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    performUnifiedVisionAnalysis,
    analyzeRecyclingMarksWithObjectsAndLabels,
    // 새로운 키워드 추가
    WASTE_TYPE_KEYWORDS,
    SUB_TYPE_KEYWORDS,
    RECYCLING_MARK_KEYWORDS
}; 