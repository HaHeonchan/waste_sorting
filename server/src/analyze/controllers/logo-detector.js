/**
 * Google Vision API를 사용한 로고 탐지 및 텍스트 분석 모듈
 * 쓰레기 분류를 위한 재활용 마크 및 텍스트 인식
 */

const vision = require('@google-cloud/vision');
const fs = require('fs');

// ============================================================================
// Google Vision API 클라이언트 초기화
// ============================================================================

let client = null;
try {
    // 여러 인증 방법 시도
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
        return;
    }
} catch (error) {
    console.log('⚠️ Google Vision API 클라이언트 초기화 실패:', error.message);
    console.log('📝 인증 정보를 확인하고 다시 시도하세요.');
}

// ============================================================================
// 재활용 마크 키워드 정의
// ============================================================================

// 쓰레기 타입 키워드
const WASTE_TYPE_KEYWORDS = [
    "무색페트", "비닐류", "캔류", "종이", "일반팩", "유리", "플라스틱", "폴리에틸렌"
];

// 하위 타입 키워드
const SUB_TYPE_KEYWORDS = [
    "바이오", "PET", "HDPE", "LDPE", "PP", "PS", "OTHER",
    "바이오PET", "바이오HDPE", "바이오LDPE", "바이오PP", "바이오PS",
    "철", "알미늄"
];

// 전체 키워드 (기존 호환성을 위해 유지)
const RECYCLING_MARK_KEYWORDS = [
    ...WASTE_TYPE_KEYWORDS,
    ...SUB_TYPE_KEYWORDS
];

// ============================================================================
// 기본 탐지 함수들
// ============================================================================

/**
 * 로고 탐지 함수
 * @param {string} imagePath - 이미지 경로
 * @returns {Array} 탐지된 로고 배열
 */
async function detectLogos(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return [];
        }
        
        console.log('🔍 로고 탐지 시작:', imagePath);
        
        const imageBuffer = fs.readFileSync(imagePath);
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
 * 텍스트 탐지 함수
 * @param {string} imagePath - 이미지 경로
 * @returns {Object} 텍스트 탐지 결과 및 사용량 정보
 */
async function detectText(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return { detections: [], usage: null };
        }
        
        console.log('📝 텍스트 탐지 시작:', imagePath);
        
        const imageBuffer = fs.readFileSync(imagePath);
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
 * 객체 탐지 함수 (재활용 관련 물체 탐지)
 * @param {string} imagePath - 이미지 경로
 * @returns {Array} 탐지된 객체 배열
 */
async function detectObjects(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return [];
        }
        
        console.log('🎯 객체 탐지 시작:', imagePath);
        
        const imageBuffer = fs.readFileSync(imagePath);
        const [result] = await client.objectLocalization(imageBuffer);
        const objects = result.localizedObjectAnnotations;
        
        console.log(`✅ 객체 탐지 완료: ${objects.length}개의 객체 발견`);
        
        // 디버깅: 발견된 객체 출력
        if (objects && objects.length > 0) {
            console.log('🎯 발견된 객체들:');
            objects.forEach((obj, index) => {
                console.log(`   ${index + 1}. ${obj.name} (신뢰도: ${Math.round(obj.score * 100)}%)`);
            });
        }
        
        return objects;
        
    } catch (error) {
        console.error('❌ 객체 탐지 오류:', error);
        return [];
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
    
    console.log(`   🎯 최종 복합 분석 결과: ${results.length}개 항목`);
    return results;
}

/**
 * 불필요한 텍스트 필터링 함수
 * @param {string} text - 필터링할 텍스트
 * @returns {boolean} 건너뛸지 여부
 */
function shouldSkipText(text) {
    // 너무 긴 텍스트 (50자 이상)
    if (text.length > 50) {
        return true;
    }
    
    // 영어 문장 패턴 (대문자로 시작하고 마침표로 끝나는 경우)
    if (/^[A-Z][^.!?]*[.!?]$/.test(text)) {
        return true;
    }
    
    // 영어 단어만 있는 경우 (한글이 하나도 없는 경우)
    if (!/[가-힣]/.test(text) && /^[a-zA-Z\s]+$/.test(text)) {
        return true;
    }
    
    // 숫자만 있는 경우
    if (/^\d+$/.test(text)) {
        return true;
    }
    
    // 특수문자만 있는 경우 (하지만 +, :, , 등 중요한 구분자는 제외)
    if (/^[^\w가-힣+\:,]+$/.test(text)) {
        return true;
    }
    
    return false;
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 유효한 쓰레기 타입인지 확인
 * @param {string} wasteType - 확인할 쓰레기 타입
 * @returns {boolean} 유효성 여부
 */
function isValidWasteType(wasteType) {
    return WASTE_TYPE_KEYWORDS.some(keyword => 
        wasteType.toLowerCase() === keyword.toLowerCase() ||
        wasteType.toLowerCase().includes(keyword.toLowerCase())
    );
}

/**
 * 유효한 하위 타입인지 확인
 * @param {string} subType - 확인할 하위 타입
 * @returns {boolean} 유효성 여부
 */
function isValidSubType(subType) {
    return SUB_TYPE_KEYWORDS.some(keyword => 
        subType.toLowerCase() === keyword.toLowerCase() ||
        subType.toLowerCase().includes(keyword.toLowerCase())
    );
}

/**
 * 텍스트에서 쓰레기 타입과 하위 타입을 분리하여 반환
 * @param {string} text - 분석할 텍스트
 * @returns {Object} 분리된 타입 정보
 */
function extractWasteTypes(text) {
    const result = {
        wasteType: null,
        subType: null
    };
    
    // 쓰레기 타입 찾기
    for (const keyword of WASTE_TYPE_KEYWORDS) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
            result.wasteType = keyword;
            break;
        }
    }
    
    // 하위 타입 찾기
    for (const keyword of SUB_TYPE_KEYWORDS) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
            result.subType = keyword;
            break;
        }
    }
    
    return result;
}

/**
 * 중복을 제거하고 결과에 추가
 * @param {Array} results - 결과 배열
 * @param {string} part - 부분명
 * @param {string} wasteType - 쓰레기 타입
 * @param {string} type - 분석 타입
 */
function addUniqueResult(results, part, wasteType, type) {
    const existingIndex = results.findIndex(r => 
        r.part === part && r.wasteType === wasteType
    );
    
    if (existingIndex === -1) {
        results.push({ part, wasteType, type });
        console.log(`   ✅ 추가됨: "${part}" → "${wasteType}"`);
    } else {
        console.log(`   ⚠️ 중복 제거: "${part}" → "${wasteType}"`);
    }
}

// ============================================================================
// 메인 분석 함수들
// ============================================================================

/**
 * 분리수거 마크 분석 함수
 * @param {string} imagePath - 이미지 경로
 * @returns {Object} 분석 결과
 */
async function analyzeRecyclingMarks(imagePath) {
    try {
        console.log('♻️ 분리수거 마크 분석 시작');
        
        // Google Vision API가 사용 가능한지 확인
        if (!client) {
            console.log('⚠️ Google Vision API를 사용할 수 없습니다. 기본 분석만 진행합니다.');
            return {
                logos: [],
                recyclingTexts: [],
                recyclingMarks: [],
                confidence: 0,
                summary: 'Google Vision API 인증 파일이 없어 로고 탐지를 건너뜀'
            };
        }
        
        // 텍스트 탐지 실행
        const textResult = await detectText(imagePath);
        const textDetections = textResult.detections;
        const visionUsage = textResult.usage;
        
        const analysis = {
            logos: [],
            recyclingTexts: [],
            recyclingObjects: [],
            recyclingMarks: [],
            confidence: 0,
            summary: ''
        };
        
        // 텍스트 분석 (복합 분석 버전)
        if (textDetections && textDetections.length > 0) {
            console.log('🔍 전체 텍스트 분석 시작...');
            
            const analysisResults = {
                parts: [],
                keywords: [],
                matchedTexts: []
            };
            
            // 연속된 텍스트들을 조합하여 전체 문장 생성
            const allTexts = textDetections.map(d => d.description);
            const combinedText = allTexts.join(' ');
            console.log(`📝 전체 조합 텍스트: "${combinedText}"`);
            
            // 전체 조합 텍스트로 복합 분석 시도
            const combinedParts = analyzeComplexText(combinedText);
            if (combinedParts.length > 0) {
                analysisResults.parts.push(...combinedParts);
            }
            
            // 연속된 단어들을 조합하여 키워드 매칭 시도
            console.log('🔍 연속 단어 조합 분석 시작...');
            for (let i = 0; i < allTexts.length - 1; i++) {
                const currentWord = allTexts[i];
                const nextWord = allTexts[i + 1];
                const combinedWord = currentWord + nextWord;
                
                // 쓰레기 타입과 하위 타입 모두 확인
                [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
                    if (combinedWord.toLowerCase().includes(keyword.toLowerCase())) {
                        console.log(`   ✅ 조합 키워드 "${keyword}" 발견! (${combinedWord})`);
                        if (!analysisResults.keywords.includes(keyword)) {
                            analysisResults.keywords.push(keyword);
                            analysisResults.matchedTexts.push(combinedWord);
                        }
                    }
                });
            }
            
            // 개별 텍스트 분석
            textDetections.forEach((detection, index) => {
                const text = detection.description;
                
                if (shouldSkipText(text)) {
                    console.log(`   ⏭️ 건너뛴 텍스트 ${index + 1}: "${text}" (불필요한 텍스트)`);
                    return;
                }
                
                console.log(`   텍스트 ${index + 1}: "${text}"`);
                
                // 복합 텍스트 분석
                const parts = analyzeComplexText(text);
                
                if (parts.length > 0) {
                    analysisResults.parts.push(...parts);
                } else {
                    // 단순 키워드 매칭
                    const foundKeywords = [];
                    [...WASTE_TYPE_KEYWORDS, ...SUB_TYPE_KEYWORDS].forEach(keyword => {
                        if (text.toLowerCase().includes(keyword.toLowerCase())) {
                            foundKeywords.push(keyword);
                            console.log(`   ✅ 키워드 "${keyword}" 발견!`);
                        }
                    });
                    
                    if (foundKeywords.length > 0) {
                        analysisResults.keywords.push(...foundKeywords);
                        analysisResults.matchedTexts.push(text);
                    }
                }
            });
            
            // 결과 정리 (중복 제거 및 정리)
            if (analysisResults.parts.length > 0 || analysisResults.keywords.length > 0) {
                const uniqueKeywords = [...new Set(analysisResults.keywords)];
                const uniqueParts = analysisResults.parts.filter((part, index, self) => 
                    index === self.findIndex(p => 
                        p.part === part.part && p.wasteType === part.wasteType
                    )
                );
                
                analysis.recyclingTexts = [
                    ...uniqueKeywords,
                    ...uniqueParts.map(part => part.wasteType)
                ];
                analysis.complexAnalysis = uniqueParts;
                
                console.log('♻️ 발견된 분리수거 정보:', analysis.recyclingTexts);
                console.log('📝 정리된 복합 분석 결과:', uniqueParts);
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
            
            // 요약 생성 (복합 분석 결과 포함)
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
 * 통합 이미지 분석 함수
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
    detectObjects,
    analyzeRecyclingMarks,
    analyzeImageWithLogoDetection,
    // 새로운 키워드 상수들
    WASTE_TYPE_KEYWORDS,
    SUB_TYPE_KEYWORDS,
    RECYCLING_MARK_KEYWORDS,
    // 새로운 유틸리티 함수들
    isValidWasteType,
    isValidSubType,
    extractWasteTypes
}; 