// 이미지 분석을 위한 프롬프트 정의

const WASTE_ANALYSIS_PROMPT = `이 이미지에 있는 쓰레기를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "wasteType": "일반쓰레기|재활용품|음식물쓰레기|유해폐기물|분석불가",
  "subType": "세부 분류 (예: 플라스틱병, 종이, 유리병, 캔, 전자제품, 기타 등)",
  "recyclingMark": "재활용 마크 종류 (PET, PP, PE, PS, PVC, 종이, 유리, 알루미늄, 철 등) - 재활용품이 아닌 경우 '해당없음'",
  "description": "친구가 말하는듯한 말투로 사진에 대한 한줄평을 추가해주세요.",
  "disposalMethod": "올바른 처리 방법 (예: 일반쓰레기봉투, 재활용품수거함, 음식물쓰레기통, 유해폐기물수거함)"
}

반드시 유효한 JSON 형식으로만 응답해주세요.`;

// 다른 프롬프트들도 추가 가능
const SIMPLE_CLASSIFICATION_PROMPT = `이 이미지에 있는 쓰레기를 다음 카테고리 중 하나로 분류해주세요: 일반쓰레기, 재활용품, 음식물쓰레기, 유해폐기물. 분류 이유도 간단히 설명해주세요.`;

const DETAILED_ANALYSIS_PROMPT = `이 이미지에 있는 쓰레기를 상세히 분석해주세요:

1. 쓰레기 종류 (일반쓰레기/재활용품/음식물쓰레기/유해폐기물)
2. 세부 분류 (플라스틱 종류, 종이 종류 등)
3. 재활용 가능 여부
4. 올바른 처리 방법
5. 환경 영향

JSON 형식으로 응답해주세요.`;

module.exports = {
    WASTE_ANALYSIS_PROMPT,
    SIMPLE_CLASSIFICATION_PROMPT,
    DETAILED_ANALYSIS_PROMPT
}; 