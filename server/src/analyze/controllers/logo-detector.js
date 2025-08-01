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
    "무색페트", "비닐류", "캔류", "종이", "일반팩", "유리", "플라스틱", "폴리에틸렌"
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
            console.log('✅ Google Vision API 클라이언트 초기화 성공 (서비스 계정 키 파일 사용)');
        } else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
            // 방법 2: 환경 변수로 직접 설정
            client = new vision.ImageAnnotatorClient({
                projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                credentials: {
                    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL
                }
            });
            console.log('✅ Google Vision API 클라이언트 초기화 성공 (환경 변수 사용)');
        } else {
            console.log('⚠️ Google Cloud 인증 정보가 설정되지 않았습니다.');
            console.log('📝 다음 중 하나의 방법으로 설정하세요:');
            console.log('   1. GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json');
            console.log('   2. GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_PRIVATE_KEY, GOOGLE_CLOUD_CLIENT_EMAIL');
            return false;
        }
        return true;
    } catch (error) {
        console.log('⚠️ Google Vision API 클라이언트 초기화 실패:', error.message);
        console.log('📝 인증 정보를 확인하고 다시 시도하세요.');
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
    // 너무 긴 텍스트 (100자 이상으로 완화)
    if (text.length > 100) {
        console.log(`   📏 너무 긴 텍스트 건너뜀: ${text.length}자`);
        return true;
    }
    
    // 영어 문장 패턴 (대문자로 시작하고 마침표로 끝나는 경우) - 완화
    if (/^[A-Z][^.!?]*[.!?]$/.test(text)) {
        const hasRecyclingKeyword = RECYCLING_MARK_KEYWORDS.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasRecyclingKeyword) {
            console.log(`   📝 영어 문장 패턴 건너뜀: "${text}"`);
            return true;
        }
    }
    
    // 영어 단어만 있는 경우 (한글이 하나도 없는 경우) - 재활용 마크는 예외
    if (!/[가-힣]/.test(text) && /^[a-zA-Z\s]+$/.test(text)) {
        const hasRecyclingMark = RECYCLING_MARK_KEYWORDS.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasRecyclingMark) {
            console.log(`   🔤 영어 단어만 있는 경우 건너뜀: "${text}"`);
            return true;
        }
    }
    
    // 숫자만 있는 경우 (길이가 1-2자리인 경우만)
    if (/^\d{1,2}$/.test(text)) {
        console.log(`   🔢 짧은 숫자만 있는 경우 건너뜀: "${text}"`);
        return true;
    }
    
    // 특수문자만 있는 경우 (길이가 1-2자리인 경우만)
    if (/^[^\w가-힣]{1,2}$/.test(text)) {
        console.log(`   ⚠️ 짧은 특수문자만 있는 경우 건너뜀: "${text}"`);
        return true;
    }
    
    // 재활용 관련 키워드가 포함된 경우는 무조건 포함
    const hasRecyclingKeyword = RECYCLING_MARK_KEYWORDS.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasRecyclingKeyword) {
        console.log(`   ♻️ 재활용 키워드 포함으로 분석 대상: "${text}"`);
        return false;
    }
    
    // 파츠:재질 패턴이 포함된 경우는 무조건 포함
    if (text.includes(':') || text.includes('：')) {
        console.log(`   📋 파츠:재질 패턴 포함으로 분석 대상: "${text}"`);
        return false;
    }
    
    // 줄바꿈이 포함된 경우 (파츠\n재질 패턴)는 무조건 포함
    if (text.includes('\n')) {
        console.log(`   📄 줄바꿈 포함으로 분석 대상: "${text}"`);
        return false;
    }
    
    return false;
}

/**
 * 쓰레기 타입 유효성 검사
 * @param {string} wasteType - 검사할 쓰레기 타입
 * @returns {boolean} 유효한지 여부
 */
function isValidWasteType(wasteType) {
    const normalizedType = wasteType.toLowerCase();
    return [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].some(keyword => 
        normalizedType.includes(keyword.toLowerCase())
    );
}

/**
 * 고유 결과 추가
 * @param {Array} results - 결과 배열
 * @param {string} part - 부분
 * @param {string} wasteType - 쓰레기 타입
 * @param {string} type - 분석 타입
 */
function addUniqueResult(results, part, wasteType, type) {
    const existing = results.find(r => r.part === part && r.wasteType === wasteType);
    if (!existing) {
        results.push({ part, wasteType, type });
    }
}

// ============================================================================
// 기본 탐지 함수들
// ============================================================================

/**
 * 로고 탐지 함수 (Cloudinary URL 및 로컬 파일 지원)
 * @param {string} imagePath - 이미지 경로 또는 Cloudinary URL
 * @returns {Promise<Array>} 탐지된 로고 배열
 */
async function detectLogos(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return [];
        }
        
        console.log('🔍 로고 탐지 시작:', imagePath);
        
        const imageBuffer = await getImageBuffer(imagePath);
        const [result] = await client.logoDetection(imageBuffer);
        const logos = result.logoAnnotations;
        
        console.log(`✅ 로고 탐지 완료: ${logos.length}개의 로고 발견`);
        
        return logos;
        
    } catch (error) {
        console.error('❌ 로고 탐지 오류:', error);
        return [];
    }
}

/**
 * 텍스트 탐지 함수 (Cloudinary URL 및 로컬 파일 지원)
 * @param {string} imagePath - 이미지 경로 또는 Cloudinary URL
 * @returns {Promise<Object>} 텍스트 탐지 결과 및 사용량 정보
 */
async function detectText(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return { detections: [], usage: null };
        }
        
        console.log('📝 텍스트 탐지 시작:', imagePath);
        
        const imageBuffer = await getImageBuffer(imagePath);
        const [result] = await client.textDetection(imageBuffer);
        const detections = result.textAnnotations;
        
        console.log(`✅ 텍스트 탐지 완료: ${detections.length}개의 텍스트 영역 발견`);
        
        // 디버깅: 발견된 텍스트 출력
        if (detections && detections.length > 0) {
            console.log('📋 발견된 텍스트들:');
            detections.slice(0, 10).forEach((detection, index) => {
                console.log(`   ${index + 1}. "${detection.description}"`);
            });
        }
        
        // Google Vision API 사용량 정보 (추정)
        const imageSize = imageBuffer.length;
        const estimatedTokens = Math.ceil(imageSize / 4 * 1.37);
        
        const usage = {
            imageSize: imageSize,
            estimatedTokens: estimatedTokens,
            textRegions: detections.length,
            api: 'Google Vision API'
        };
        
        return { detections, usage };
        
    } catch (error) {
        console.error('❌ 텍스트 탐지 오류:', error);
        return { detections: [], usage: null };
    }
}



/**
 * 통합 Vision API 분석 함수 (텍스트, 객체, 라벨 모두 탐지, Cloudinary URL 및 로컬 파일 지원)
 * @param {string} imagePath - 이미지 경로 또는 Cloudinary URL
 * @returns {Promise<Object>} 통합 분석 결과
 */
async function performComprehensiveVisionAnalysis(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return {
                text: { detections: [], usage: null },
                objects: [],
                labels: [],
                logos: [],
                error: 'Google Vision API 클라이언트가 초기화되지 않았습니다.'
            };
        }
        
        console.log('🔍 통합 Vision API 분석 시작:', imagePath);
        
        const imageBuffer = await getImageBuffer(imagePath);
        
        // 모든 분석을 병렬로 실행
        const [textResult, objectResult, labelResult, logoResult] = await Promise.allSettled([
            client.textDetection(imageBuffer),
            client.objectLocalization(imageBuffer),
            client.labelDetection(imageBuffer),
            client.logoDetection(imageBuffer)
        ]);
        
        // 결과 처리
        const textAnalysis = textResult.status === 'fulfilled' ? {
            detections: textResult.value[0].textAnnotations || [],
            usage: {
                imageSize: imageBuffer.length,
                estimatedTokens: Math.ceil(imageBuffer.length / 4 * 1.37),
                textRegions: textResult.value[0].textAnnotations?.length || 0,
                api: 'Google Vision API'
            }
        } : { detections: [], usage: null };
        
        const objects = objectResult.status === 'fulfilled' ? 
            objectResult.value[0].localizedObjectAnnotations || [] : [];
        
        const labels = labelResult.status === 'fulfilled' ? 
            labelResult.value[0].labelAnnotations || [] : [];
        
        const logos = logoResult.status === 'fulfilled' ? 
            logoResult.value[0].logoAnnotations || [] : [];
        
        console.log('✅ 통합 Vision API 분석 완료');
        console.log(`   📝 텍스트: ${textAnalysis.detections.length}개`);
        console.log(`   🎯 객체: ${objects.length}개`);
        console.log(`   🏷️ 라벨: ${labels.length}개`);
        console.log(`   🔍 로고: ${logos.length}개`);
        
        return {
            text: textAnalysis,
            objects,
            labels,
            logos,
            comprehensive: true
        };
        
    } catch (error) {
        console.error('❌ 통합 Vision API 분석 오류:', error);
        return {
            text: { detections: [], usage: null },
            objects: [],
            labels: [],
            logos: [],
            error: error.message
        };
    }
}

// ============================================================================
// 텍스트 분석 함수들
// ============================================================================

/**
 * 복합 텍스트 분석 함수 (개선된 버전)
 * @param {string} text - 분석할 텍스트
 * @returns {Array} 분석 결과 배열
 */
function analyzeComplexText(text) {
    const results = [];
    
    console.log(`🔍 복합 텍스트 분석: "${text}"`);
    
    // 패턴 1: "부분 : 분류" 형태 (예: "뚜껑+라벨 : 플라스틱")
    const pattern1 = /([^:]+)\s*:\s*([^,\n]+)/g;
    let match;
    
    while ((match = pattern1.exec(text)) !== null) {
        const part = match[1].trim();
        const wasteType = match[2].trim();
        
        console.log(`   📋 파싱된 부분: "${part}" → "${wasteType}"`);
        
        if (isValidWasteType(wasteType)) {
            addUniqueResult(results, part, wasteType, 'labeled_part');
        }
    }
    
    // 패턴 2: 쉼표로 구분된 복합 분류
    const pattern2 = /([^:]+)\s*:\s*([^,]+)(?:,\s*([^:]+)\s*:\s*([^,\n]+))?/g;
    let match2;
    
    while ((match2 = pattern2.exec(text)) !== null) {
        // 첫 번째 부분
        const part1 = match2[1].trim();
        const wasteType1 = match2[2].trim();
        
        if (isValidWasteType(wasteType1)) {
            addUniqueResult(results, part1, wasteType1, 'labeled_part');
        }
        
        // 두 번째 부분 (있는 경우)
        if (match2[3] && match2[4]) {
            const part2 = match2[3].trim();
            const wasteType2 = match2[4].trim();
            
            if (isValidWasteType(wasteType2)) {
                addUniqueResult(results, part2, wasteType2, 'labeled_part');
            }
        }
    }
    
    // 패턴 3: 분리된 단어들을 조합하여 키워드 찾기
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
        const combinedWord = words[i] + words[i + 1];
        
        // 쓰레기 타입과 하위 타입 모두 확인
        [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
            if (combinedWord.toLowerCase() === keyword.toLowerCase()) {
                addUniqueResult(results, combinedWord, keyword, 'combined_word');
            }
        });
    }
    
    // 패턴 4: 단독 재질 마크 찾기 (예: "HDPE", "PP" 등)
    const words2 = text.split(/\s+/);
    words2.forEach(word => {
        // 특수문자 제거 후 확인
        const cleanWord = word.replace(/[^\w가-힣]/g, '');
        
        // 쓰레기 타입과 하위 타입 모두 확인
        [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
            if (cleanWord.toLowerCase() === keyword.toLowerCase()) {
                addUniqueResult(results, cleanWord, keyword, 'single_mark');
                console.log(`   ✅ 단독 마크 발견: "${cleanWord}" → "${keyword}"`);
            }
        });
    });
    
    // 패턴 5: 줄바꿈으로 구분된 파츠/재질 패턴 (예: "본체\nHDPE")
    if (text.includes('\n')) {
        const lines = text.split('\n');
        if (lines.length >= 2) {
            const part = lines[0].trim();
            const material = lines[1].trim();
            
            // 재질이 유효한지 확인
            [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
                if (material.toLowerCase().includes(keyword.toLowerCase())) {
                    addUniqueResult(results, part, keyword, 'line_separated');
                    console.log(`   ✅ 줄바꿈 패턴 발견: "${part}" → "${keyword}"`);
                }
            });
        }
    }
    
    // 패턴 6: 슬래시로 구분된 패턴 (예: "본체/HDPE")
    const slashPattern = /([^\/]+)\s*\/\s*([^\/\s]+)/g;
    let slashMatch;
    
    while ((slashMatch = slashPattern.exec(text)) !== null) {
        const part = slashMatch[1].trim();
        const material = slashMatch[2].trim();
        
        [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
            if (material.toLowerCase().includes(keyword.toLowerCase())) {
                addUniqueResult(results, part, keyword, 'slash_separated');
                console.log(`   ✅ 슬래시 패턴 발견: "${part}" → "${keyword}"`);
            }
        });
    }
    
    // 패턴 7: 괄호로 구분된 패턴 (예: "본체(HDPE)")
    const bracketPattern = /([^\(\)]+)\s*\(\s*([^\(\)]+)\s*\)/g;
    let bracketMatch;
    
    while ((bracketMatch = bracketPattern.exec(text)) !== null) {
        const part = bracketMatch[1].trim();
        const material = bracketMatch[2].trim();
        
        [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
            if (material.toLowerCase().includes(keyword.toLowerCase())) {
                addUniqueResult(results, part, keyword, 'bracket_separated');
                console.log(`   ✅ 괄호 패턴 발견: "${part}" → "${keyword}"`);
            }
        });
    }
    
    // 패턴 8: 공백으로 구분된 간단한 패턴 (예: "본체 HDPE")
    const spacePattern = /([가-힣a-zA-Z]+)\s+([A-Z]+)/g;
    let spaceMatch;
    
    while ((spaceMatch = spacePattern.exec(text)) !== null) {
        const part = spaceMatch[1].trim();
        const material = spaceMatch[2].trim();
        
        [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
            if (material.toLowerCase() === keyword.toLowerCase()) {
                addUniqueResult(results, part, keyword, 'space_separated');
                console.log(`   ✅ 공백 패턴 발견: "${part}" → "${keyword}"`);
            }
        });
    }
    
    console.log(`   🎯 최종 복합 분석 결과: ${results.length}개 항목`);
    return results;
}

// ============================================================================
// 개선된 분리수거 마크 분석 함수
// ============================================================================

/**
 * 개선된 분리수거 마크 분석 함수 (객체와 라벨 포함)
 * @param {string} imagePath - 이미지 경로
 * @returns {Object} 분석 결과
 */
async function analyzeRecyclingMarksWithObjectsAndLabels(imagePath) {
    try {
        console.log('🔍 개선된 분리수거 마크 분석 시작 (객체/라벨 포함)');
        
        // 통합 Vision API 분석 실행
        const visionAnalysis = await performComprehensiveVisionAnalysis(imagePath);
        
        const analysis = {
            logos: visionAnalysis.logos || [],
            recyclingTexts: [],
            recyclingMarks: [],
            objects: visionAnalysis.objects || [],
            labels: visionAnalysis.labels || [],
            confidence: 0,
            summary: '',
            usage: visionAnalysis.text?.usage || null,
            comprehensive: visionAnalysis.comprehensive || false
        };
        
        // 텍스트 분석
        if (visionAnalysis.text && visionAnalysis.text.detections && visionAnalysis.text.detections.length > 0) {
            const analysisResults = {
                keywords: [],
                parts: [],
                matchedTexts: []
            };
            
            visionAnalysis.text.detections.forEach(detection => {
                const text = detection.description;
                
                console.log(`🔍 텍스트 분석 중: "${text}"`);
                
                if (shouldSkipText(text)) {
                    console.log(`   ⏭️ 건너뜀: "${text}"`);
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
                
                // 복합 텍스트 분석
                const complexResults = analyzeComplexText(text);
                analysisResults.parts.push(...complexResults);
                
                if (complexResults.length > 0) {
                    analysisResults.matchedTexts.push(text);
                }
            });
            
            // 결과 정리 (중복 제거 및 우선순위 정리)
            if (analysisResults.parts.length > 0 || analysisResults.keywords.length > 0) {
                const uniqueKeywords = [...new Set(analysisResults.keywords)];
                const uniqueParts = analysisResults.parts.filter((part, index, self) => 
                    index === self.findIndex(p => 
                        p.part === part.part && p.wasteType === part.wasteType
                    )
                );
                
                // 우선순위에 따라 정렬 (구체적인 마크가 우선)
                const sortedKeywords = uniqueKeywords.sort((a, b) => {
                    const priorityA = RECYCLING_MARK_PRIORITY[a] || 3;
                    const priorityB = RECYCLING_MARK_PRIORITY[b] || 3;
                    return priorityA - priorityB;
                });
                
                const sortedParts = uniqueParts.map(part => part.wasteType).sort((a, b) => {
                    const priorityA = RECYCLING_MARK_PRIORITY[a] || 3;
                    const priorityB = RECYCLING_MARK_PRIORITY[b] || 3;
                    return priorityA - priorityB;
                });
                
                analysis.recyclingTexts = [
                    ...sortedKeywords,
                    ...sortedParts
                ];
                analysis.complexAnalysis = uniqueParts;
                
                console.log('♻️ 발견된 분리수거 정보:', analysis.recyclingTexts);
                console.log('📝 정리된 복합 분석 결과:', uniqueParts);
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
            console.log('🎯 재활용 관련 객체:', recyclingObjects.map(obj => 
                `${obj.name} (${Math.round(obj.score * 100)}%)`
            ));
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
            console.log('🏷️ 재활용 관련 라벨:', recyclingLabels.map(label => 
                `${label.description} (${Math.round(label.score * 100)}%)`
            ));
        }
        
        // 분리수거 마크 판단 (복합 분석 포함)
        const hasRecyclingText = analysis.recyclingTexts.length > 0;
        const hasComplexAnalysis = analysis.complexAnalysis && analysis.complexAnalysis.length > 0;
        const hasRecyclingObjects = analysis.recyclingObjects && analysis.recyclingObjects.length > 0;
        const hasRecyclingLabels = analysis.recyclingLabels && analysis.recyclingLabels.length > 0;
        
        if (hasRecyclingText || hasComplexAnalysis || hasRecyclingObjects || hasRecyclingLabels) {
            analysis.recyclingMarks = [...analysis.recyclingTexts];
            
            // 신뢰도 계산 (더 많은 정보가 있으면 더 높은 신뢰도)
            let confidence = 0.8; // 기본 신뢰도
            if (hasComplexAnalysis) confidence += 0.1;
            if (hasRecyclingObjects) confidence += 0.05;
            if (hasRecyclingLabels) confidence += 0.05;
            
            analysis.confidence = Math.min(confidence, 0.98); // 최대 98%
            
            // 요약 생성
            const summaryParts = [];
            if (hasComplexAnalysis) {
                const complexSummary = analysis.complexAnalysis.map(item => 
                    `${item.part}: ${item.wasteType}`
                ).join(', ');
                summaryParts.push(`복합 분석: ${complexSummary}`);
            }
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
        
        console.log('📊 개선된 분리수거 마크 분석 결과:', analysis.summary);
        console.log('🎯 신뢰도:', analysis.confidence);
        
        return analysis;
        
    } catch (error) {
        console.error('❌ 개선된 분리수거 마크 분석 오류:', error);
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
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return {
                objects: [],
                labels: [],
                texts: [],
                error: 'Google Vision API 클라이언트가 초기화되지 않았습니다.'
            };
        }
        
        console.log('🔍 통합 Vision API 분석 시작:', imagePath);
        
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
        
        // 텍스트에서 재활용 마크 추출
        const recyclingMarks = [];
        if (textAnalysis.detections && textAnalysis.detections.length > 0) {
            textAnalysis.detections.forEach(detection => {
                const text = detection.description;
                
                if (shouldSkipText(text)) {
                    return;
                }
                
                // 재활용 마크 키워드 매칭
                RECYCLING_MARK_KEYWORDS.forEach(keyword => {
                    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                    if (regex.test(text)) {
                        recyclingMarks.push(keyword);
                        console.log(`   ✅ 재활용 마크 발견: "${keyword}" in "${text}"`);
                    }
                });
            });
        }
        
        console.log('✅ 통합 Vision API 분석 완료');
        console.log(`   🎯 객체: ${objects.length}개`);
        console.log(`   🏷️ 라벨: ${labels.length}개`);
        console.log(`   📝 텍스트: ${textAnalysis.detections.length}개`);
        console.log(`   ♻️ 재활용 마크: ${recyclingMarks.length}개`);
        
        return {
            objects,
            labels,
            texts: textAnalysis.detections,
            recyclingMarks,
            usage: textAnalysis.usage,
            comprehensive: true
        };
        
    } catch (error) {
        console.error('❌ 통합 Vision API 분석 오류:', error);
        return {
            objects: [],
            labels: [],
            texts: [],
            recyclingMarks: [],
            error: error.message
        };
    }
}

// ============================================================================
// 기존 함수들 (호환성 유지)
// ============================================================================

/**
 * 분리수거 마크 분석 함수 (기존 버전 - 호환성 유지)
 * @param {string} imagePath - 이미지 경로
 * @returns {Object} 분석 결과
 */
async function analyzeRecyclingMarks(imagePath) {
    try {
        console.log('🔍 분리수거 마크 분석 시작');
        
        // 텍스트 탐지
        const { detections: textDetections, usage: visionUsage } = await detectText(imagePath);
        
        // 로고 탐지
        const logos = await detectLogos(imagePath);
        
        const analysis = {
            logos: logos,
            recyclingTexts: [],
            recyclingMarks: [],
            confidence: 0,
            summary: '',
            usage: visionUsage
        };
        
        // 텍스트 분석
        if (textDetections && textDetections.length > 0) {
            const analysisResults = {
                keywords: [],
                parts: [],
                matchedTexts: []
            };
            
            textDetections.forEach(detection => {
                const text = detection.description;
                
                console.log(`🔍 텍스트 분석 중: "${text}"`);
                
                if (shouldSkipText(text)) {
                    console.log(`   ⏭️ 건너뜀: "${text}"`);
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
                
                // 복합 텍스트 분석
                const complexResults = analyzeComplexText(text);
                analysisResults.parts.push(...complexResults);
                
                if (complexResults.length > 0) {
                    analysisResults.matchedTexts.push(text);
                }
            });
            
            // 결과 정리 (중복 제거 및 우선순위 정리)
            if (analysisResults.parts.length > 0 || analysisResults.keywords.length > 0) {
                const uniqueKeywords = [...new Set(analysisResults.keywords)];
                const uniqueParts = analysisResults.parts.filter((part, index, self) => 
                    index === self.findIndex(p => 
                        p.part === part.part && p.wasteType === part.wasteType
                    )
                );
                
                // 우선순위에 따라 정렬 (구체적인 마크가 우선)
                const sortedKeywords = uniqueKeywords.sort((a, b) => {
                    const priorityA = RECYCLING_MARK_PRIORITY[a] || 3;
                    const priorityB = RECYCLING_MARK_PRIORITY[b] || 3;
                    return priorityA - priorityB;
                });
                
                const sortedParts = uniqueParts.map(part => part.wasteType).sort((a, b) => {
                    const priorityA = RECYCLING_MARK_PRIORITY[a] || 3;
                    const priorityB = RECYCLING_MARK_PRIORITY[b] || 3;
                    return priorityA - priorityB;
                });
                
                analysis.recyclingTexts = [
                    ...sortedKeywords,
                    ...sortedParts
                ];
                analysis.complexAnalysis = uniqueParts;
                
                console.log('♻️ 발견된 분리수거 정보:', analysis.recyclingTexts);
                console.log('📝 정리된 복합 분석 결과:', uniqueParts);
                console.log('🎯 우선순위 정렬된 마크:', analysis.recyclingTexts);
            } else {
                console.log('❌ 분리수거 관련 키워드를 찾을 수 없습니다.');
            }
        } else {
            console.log('❌ 텍스트가 발견되지 않았습니다.');
        }
        
        // 분리수거 마크 판단 (복합 분석 포함)
        const hasRecyclingText = analysis.recyclingTexts.length > 0;
        const hasComplexAnalysis = analysis.complexAnalysis && analysis.complexAnalysis.length > 0;
        
        if (hasRecyclingText || hasComplexAnalysis) {
            analysis.recyclingMarks = [...analysis.recyclingTexts];
            
            // 신뢰도 계산 (복합 분석이 있으면 더 높은 신뢰도)
            analysis.confidence = hasComplexAnalysis ? 0.95 : 0.9;
            
            // 요약 생성
            if (hasComplexAnalysis) {
                const complexSummary = analysis.complexAnalysis.map(item => 
                    `${item.part}: ${item.wasteType}`
                ).join(', ');
                analysis.summary = `복합 분석 결과 - ${complexSummary}`;
            } else if (analysis.recyclingTexts.length > 0) {
                analysis.summary = `텍스트에서 분리수거 키워드 "${analysis.recyclingTexts.join(', ')}" 확인됨`;
            } else {
                analysis.summary = '분리수거 마크가 발견되지 않음';
            }
        } else {
            analysis.summary = '분리수거 마크가 발견되지 않음';
        }
        
        console.log('📊 분리수거 마크 분석 결과:', analysis.summary);
        console.log('🎯 신뢰도:', analysis.confidence);
        
        // 사용량 정보 추가
        analysis.usage = visionUsage;
        
        return analysis;
        
    } catch (error) {
        console.error('❌ 분리수거 마크 분석 오류:', error);
        return {
            logos: [],
            recyclingTexts: [],
            recyclingMarks: [],
            confidence: 0,
            summary: '분석 중 오류 발생',
            error: error.message
        };
    }
}

/**
 * 통합 이미지 분석 함수 (기존 버전 - 호환성 유지)
 * @param {string} imagePath - 이미지 경로
 * @returns {Object} 통합 분석 결과
 */
async function analyzeImageWithLogoDetection(imagePath) {
    try {
        console.log('🔍 통합 이미지 분석 시작 (로고 탐지 포함)');
        
        // 분리수거 마크 분석
        const logoAnalysis = await analyzeRecyclingMarks(imagePath);
        
        return {
            logoDetection: logoAnalysis,
            hasRecyclingMarks: logoAnalysis.recyclingMarks.length > 0,
            confidence: logoAnalysis.confidence,
            detectedLogos: logoAnalysis.logos,
            recyclingKeywords: logoAnalysis.recyclingTexts,
            usage: logoAnalysis.usage
        };
        
    } catch (error) {
        console.error('❌ 통합 이미지 분석 오류:', error);
        throw error;
    }
}

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    detectLogos,
    detectText,
    performComprehensiveVisionAnalysis,
    analyzeRecyclingMarks,
    analyzeRecyclingMarksWithObjectsAndLabels,
    analyzeImageWithLogoDetection,
    // 새로운 키워드 추가
    WASTE_TYPE_KEYWORDS,
    SUB_TYPE_KEYWORDS,
    RECYCLING_MARK_KEYWORDS
}; 