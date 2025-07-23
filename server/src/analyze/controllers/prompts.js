/**
 * 이미지 분석을 위한 프롬프트 정의
 * 쓰레기 분류를 위한 다양한 분석 프롬프트들을 관리
 */

// ============================================================================
// 기본 분석 프롬프트
// ============================================================================

const WASTE_ANALYSIS_PROMPT = `이미지의 쓰레기를 분석하여 JSON으로 응답:

{
  "wasteType": "플라스틱|종이|유리|캔류|비닐류|일반쓰레기|기타|복합",
  "subType": "PET|HDPE|LDPE|PP|PS|OTHER|철|알미늄|유리|일반팩|멸균팩|복합",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
  "description": "친근한 설명",
  "disposalMethod": "처리 방법",
  "components": [
    {
      "part": "부분명",
      "wasteType": "분류",
      "disposalMethod": "처리방법"
    }
  ]
}

복합 제품의 경우 components 배열에 각 부분별 분류를 포함하세요.

예시:
- "뚜껑+라벨: 플라스틱, 용기: 일반쓰레기" → wasteType: "복합", components: [{"part": "뚜껑+라벨", "wasteType": "플라스틱", "disposalMethod": "플라스틱 재활용함"}, {"part": "용기", "wasteType": "일반쓰레기", "disposalMethod": "일반쓰레기봉투"}]
- 단일 제품 → components 배열 비우기`;

// ============================================================================
// 간단한 분류 프롬프트
// ============================================================================

const SIMPLE_CLASSIFICATION_PROMPT = `쓰레기를 분류: 일반쓰레기, 재활용품, 음식물쓰레기, 유해폐기물. 이유도 설명.`;

const DETAILED_ANALYSIS_PROMPT = `쓰레기 상세 분석: 종류, 세부분류, 재활용여부, 처리방법, 환경영향. JSON으로 응답.`;

// ============================================================================
// 텍스트 기반 분석 프롬프트 (최적화)
// ============================================================================

const TEXT_BASED_ANALYSIS_PROMPT = `텍스트 분석 결과를 바탕으로 쓰레기 분류:

{textAnalysisResults}

JSON 형식으로 응답:
{
  "wasteType": "플라스틱|종이|유리|캔류|비닐류|일반쓰레기|기타|복합",
  "subType": "PET|HDPE|LDPE|PP|PS|OTHER|철|알미늄|유리|일반팩|멸균팩|복합 (해당하지 않을경우 wasteType과 동일)",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
  "description": "친근한 설명 (복합 분석시 부분별 처리 명시)",
  "disposalMethod": "처리 방법 (복합시 부분별 제시)",
  "confidence": 0.95,
  "textAnalysisSummary": "주요 정보 요약",
  "components": [
    {
      "part": "부분명",
      "wasteType": "분류",
      "disposalMethod": "처리방법"
    }
  ]
}

복합 제품의 경우 components 배열에 각 부분별 분류를 포함하세요.

예시:
- "뚜껑+라벨: 플라스틱, 용기: 일반쓰레기" → wasteType: "복합", components: [{"part": "뚜껑+라벨", "wasteType": "플라스틱", "disposalMethod": "플라스틱 재활용함"}, {"part": "용기", "wasteType": "일반쓰레기", "disposalMethod": "일반쓰레기봉투"}]
- 단일 제품 → components 배열 비우기`;

// ============================================================================
// 이미지 직접 분석 프롬프트
// ============================================================================

const DIRECT_IMAGE_ANALYSIS_PROMPT = `이미지를 직접 분석하여 쓰레기 분류:

이미지에서 보이는 쓰레기의 모양, 색상, 재질, 특징을 바탕으로 분류해주세요.

JSON 형식으로 응답:
{
  "wasteType": "플라스틱|종이|유리|캔류|비닐류|일반쓰레기|기타|복합",
  "subType": "PET|HDPE|LDPE|PP|PS|OTHER|철|알미늄|유리|일반팩|멸균팩|복합 (해당하지 않을경우 wasteType과 동일)",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
  "description": "이미지에서 보이는 특징을 바탕으로 한 친근한 설명",
  "disposalMethod": "처리 방법",
  "confidence": 0.85,
  "imageAnalysisSummary": "이미지에서 보이는 주요 특징들",
  "components": [
    {
      "part": "부분명",
      "wasteType": "분류",
      "disposalMethod": "처리방법"
    }
  ]
}

분석 기준:
- 플라스틱: 투명하거나 반투명한 용기, 유연한 재질
- 종이: 갈색이나 흰색, 접을 수 있는 재질
- 유리: 투명하고 단단한 재질, 빛을 반사
- 캔류: 금속성 광택, 원통형이나 사각형
- 비닐류: 얇고 유연한 포장재
- 일반쓰레기: 분류하기 어려운 복합 재질

복합 제품의 경우 components 배열에 각 부분별 분류를 포함하세요.`;

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    WASTE_ANALYSIS_PROMPT,
    SIMPLE_CLASSIFICATION_PROMPT,
    DETAILED_ANALYSIS_PROMPT,
    TEXT_BASED_ANALYSIS_PROMPT,
    DIRECT_IMAGE_ANALYSIS_PROMPT
}; 