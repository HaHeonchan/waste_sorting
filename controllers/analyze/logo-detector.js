// Google Vision API를 사용한 로고 탐지 모듈
const vision = require('@google-cloud/vision');
const fs = require('fs');

// Vision API 클라이언트 초기화 (선택적)
let client = null;
try {
    client = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    console.log('✅ Google Vision API 클라이언트 초기화 성공');
} catch (error) {
    console.log('⚠️ Google Vision API 인증 파일이 없습니다. 로고 탐지 기능이 비활성화됩니다.');
    console.log('📝 Google Cloud Console에서 서비스 계정 키를 다운로드하여 gothic-brand-466306-a8-120b7ba62b78.json으로 저장하세요.');
}


const RECYCLING_MARK_KEYWORDS = [
    // 플라스틱 계열 (Plastics)
    '플라스틱',
    '비닐류',
    '무색페트',
    '바이오',
    'PET',
    'HDPE',
    'LDPE',
    'PP',
    'PS',
    'OTHER',

    // 캔 계열 (Cans)
    '캔류',
    '철',
    '알미늄',

    // 종이 계열 (Paper)
    '종이',
    '일반팩',
    '멸균팩',

    // 유리 (Glass)
    '유리',

    // 일반쓰레기
    '일반쓰레기',
];

// 로고 탐지 함수
async function detectLogos(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return [];
        }
        
        console.log('🔍 로고 탐지 시작:', imagePath);
        
        // 이미지 파일 읽기
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Vision API 호출
        const [result] = await client.logoDetection(imageBuffer);
        const logos = result.logoAnnotations;
        
        console.log(`✅ 로고 탐지 완료: ${logos.length}개의 로고 발견`);
        
        return logos;
        
    } catch (error) {
        console.error('❌ 로고 탐지 오류:', error);
        return [];
    }
}

// 텍스트 탐지 함수 (로고와 함께 텍스트도 확인)
async function detectText(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return { detections: [], usage: null };
        }
        
        console.log('📝 텍스트 탐지 시작:', imagePath);
        
        // 이미지 파일 읽기
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Vision API 호출
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
        
        // Google Vision API 사용량 정보 (실제로는 제한적이지만 추정)
        const imageSize = imageBuffer.length;
        const estimatedTokens = Math.ceil(imageSize / 4 * 1.37); // 대략적인 추정
        
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

// 복합 텍스트 분석 함수 (개선된 버전)
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
        
        // 분리수거 키워드와 정확히 매칭되는지 확인
        if (RECYCLING_MARK_KEYWORDS.some(keyword => 
            wasteType.toLowerCase() === keyword.toLowerCase() ||
            wasteType.toLowerCase().includes(keyword.toLowerCase())
        )) {
            // 중복 제거를 위해 이미 존재하는지 확인
            const existingIndex = results.findIndex(r => 
                r.part === part && r.wasteType === wasteType
            );
            
            if (existingIndex === -1) {
                results.push({
                    part: part,
                    wasteType: wasteType,
                    type: 'labeled_part'
                });
                console.log(`   ✅ 추가됨: "${part}" → "${wasteType}"`);
            } else {
                console.log(`   ⚠️ 중복 제거: "${part}" → "${wasteType}"`);
            }
        } else {
            console.log(`   ❌ 키워드 매칭 실패: "${wasteType}"`);
        }
    }
    
    // 패턴 2: 쉼표로 구분된 복합 분류 (예: "뚜껑+라벨 : 플라스틱, 용기 : 일반쓰레기")
    const pattern2 = /([^:]+)\s*:\s*([^,]+)(?:,\s*([^:]+)\s*:\s*([^,\n]+))?/g;
    let match2;
    
    while ((match2 = pattern2.exec(text)) !== null) {
        // 첫 번째 부분
        const part1 = match2[1].trim();
        const wasteType1 = match2[2].trim();
        
        console.log(`   📋 복합 파싱 1: "${part1}" → "${wasteType1}"`);
        
        if (RECYCLING_MARK_KEYWORDS.some(keyword => 
            wasteType1.toLowerCase() === keyword.toLowerCase() ||
            wasteType1.toLowerCase().includes(keyword.toLowerCase())
        )) {
            const existingIndex = results.findIndex(r => 
                r.part === part1 && r.wasteType === wasteType1
            );
            
            if (existingIndex === -1) {
                results.push({
                    part: part1,
                    wasteType: wasteType1,
                    type: 'labeled_part'
                });
                console.log(`   ✅ 복합 추가 1: "${part1}" → "${wasteType1}"`);
            }
        }
        
        // 두 번째 부분 (있는 경우)
        if (match2[3] && match2[4]) {
            const part2 = match2[3].trim();
            const wasteType2 = match2[4].trim();
            
            console.log(`   📋 복합 파싱 2: "${part2}" → "${wasteType2}"`);
            
            if (RECYCLING_MARK_KEYWORDS.some(keyword => 
                wasteType2.toLowerCase() === keyword.toLowerCase() ||
                wasteType2.toLowerCase().includes(keyword.toLowerCase())
            )) {
                const existingIndex = results.findIndex(r => 
                    r.part === part2 && r.wasteType === wasteType2
                );
                
                if (existingIndex === -1) {
                    results.push({
                        part: part2,
                        wasteType: wasteType2,
                        type: 'labeled_part'
                    });
                    console.log(`   ✅ 복합 추가 2: "${part2}" → "${wasteType2}"`);
                }
            }
        }
    }
    
    // 패턴 3: 분리된 단어들을 조합하여 키워드 찾기 (예: "일반" + "쓰레기" = "일반쓰레기")
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
        const combinedWord = words[i] + words[i + 1];
        console.log(`   🔍 단어 조합 시도: "${words[i]}" + "${words[i + 1]}" = "${combinedWord}"`);
        
        RECYCLING_MARK_KEYWORDS.forEach(keyword => {
            if (combinedWord.toLowerCase() === keyword.toLowerCase()) {
                console.log(`   ✅ 조합 키워드 정확 매칭: "${keyword}"`);
                const existingIndex = results.findIndex(r => 
                    r.part === combinedWord && r.wasteType === keyword
                );
                
                if (existingIndex === -1) {
                    results.push({
                        part: combinedWord,
                        wasteType: keyword,
                        type: 'combined_word'
                    });
                    console.log(`   ✅ 조합 단어 추가: "${combinedWord}" → "${keyword}"`);
                }
            }
        });
    }
    
    console.log(`   🎯 최종 복합 분석 결과: ${results.length}개 항목`);
    return results;
}

// 불필요한 텍스트 필터링 함수
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

// 객체 탐지 함수 (재활용 관련 물체 탐지)
async function detectObjects(imagePath) {
    try {
        if (!client) {
            console.log('⚠️ Google Vision API 클라이언트가 초기화되지 않았습니다.');
            return [];
        }
        
        console.log('🎯 객체 탐지 시작:', imagePath);
        
        // 이미지 파일 읽기
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Vision API 호출
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

// 분리수거 마크 분석 함수
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
        
        // 텍스트 탐지만 실행 (로고 탐지 제거)
        const textResult = await detectText(imagePath);
        const textDetections = textResult.detections;
        const visionUsage = textResult.usage;
        const logos = []; // 로고 탐지 비활성화
        const objects = []; // 객체 탐지 비활성화
        
        const analysis = {
            logos: [],
            recyclingTexts: [],
            recyclingObjects: [],
            recyclingMarks: [],
            confidence: 0,
            summary: ''
        };
        
        // 로고 분석
        if (logos && logos.length > 0) {
            analysis.logos = logos.map(logo => ({
                description: logo.description,
                confidence: logo.score,
                boundingPoly: logo.boundingPoly
            }));
            
            console.log('🏷️ 발견된 로고들:', analysis.logos.map(l => l.description));
        }
        
        // 텍스트 분석 (복합 분석 버전)
        if (textDetections && textDetections.length > 0) {
            console.log('🔍 전체 텍스트 분석 시작...');
            
            // 복합 분석을 위한 구조
            const analysisResults = {
                parts: [], // 각 부분별 분석 결과
                keywords: [], // 발견된 키워드
                matchedTexts: [] // 매칭된 텍스트
            };
            
            // 연속된 텍스트들을 조합하여 전체 문장 생성
            const allTexts = textDetections.map(d => d.description);
            const combinedText = allTexts.join(' ');
            console.log(`📝 전체 조합 텍스트: "${combinedText}"`);
            
            // 전체 조합 텍스트로 복합 분석 시도
            const combinedParts = analyzeComplexText(combinedText);
            if (combinedParts.length > 0) {
                analysisResults.parts.push(...combinedParts);
                console.log(`   📋 조합 텍스트 복합 분석 결과:`, combinedParts);
            }
            
            // 연속된 단어들을 조합하여 키워드 매칭 시도
            console.log('🔍 연속 단어 조합 분석 시작...');
            for (let i = 0; i < allTexts.length - 1; i++) {
                const currentWord = allTexts[i];
                const nextWord = allTexts[i + 1];
                const combinedWord = currentWord + nextWord;
                
                console.log(`   🔗 조합 시도 ${i + 1}: "${currentWord}" + "${nextWord}" = "${combinedWord}"`);
                
                // 조합된 단어로 키워드 매칭
                RECYCLING_MARK_KEYWORDS.forEach(keyword => {
                    if (combinedWord.toLowerCase().includes(keyword.toLowerCase())) {
                        console.log(`   ✅ 조합 키워드 "${keyword}" 발견! (${combinedWord})`);
                        if (!analysisResults.keywords.includes(keyword)) {
                            analysisResults.keywords.push(keyword);
                            analysisResults.matchedTexts.push(combinedWord);
                        }
                    }
                });
            }
            
            // 개별 텍스트도 분석 (기존 로직)
            textDetections.forEach((detection, index) => {
                const text = detection.description;
                
                // 불필요한 텍스트 필터링 (영어 문장, 긴 텍스트 등)
                if (shouldSkipText(text)) {
                    console.log(`   ⏭️ 건너뛴 텍스트 ${index + 1}: "${text}" (불필요한 텍스트)`);
                    return;
                }
                
                console.log(`   텍스트 ${index + 1}: "${text}"`);
                
                // 복합 텍스트 분석 (예: "뚜껑+라벨 : 플라스틱, 용기 : 일반쓰레기")
                const parts = analyzeComplexText(text);
                
                if (parts.length > 0) {
                    analysisResults.parts.push(...parts);
                    console.log(`   📋 복합 분석 결과:`, parts);
                } else {
                    // 단순 키워드 매칭
                    const foundKeywords = [];
                    RECYCLING_MARK_KEYWORDS.forEach(keyword => {
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
                // 중복 제거된 키워드
                const uniqueKeywords = [...new Set(analysisResults.keywords)];
                
                // 복합 분석 결과에서 중복 제거
                const uniqueParts = analysisResults.parts.filter((part, index, self) => 
                    index === self.findIndex(p => 
                        p.part === part.part && p.wasteType === part.wasteType
                    )
                );
                
                analysis.recyclingTexts = [
                    ...uniqueKeywords,
                    ...uniqueParts.map(part => part.wasteType)
                ];
                analysis.complexAnalysis = uniqueParts; // 중복 제거된 복합 분석 결과 저장
                
                console.log('♻️ 발견된 분리수거 정보:', analysis.recyclingTexts);
                console.log('📝 정리된 복합 분석 결과:', uniqueParts);
            } else {
                console.log('❌ 분리수거 관련 키워드를 찾을 수 없습니다.');
            }
        } else {
            console.log('❌ 텍스트가 발견되지 않았습니다.');
        }
        
        // 객체 분석
        if (objects && objects.length > 0) {
            const recyclingObjectKeywords = [
                'bottle', '병', 'container', '용기', 'can', '캔', 'jar', '병',
                'box', '박스', 'carton', '카톤', 'bag', '봉투', 'package', '패키지'
            ];
            
            const foundObjects = objects.filter(obj => 
                recyclingObjectKeywords.some(keyword => 
                    obj.name.toLowerCase().includes(keyword.toLowerCase())
                )
            );
            
            if (foundObjects.length > 0) {
                analysis.recyclingObjects = foundObjects.map(obj => ({
                    name: obj.name,
                    confidence: obj.score
                }));
                console.log('🎯 발견된 재활용 관련 객체:', foundObjects.map(obj => obj.name));
            }
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

// 통합 이미지 분석 함수 (기존 GPT 분석과 결합)
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
            usage: logoAnalysis.usage // 사용량 정보 추가
        };
        
    } catch (error) {
        console.error('❌ 통합 이미지 분석 오류:', error);
        throw error;
    }
}

module.exports = {
    detectLogos,
    detectText,
    detectObjects,
    analyzeRecyclingMarks,
    analyzeImageWithLogoDetection
}; 