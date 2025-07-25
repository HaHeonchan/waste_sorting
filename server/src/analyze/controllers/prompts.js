/**
 * 이미지 분석을 위한 프롬프트 정의
 * 쓰레기 분류를 위한 핵심 분석 프롬프트들
 */

// 텍스트 기반 분석 프롬프트
const TEXT_BASED_ANALYSIS_PROMPT = `텍스트 분석 결과를 바탕으로 쓰레기 분류:

{textAnalysisResults}

JSON 형식으로 응답:
{
  "wasteType": "무색페트|비닐류|캔류|종이|일반팩|유리|플라스틱|폴리에틸렌|복합",
  "subType": "바이오|PET|HDPE|LDPE|PP|PS|OTHER|바이오PET|바이오HDPE|바이오LDPE|바이오PP|바이오PS|철|알미늄",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
  "description": "텍스트에서 보이는 쓰레기의 분리배출 방법",
  "disposalMethod": "처리 방법",
  "confidence": 0.95
}`;

// 이미지 직접 분석 프롬프트
const DIRECT_IMAGE_ANALYSIS_PROMPT = `이미지를 직접 분석하여 쓰레기 분류:

이미지에서 보이는 쓰레기의 모양, 색상, 재질, 특징을 바탕으로 분류해주세요.

JSON 형식으로 응답:
{
  "wasteType": "무색페트|비닐류|캔류|종이|일반팩|유리|플라스틱|폴리에틸렌|복합",
  "subType": "바이오|PET|HDPE|LDPE|PP|PS|OTHER|바이오PET|바이오HDPE|바이오LDPE|바이오PP|바이오PS|철|알미늄",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
  "description": "이미지에서 보이는 쓰레기의 분리배출 방법",
  "disposalMethod": "처리 방법",
  "confidence": 0.85
}

분석 기준:
- 플라스틱: 투명하거나 반투명한 용기, 유연한 재질
- 종이: 갈색이나 흰색, 접을 수 있는 재질
- 유리: 투명하고 단단한 재질, 빛을 반사
- 캔류: 금속성 광택, 원통형이나 사각형
- 비닐류: 얇고 유연한 포장재
- 일반쓰레기: 분류하기 어려운 복합 재질`;

module.exports = {
    TEXT_BASED_ANALYSIS_PROMPT,
    DIRECT_IMAGE_ANALYSIS_PROMPT
}; 