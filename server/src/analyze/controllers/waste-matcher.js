/**
 * 쓰레기 분류 매칭 시스템
 * wasteType + subType 조합으로 사전 정의된 분리수거 방법을 찾고,
 * 매칭되지 않으면 GPT 완전 분석으로 폴백
 */

const wasteDisposalGuides = require('../data/waste-disposal-guides.json');

// wasteType + subType 조합으로 매칭하는 함수
async function findMatchingDisposalMethod(wasteType, subType, description = '', analysisResults = null) {
    console.log('🔍 분리수거 방법 매칭 시작:', { wasteType, subType, description });
    
    // 0. 설명 기반 우선 매칭 (가장 높은 우선순위)
    if (description) {
        const descriptionMatch = findDescriptionBasedMatch(description);
        if (descriptionMatch) {
            console.log('📝 설명 기반 매칭 발견:', descriptionMatch.title);
            return {
                ...descriptionMatch,
                matchType: 'description',
                confidence: 0.95
            };
        }
    }
    
    // 1. 정확한 조합 매칭 시도
    const exactMatch = findExactMatch(wasteType, subType);
    if (exactMatch) {
        console.log('✅ 정확한 매칭 발견:', exactMatch.title);
        return {
            ...exactMatch,
            matchType: 'exact',
            confidence: 0.95
        };
    }
    
    // 2. 부분 매칭 시도 (wasteType만)
    const partialMatch = findPartialMatch(wasteType, subType);
    if (partialMatch) {
        console.log('⚠️ 부분 매칭 발견:', partialMatch.title);
        return {
            ...partialMatch,
            matchType: 'partial',
            confidence: 0.75
        };
    }
    
    // 3. 객체/라벨 인식 기반 매칭 시도 (높은 우선순위)
    if (analysisResults) {
        const objectLabelMatch = await findObjectLabelMatch(analysisResults);
        if (objectLabelMatch) {
            console.log('🎯 객체/라벨 매칭 발견:', objectLabelMatch.title);
            return {
                ...objectLabelMatch,
                matchType: 'object_label',
                confidence: 0.85
            };
        }
    }
    
    // 4. 키워드 기반 매칭 시도
    const keywordMatch = findKeywordMatch(description, wasteType, subType);
    if (keywordMatch) {
        console.log('🔤 키워드 매칭 발견:', keywordMatch.title);
        return {
            ...keywordMatch,
            matchType: 'keyword',
            confidence: 0.65
        };
    }
    
    console.log('❌ 매칭 실패 - GPT 완전 분석으로 폴백');
    return null;
}

// 정확한 조합 매칭 (여러 옵션 지원)
function findExactMatch(wasteType, subType) {
    const guides = wasteDisposalGuides.disposalGuides;
    
    // subType이 여러 옵션으로 구분된 경우 처리
    const subTypeOptions = subType.includes('|') ? subType.split('|') : [subType];
    
    // wasteType으로 카테고리 찾기
    for (const category in guides) {
        const categoryItems = guides[category];
        
        for (const itemKey in categoryItems) {
            const item = categoryItems[itemKey];
            
            // wasteType이 일치하고 subType 중 하나라도 일치하는지 확인
            if (item.category === wasteType && subTypeOptions.includes(item.subType)) {
                console.log(`🎯 정확한 매칭 발견: ${wasteType} - ${item.subType} (옵션: ${subTypeOptions.join(', ')})`);
                return {
                    title: item.disposalMethod.title,
                    steps: item.disposalMethod.steps,
                    precautions: item.disposalMethod.precautions,
                    recyclingProcess: item.disposalMethod.recyclingProcess,
                    environmentalImpact: item.disposalMethod.environmentalImpact,
                    collectionSchedule: item.disposalMethod.collectionSchedule,
                    collectionMethod: item.disposalMethod.collectionMethod,
                    category: item.category,
                    subType: item.subType
                };
            }
        }
    }
    
    return null;
}

// 부분 매칭 (wasteType만 일치)
function findPartialMatch(wasteType, subType) {
    const guides = wasteDisposalGuides.disposalGuides;
    
    for (const category in guides) {
        const categoryItems = guides[category];
        
        for (const itemKey in categoryItems) {
            const item = categoryItems[itemKey];
            
            // wasteType만 일치하는 경우
            if (item.category === wasteType) {
                return {
                    title: item.disposalMethod.title,
                    steps: item.disposalMethod.steps,
                    precautions: item.disposalMethod.precautions,
                    recyclingProcess: item.disposalMethod.recyclingProcess,
                    environmentalImpact: item.disposalMethod.environmentalImpact,
                    collectionSchedule: item.disposalMethod.collectionSchedule,
                    collectionMethod: item.disposalMethod.collectionMethod,
                    category: item.category,
                    subType: item.subType,
                    note: `정확한 ${subType} 정보가 없어 ${item.subType} 기준으로 안내합니다.`
                };
            }
        }
    }
    
    return null;
}

// 설명 기반 우선 매칭 (가장 높은 우선순위)
function findDescriptionBasedMatch(description) {
    console.log('📝 설명 기반 매칭 시작:', description);
    
    const guides = wasteDisposalGuides.disposalGuides;
    const descLower = description.toLowerCase();
    
    // 특정 키워드 패턴 매칭
    const patterns = [
        { keyword: '라이터', itemKey: '기타_라이터' },
        { keyword: '이불', itemKey: '기타_이불' },
        { keyword: '우산', itemKey: '기타_우산' },
        { keyword: '텀블러', itemKey: '기타_텀블러' },
        { keyword: '보온병', itemKey: '기타_텀블러' },
        { keyword: '스테인리스', itemKey: '기타_텀블러' }
    ];
    
    for (const pattern of patterns) {
        if (descLower.includes(pattern.keyword.toLowerCase())) {
            console.log(`✅ 설명 패턴 매칭: "${pattern.keyword}"`);
            
            // 해당 항목 찾기
            for (const category in guides) {
                const categoryItems = guides[category];
                if (categoryItems[pattern.itemKey]) {
                    const item = categoryItems[pattern.itemKey];
                    return {
                        title: item.disposalMethod.title,
                        steps: item.disposalMethod.steps,
                        precautions: item.disposalMethod.precautions,
                        recyclingProcess: item.disposalMethod.recyclingProcess,
                        environmentalImpact: item.disposalMethod.environmentalImpact,
                        collectionSchedule: item.disposalMethod.collectionSchedule,
                        collectionMethod: item.disposalMethod.collectionMethod,
                        category: item.category,
                        subType: item.subType,
                        note: `설명 기반 매칭: "${pattern.keyword}"`
                    };
                }
            }
        }
    }
    
    return null;
}

// 키워드 기반 매칭
function findKeywordMatch(description, wasteType, subType) {
    const guides = wasteDisposalGuides.disposalGuides;
    let bestMatch = null;
    let bestScore = 0;
    
    for (const category in guides) {
        const categoryItems = guides[category];
        
        for (const itemKey in categoryItems) {
            const item = categoryItems[itemKey];
            const keywords = item.keywords || [];
            
            // 설명에서 키워드 매칭 점수 계산
            let score = 0;
            const descLower = description.toLowerCase();
            
            keywords.forEach(keyword => {
                if (descLower.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            });
            
            // wasteType 일치 시 보너스 점수
            if (item.category === wasteType) {
                score += 2;
            }
            
            // subType 일치 시 보너스 점수
            if (item.subType === subType) {
                score += 3;
            }
            
            if (score > bestScore && score >= 1) {
                bestScore = score;
                bestMatch = {
                    title: item.disposalMethod.title,
                    steps: item.disposalMethod.steps,
                    precautions: item.disposalMethod.precautions,
                    recyclingProcess: item.disposalMethod.recyclingProcess,
                    environmentalImpact: item.disposalMethod.environmentalImpact,
                    collectionSchedule: item.disposalMethod.collectionSchedule,
                    collectionMethod: item.disposalMethod.collectionMethod,
                    category: item.category,
                    subType: item.subType,
                    note: `키워드 매칭으로 유사한 항목을 찾았습니다. (점수: ${score})`
                };
            }
        }
    }
    
    return bestMatch;
}

// 객체 인식 및 라벨 인식 결과를 활용한 매칭
async function findObjectLabelMatch(analysisResults) {
    console.log('🔍 객체/라벨 기반 매칭 시작');
    
    const guides = wasteDisposalGuides.disposalGuides;
    let bestMatch = null;
    let bestScore = 0;
    
    // 객체 인식 결과에서 매칭
    if (analysisResults.recyclingObjects && analysisResults.recyclingObjects.length > 0) {
        console.log('🎯 객체 인식 결과 분석:', analysisResults.recyclingObjects);
        
        for (const obj of analysisResults.recyclingObjects) {
            const objName = obj.name.toLowerCase();
            console.log(`🔍 객체 "${objName}" 매칭 시도`);
            
            // GPT 기반 유사성 분석 시도
            const gptMatch = await findGPTBasedMatch(objName, guides, 'object');
            if (gptMatch && gptMatch.score > bestScore) {
                bestScore = gptMatch.score;
                bestMatch = gptMatch.match;
                console.log(`✅ GPT 객체 매칭 성공: ${gptMatch.match.title} (점수: ${gptMatch.score})`);
            }
            
            // 기존 키워드 매칭도 시도
            for (const category in guides) {
                const categoryItems = guides[category];
                
                for (const itemKey in categoryItems) {
                    const item = categoryItems[itemKey];
                    const keywords = item.keywords || [];
                    
                    let score = 0;
                    
                    // 객체명과 키워드 매칭
                    keywords.forEach(keyword => {
                        const keywordLower = keyword.toLowerCase();
                        if (objName.includes(keywordLower) || keywordLower.includes(objName)) {
                            score += 3; // 객체 매칭은 높은 가중치
                            console.log(`✅ 객체 매칭: "${objName}" ↔ "${keyword}"`);
                        }
                    });
                    
                    // 재활용 마크와 매칭
                    if (item.recyclingMarks) {
                        item.recyclingMarks.forEach(mark => {
                            const markLower = mark.toLowerCase();
                            if (objName.includes(markLower) || markLower.includes(objName)) {
                                score += 2;
                                console.log(`✅ 마크 매칭: "${objName}" ↔ "${mark}"`);
                            }
                        });
                    }
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = {
                            title: item.disposalMethod.title,
                            steps: item.disposalMethod.steps,
                            precautions: item.disposalMethod.precautions,
                            recyclingProcess: item.disposalMethod.recyclingProcess,
                            environmentalImpact: item.disposalMethod.environmentalImpact,
                            collectionSchedule: item.disposalMethod.collectionSchedule,
                            collectionMethod: item.disposalMethod.collectionMethod,
                            category: item.category,
                            subType: item.subType,
                            note: `객체 인식으로 매칭: "${objName}" (점수: ${score})`
                        };
                    }
                }
            }
        }
    }
    
    // 라벨 인식 결과에서 매칭
    if (analysisResults.recyclingLabels && analysisResults.recyclingLabels.length > 0) {
        console.log('🏷️ 라벨 인식 결과 분석:', analysisResults.recyclingLabels);
        
        for (const label of analysisResults.recyclingLabels) {
            const labelName = label.name.toLowerCase();
            console.log(`🔍 라벨 "${labelName}" 매칭 시도`);
            
            // GPT 기반 유사성 분석 시도
            const gptMatch = await findGPTBasedMatch(labelName, guides, 'label');
            if (gptMatch && gptMatch.score > bestScore) {
                bestScore = gptMatch.score;
                bestMatch = gptMatch.match;
                console.log(`✅ GPT 라벨 매칭 성공: ${gptMatch.match.title} (점수: ${gptMatch.score})`);
            }
            
            // 기존 키워드 매칭도 시도
            for (const category in guides) {
                const categoryItems = guides[category];
                
                for (const itemKey in categoryItems) {
                    const item = categoryItems[itemKey];
                    const keywords = item.keywords || [];
                    
                    let score = 0;
                    
                    // 라벨명과 키워드 매칭
                    keywords.forEach(keyword => {
                        const keywordLower = keyword.toLowerCase();
                        if (labelName.includes(keywordLower) || keywordLower.includes(labelName)) {
                            score += 2; // 라벨 매칭은 중간 가중치
                            console.log(`✅ 라벨 매칭: "${labelName}" ↔ "${keyword}"`);
                        }
                    });
                    
                    // 재활용 마크와 매칭
                    if (item.recyclingMarks) {
                        item.recyclingMarks.forEach(mark => {
                            const markLower = mark.toLowerCase();
                            if (labelName.includes(markLower) || markLower.includes(labelName)) {
                                score += 1;
                                console.log(`✅ 마크 매칭: "${labelName}" ↔ "${mark}"`);
                            }
                        });
                    }
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = {
                            title: item.disposalMethod.title,
                            steps: item.disposalMethod.steps,
                            precautions: item.disposalMethod.precautions,
                            recyclingProcess: item.disposalMethod.recyclingProcess,
                            environmentalImpact: item.disposalMethod.environmentalImpact,
                            collectionSchedule: item.disposalMethod.collectionSchedule,
                            collectionMethod: item.disposalMethod.collectionMethod,
                            category: item.category,
                            subType: item.subType,
                            note: `라벨 인식으로 매칭: "${labelName}" (점수: ${score})`
                        };
                    }
                }
            }
        }
    }
    
    if (bestMatch) {
        console.log(`✅ 객체/라벨 매칭 성공: ${bestMatch.title} (점수: ${bestScore})`);
    } else {
        console.log('❌ 객체/라벨 매칭 실패');
    }
    
    return bestMatch;
}

// GPT 기반 유사성 매칭 함수
async function findGPTBasedMatch(detectedName, guides, detectionType) {
    try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // 가이드 데이터를 문자열로 변환
        const guidesData = [];
        for (const category in guides) {
            const categoryItems = guides[category];
            for (const itemKey in categoryItems) {
                const item = categoryItems[itemKey];
                guidesData.push({
                    key: itemKey,
                    category: item.category,
                    subType: item.subType,
                    itemNameKor: item.itemNameKor,
                    keywords: item.keywords || [],
                    recyclingMarks: item.recyclingMarks || []
                });
            }
        }
        
        const prompt = `다음은 ${detectionType} 인식으로 발견된 물체입니다: "${detectedName}"

아래 분리수거 가이드 중에서 이 물체와 가장 유사한 항목을 찾아주세요. 
키워드가 완전히 일치하지 않더라도 의미적으로 유사하거나 같은 종류의 물체라면 매칭해주세요.

**분리수거 가이드:**
${JSON.stringify(guidesData, null, 2)}

**매칭 기준:**
1. 물체의 기능이나 용도가 유사한지
2. 재질이나 형태가 유사한지  
3. 키워드나 마크가 부분적으로라도 일치하는지
4. 같은 카테고리의 물체인지

가장 적합한 항목을 하나만 선택하여 다음 JSON 형식으로 응답해주세요:
{
  "matchedKey": "매칭된 항목의 키",
  "confidence": 0.0-1.0,
  "reason": "매칭 이유"
}

매칭되는 항목이 없다면 null을 반환해주세요.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.1
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        
        if (result && result.matchedKey) {
            // 매칭된 항목 찾기
            for (const category in guides) {
                const categoryItems = guides[category];
                if (categoryItems[result.matchedKey]) {
                    const item = categoryItems[result.matchedKey];
                    return {
                        score: result.confidence * 5, // GPT 매칭은 높은 가중치
                        match: {
                            title: item.disposalMethod.title,
                            steps: item.disposalMethod.steps,
                            precautions: item.disposalMethod.precautions,
                            recyclingProcess: item.disposalMethod.recyclingProcess,
                            environmentalImpact: item.disposalMethod.environmentalImpact,
                            collectionSchedule: item.disposalMethod.collectionSchedule,
                            collectionMethod: item.disposalMethod.collectionMethod,
                            category: item.category,
                            subType: item.subType,
                            note: `GPT ${detectionType} 매칭: "${detectedName}" → "${item.itemNameKor}" (이유: ${result.reason})`
                        }
                    };
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error(`❌ GPT ${detectionType} 매칭 오류:`, error);
        return null;
    }
}

// GPT 완전 분석을 위한 프롬프트 생성
function generateGPTFallbackPrompt(wasteType, subType, description, analysisResults) {
    return `다음 정보를 바탕으로 쓰레기 분류 및 분리수거 방법을 완전히 분석해주세요:

**기본 분류 정보:**
- wasteType: ${wasteType}
- subType: ${subType}
- description: ${description}

**AI 분석 결과:**
${JSON.stringify(analysisResults, null, 2)}

**요구사항:**
1. 위 정보를 종합하여 가장 정확한 쓰레기 분류를 수행
2. 구체적이고 실용적인 분리수거 방법 제시
3. 환경 영향 및 주의사항 포함
4. 한국의 실제 분리수거 기준에 맞춰 안내

JSON 형식으로 응답:
{
  "wasteType": "최종 쓰레기 타입",
  "subType": "세부 분류",
  "recyclingMark": "재활용 마크 정보",
  "description": "상세 설명",
  "disposalMethod": {
    "title": "분리수거 방법 제목",
    "steps": ["단계별 처리 방법"],
    "precautions": ["주의사항"],
    "recyclingProcess": "재활용 과정",
    "environmentalImpact": "환경 영향",
    "collectionSchedule": "수거 일정",
    "collectionMethod": "수거 방법"
  },
  "confidence": 0.9,
  "analysisType": "gpt_fallback"
}`;
}

// 매칭 결과를 분석 결과 형식으로 변환
function convertMatchToAnalysisResult(match, originalAnalysis) {
    // wasteType을 더 구체적으로 표시
    let displayWasteType = match.category;
    
    // 특정 카테고리의 경우 subType을 사용하여 더 구체적으로 표시
    if (match.category === '기타' && match.subType) {
        displayWasteType = match.subType; // 예: "라이터", "이불", "우산" 등
    } else if (match.category === '재활용품' && match.subType) {
        // 재활용품의 경우 카테고리_서브타입 형태로 표시
        displayWasteType = `${match.category}_${match.subType}`;
    }
    
    return {
        wasteType: displayWasteType,
        subType: match.subType,
        recyclingMark: originalAnalysis.recyclingMark || '해당없음',
        description: originalAnalysis.description || match.title,
        disposalMethod: match.title,
        confidence: match.confidence,
        analysisType: match.matchType,
        detailedMethod: {
            steps: match.steps,
            precautions: match.precautions,
            recyclingProcess: match.recyclingProcess,
            environmentalImpact: match.environmentalImpact,
            collectionSchedule: match.collectionSchedule,
            collectionMethod: match.collectionMethod
        },
        note: match.note || null
    };
}

module.exports = {
    findMatchingDisposalMethod,
    generateGPTFallbackPrompt,
    convertMatchToAnalysisResult,
    findObjectLabelMatch,
    findGPTBasedMatch,
    findDescriptionBasedMatch
}; 