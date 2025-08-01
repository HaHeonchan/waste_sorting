/**
 * GPT 프롬프트 템플릿 모음
 * 쓰레기 분류를 위한 다양한 분석 프롬프트들
 */

// ============================================================================
// 텍스트 기반 분석 프롬프트
// ============================================================================

const TEXT_BASED_ANALYSIS_PROMPT = `다음은 Google Vision API로 분석된 텍스트 결과입니다:

{textAnalysisResults}

위 텍스트 분석 결과를 바탕으로 쓰레기 분류를 수행해주세요.

**분석 요구사항:**
1. 텍스트에서 재활용 마크나 재질 정보를 찾아 분류
2. 파츠별로 재질이 다르게 표시된 경우 각각 분석
3. 한국의 실제 분리수거 기준에 맞춰 분류
4. 구체적이고 실용적인 분리수거 방법 제시

**응답 형식 (JSON):**
{
  "wasteType": "주요 쓰레기 타입 (예: 플라스틱, 종이, 유리, 캔류, 기타)",
  "subType": "세부 분류 (예: PET, HDPE, PP, 알루미늄, 스테인리스)",
  "recyclingMark": "재활용 마크 정보 (예: PET, HDPE, PP, 기타)",
  "description": "상세 설명",
  "disposalMethod": "분리수거 방법 (예: 재활용품, 일반쓰레기, 특수폐기물)",
  "confidence": 0.9,
  "materialParts": [
    {
      "part": "부분명 (예: 본체, 뚜껑, 라벨)",
      "material": "재질 (예: PET, PP, 알루미늄)",
      "description": "설명",
      "disposalMethod": "해당 부분의 분리수거 방법"
    }
  ]
}`;

// ============================================================================
// 통합 분석 프롬프트 (텍스트 + 객체 + 라벨)
// ============================================================================

const COMPREHENSIVE_ANALYSIS_PROMPT = `다음은 Google Vision API로 통합 분석된 결과입니다:

**텍스트 분석 결과:**
{textAnalysisResults}

**객체 인식 결과:**
{objectAnalysisResults}

**라벨 인식 결과:**
{labelAnalysisResults}

**로고 인식 결과:**
{logoAnalysisResults}

위 모든 분석 결과를 종합하여 가장 정확한 쓰레기 분류를 수행해주세요.

**분석 우선순위:**
1. 텍스트에서 발견된 재활용 마크가 가장 중요
2. 객체 인식으로 확인된 물체의 재질 정보
3. 라벨 인식으로 확인된 분류 정보
4. 로고 인식으로 확인된 브랜드 정보

**응답 형식 (JSON):**
{
  "wasteType": "주요 쓰레기 타입",
  "subType": "세부 분류",
  "recyclingMark": "재활용 마크 정보",
  "description": "상세 설명 (모든 분석 결과를 종합한 설명)",
  "disposalMethod": "분리수거 방법",
  "confidence": 0.95,
  "analysisDetails": {
    "textAnalysis": "텍스트 분석에서 발견된 정보",
    "objectAnalysis": "객체 인식에서 발견된 정보",
    "labelAnalysis": "라벨 인식에서 발견된 정보",
    "logoAnalysis": "로고 인식에서 발견된 정보"
  },
  "materialParts": [
    {
      "part": "부분명",
      "material": "재질",
      "description": "설명",
      "disposalMethod": "해당 부분의 분리수거 방법"
    }
  ]
}`;

// ============================================================================
// 직접 이미지 분석 프롬프트
// ============================================================================

const DIRECT_IMAGE_ANALYSIS_PROMPT = `이 이미지를 보고 쓰레기 분류를 수행해주세요.

**분석 기준:**
1. 이미지에서 보이는 물체의 재질을 판단
2. 재활용 마크나 라벨이 있는지 확인
3. 물체의 형태와 용도를 고려
4. 한국의 실제 분리수거 기준에 맞춰 분류

**주의사항:**
- 재활용 마크가 명확히 보이지 않으면 일반쓰레기로 분류
- 여러 재질이 섞여있다면 주요 재질을 기준으로 분류
- 특수한 물체는 기타로 분류

**응답 형식 (JSON):**
{
  "wasteType": "주요 쓰레기 타입",
  "subType": "세부 분류",
  "recyclingMark": "재활용 마크 정보 (없으면 '해당없음')",
  "description": "이미지에서 보이는 물체에 대한 상세 설명",
  "disposalMethod": "분리수거 방법",
  "confidence": 0.8,
  "materialParts": [
    {
      "part": "본체",
      "material": "주요 재질",
      "description": "이미지에서 확인된 주요 재질",
      "disposalMethod": "일반쓰레기"
    }
  ]
}`;

// ============================================================================
// 객체 기반 분석 프롬프트
// ============================================================================

const OBJECT_BASED_ANALYSIS_PROMPT = `다음은 Google Vision API로 탐지된 객체들입니다:

**탐지된 객체들:**
{objectAnalysisResults}

**객체별 신뢰도:**
{objectConfidenceResults}

위 객체 인식 결과를 바탕으로 쓰레기 분류를 수행해주세요.

**분석 기준:**
1. 탐지된 객체의 재질을 추정
2. 객체의 용도와 형태를 고려
3. 재활용 가능한 물체인지 판단
4. 한국의 분리수거 기준에 맞춰 분류

**응답 형식 (JSON):**
{
  "wasteType": "주요 쓰레기 타입",
  "subType": "세부 분류",
  "recyclingMark": "재활용 마크 정보",
  "description": "탐지된 객체들에 대한 설명",
  "disposalMethod": "분리수거 방법",
  "confidence": 0.85,
  "materialParts": [
    {
      "part": "탐지된 객체",
      "material": "추정된 재질",
      "description": "객체 인식 결과 기반 설명",
      "disposalMethod": "분리수거 방법"
    }
  ]
}`;

// ============================================================================
// 라벨 기반 분석 프롬프트
// ============================================================================

const LABEL_BASED_ANALYSIS_PROMPT = `다음은 Google Vision API로 탐지된 라벨들입니다:

**탐지된 라벨들:**
{labelAnalysisResults}

**라벨별 신뢰도:**
{labelConfidenceResults}

위 라벨 인식 결과를 바탕으로 쓰레기 분류를 수행해주세요.

**분석 기준:**
1. 라벨에서 재질 정보를 찾아 분류
2. 라벨의 내용을 해석하여 분리수거 방법 결정
3. 한국의 분리수거 기준에 맞춰 분류
4. 라벨이 명확하지 않으면 일반쓰레기로 분류

**응답 형식 (JSON):**
{
  "wasteType": "주요 쓰레기 타입",
  "subType": "세부 분류",
  "recyclingMark": "재활용 마크 정보",
  "description": "탐지된 라벨들에 대한 설명",
  "disposalMethod": "분리수거 방법",
  "confidence": 0.8,
  "materialParts": [
    {
      "part": "라벨이 붙은 부분",
      "material": "라벨에서 확인된 재질",
      "description": "라벨 인식 결과 기반 설명",
      "disposalMethod": "분리수거 방법"
    }
  ]
}`;



// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    TEXT_BASED_ANALYSIS_PROMPT,
    COMPREHENSIVE_ANALYSIS_PROMPT,
    DIRECT_IMAGE_ANALYSIS_PROMPT,
    OBJECT_BASED_ANALYSIS_PROMPT,
    LABEL_BASED_ANALYSIS_PROMPT
}; 