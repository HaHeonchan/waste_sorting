/**
 * 쓰레기 분류 매칭 시스템
 * wasteType + subType 조합으로 사전 정의된 분리수거 방법을 찾고,
 * 매칭되지 않으면 GPT 완전 분석으로 폴백
 */

const wasteDisposalGuides = require('../data/waste-disposal-guides.json');

// wasteType + subType 조합으로 매칭하는 함수
function findMatchingDisposalMethod(wasteType, subType, description = '') {
    console.log('🔍 분리수거 방법 매칭 시작:', { wasteType, subType, description });
    
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
    
    // 3. 키워드 기반 매칭 시도
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
    return {
        wasteType: match.category,
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
    convertMatchToAnalysisResult
}; 