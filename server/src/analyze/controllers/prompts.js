/**
 * 쓰레기 분류를 위한 통합 분석 프롬프트
 */
const UNIFIED_SINGLE_STAGE_PROMPT = `이미지와 Vision API 분석 결과를 종합하여 쓰레기 분류를 수행해주세요.

**Vision API 분석 결과:**
- 탐지된 라벨들: {labels}
- 탐지된 텍스트들: {texts}
- 재활용 마크/아이콘: {recyclingMarks}

**분석 기준:**
1. 재활용 마크가 있으면 재활용 마크를 우선적으로 고려
2. wasteType과 subType이 재질적으로 다르면 subType을 우선적으로 따름
3. 재활용 마크에 쉼표(,)가 있으면 각 재질을 별도의 materialParts 항목으로 분류
4. 재활용 마크가 하나의 재질만 있으면 본체만 분류하고 중복 분류하지 않음

**materialParts 작성 규칙:**
- 재활용 마크가 "HDPE, PP"인 경우: 본체(HDPE), 뚜껑(PP)
- 재활용 마크가 "PET" 하나만인 경우: 본체(PET)만
- 재활용 마크가 "알루미늄, 스테인리스"인 경우: 본체(알루미늄), 뚜껑(스테인리스)

**응답 형식 (JSON):**
{
  "wasteType": "주요 쓰레기 타입",
  "subType": "세부 분류", 
  "recyclingMark": "재활용 마크 정보",
  "description": "상세 설명",
  "disposalMethod": "분리수거 방법",
  "confidence": 0.9,
  "materialParts": [
    {
      "part": "부분명",
      "material": "재질",
      "description": "설명",
      "disposalMethod": "분리수거 방법"
    }
  ]
}

**중요: 반드시 완전한 JSON 형식으로 응답해주세요.**
**중요: 재활용 마크에 쉼표(,)가 있으면 반드시 각 재질을 별도의 materialParts 항목으로 만들어주세요.**
**중요: 재활용 마크가 하나의 재질만 있는 경우에는 본체만 분류하고 중복 분류하지 마세요.**
**중요: wasteType과 subType이 재질적으로 많이 다르면 subType을 우선적으로 따르세요.**`;

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    UNIFIED_SINGLE_STAGE_PROMPT
}; 