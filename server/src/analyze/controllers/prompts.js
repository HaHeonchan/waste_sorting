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
  "disposalMethod": "재활용 수거함에 버리세요",
  "confidence": 0.95,
  "materialParts": [
    {
      "part": "본체",
      "material": "HDPE",
      "description": "용기의 주요 부분, 단단하고 내구성이 좋음 (재활용 마크에서 확인된 재질)",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "뚜껑",
      "material": "PP",
      "description": "용기를 닫는 부분, 본체와 다른 재질 (재활용 마크에서 확인된 재질)",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "라벨",
      "material": "종이",
      "description": "제품 정보가 인쇄된 부분, 제거 가능",
      "disposalMethod": "재활용 수거함에 버리세요"
    }
  ]
}`;

// 개선된 통합 분석 프롬프트 (텍스트, 객체, 라벨 포함)
const COMPREHENSIVE_ANALYSIS_PROMPT = `Google Vision API의 통합 분석 결과를 바탕으로 쓰레기 분류:

**텍스트 분석 결과:**
{textAnalysisResults}

**객체 탐지 결과:**
{objectAnalysisResults}

**라벨 탐지 결과:**
{labelAnalysisResults}

**로고 탐지 결과:**
{logoAnalysisResults}

**재활용 마크 인식 결과(중요):** Vision API에서 추출된 재활용 마크(예: HDPE, PP 등)를 반드시 참고하여 materialParts에 반영하세요.

위의 모든 정보를 종합하여 가장 정확한 쓰레기 분류를 수행해주세요.
제품이 여러 부위로 구성되어 있다면 각 부위별로 재질을 분석해주세요.

**중요: materialParts 배열에는 반드시 2개 이상의 부위를 포함해야 합니다.**
- 본체, 뚜껑, 라벨, 손잡이, 펌프, 스프레이 노즐 등 모든 부위를 분석
- 각 부위의 재질이 다르다면 별도로 분리하여 기록
- 최소 2개, 최대 5개의 부위를 분석해주세요

**재질 구분 기준:**
- 본체: 용기의 주요 부분 (HDPE, PET, 유리 등)
- 뚜껑: 용기를 닫는 부분 (PP, PE 등, 본체와 다른 재질일 수 있음)
- 라벨: 제품 정보가 인쇄된 부분 (종이, 비닐 등)
- 손잡이: 잡기 위한 부분 (플라스틱, 금속 등)
- 펌프: 압출하는 부분 (플라스틱, 금속 등)

**예시:**
재활용 마크에 "HDPE"와 "PP"가 모두 표시되어 있다면, materialParts에 반드시 "본체: HDPE", "뚜껑: PP"로 각각 분리해서 작성하세요.
"materialParts": [
  { "part": "본체", "material": "HDPE", "description": "용기의 주요 부분, 단단하고 내구성이 좋음 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" },
  { "part": "뚜껑", "material": "PP", "description": "용기를 닫는 부분, 본체와 다른 재질 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" }
]

**주의: 본체와 뚜껑의 재질이 다르다면 반드시 구분하여 기록해주세요!**

JSON 형식으로 응답:
{
  "wasteType": "무색페트|비닐류|캔류|종이|일반팩|유리|플라스틱|폴리에틸렌|복합",
  "subType": "바이오|PET|HDPE|LDPE|PP|PS|OTHER|바이오PET|바이오HDPE|바이오LDPE|바이오PP|바이오PS|철|알미늄",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
        "description": "통합 분석 결과를 바탕으로 한 쓰레기의 분리배출 방법",
      "disposalMethod": "재활용 수거함에 버리세요",
  "confidence": 0.98,
  "analysisDetails": {
    "textBased": "텍스트 분석에서 발견된 정보",
    "objectBased": "객체 탐지에서 발견된 정보", 
    "labelBased": "라벨 탐지에서 발견된 정보",
    "logoBased": "로고 탐지에서 발견된 정보"
  },
  "materialParts": [
    {
      "part": "본체",
      "material": "HDPE",
      "description": "용기의 주요 부분, 단단하고 내구성이 좋음",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "뚜껑",
      "material": "PP",
      "description": "용기를 닫는 부분, 유연하고 밀폐성 좋음",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "라벨",
      "material": "종이",
      "description": "제품 정보가 인쇄된 부분, 제거 가능",
      "disposalMethod": "재활용 수거함에 버리세요"
    }
  ]
}`;

// 이미지 직접 분석 프롬프트
const DIRECT_IMAGE_ANALYSIS_PROMPT = `이미지를 직접 분석하여 쓰레기 분류:

이미지에서 보이는 쓰레기의 모양, 색상, 재질, 특징을 바탕으로 분류해주세요.
제품이 여러 부위로 구성되어 있다면 각 부위별로 재질을 분석해주세요.

**재활용 마크 인식 결과(중요):** Vision API에서 추출된 재활용 마크(예: HDPE, PP 등)를 반드시 참고하여 materialParts에 반영하세요.

**중요: materialParts 배열에는 반드시 2개 이상의 부위를 포함해야 합니다.**
- 본체, 뚜껑, 라벨, 손잡이, 펌프, 스프레이 노즐 등 모든 부위를 분석
- 각 부위의 재질이 다르다면 별도로 분리하여 기록
- 최소 2개, 최대 5개의 부위를 분석해주세요

**예시:**
재활용 마크에 "HDPE"와 "PP"가 모두 표시되어 있다면, materialParts에 반드시 "본체: HDPE", "뚜껑: PP"로 각각 분리해서 작성하세요.
"materialParts": [
  { "part": "본체", "material": "HDPE", "description": "용기의 주요 부분, 단단하고 내구성이 좋음 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" },
  { "part": "뚜껑", "material": "PP", "description": "용기를 닫는 부분, 본체와 다른 재질 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" }
]

분석 기준:
- 플라스틱: 투명하거나 반투명한 용기, 유연한 재질
- 종이: 갈색이나 흰색, 접을 수 있는 재질
- 유리: 투명하고 단단한 재질, 빛을 반사
- 캔류: 금속성 광택, 원통형이나 사각형
- 비닐류: 얇고 유연한 포장재
- 일반쓰레기: 분류하기 어려운 복합 재질

부위별 분석 예시:
- 본체: 주요 용기 부분
- 뚜껑: 용기를 닫는 부분
- 라벨: 제품 정보가 인쇄된 부분
- 손잡이: 잡기 위한 부분
- 스프레이 노즐: 분사하는 부분
- 펌프: 압출하는 부분`;

// 객체 기반 분석 프롬프트
const OBJECT_BASED_ANALYSIS_PROMPT = `객체 탐지 결과를 바탕으로 쓰레기 분류:

**탐지된 객체들:**
{objectAnalysisResults}

**객체별 신뢰도:**
{objectConfidenceResults}

위의 객체 정보를 바탕으로 쓰레기 분류를 수행해주세요.
제품이 여러 부위로 구성되어 있다면 각 부위별로 재질을 분석해주세요.

**재활용 마크 인식 결과(중요):** Vision API에서 추출된 재활용 마크(예: HDPE, PP 등)를 반드시 참고하여 materialParts에 반영하세요.

**중요: materialParts 배열에는 반드시 2개 이상의 부위를 포함해야 합니다.**
- 본체, 뚜껑, 라벨, 손잡이, 펌프, 스프레이 노즐 등 모든 부위를 분석
- 각 부위의 재질이 다르다면 별도로 분리하여 기록
- 최소 2개, 최대 5개의 부위를 분석해주세요

**예시:**
재활용 마크에 "HDPE"와 "PP"가 모두 표시되어 있다면, materialParts에 반드시 "본체: HDPE", "뚜껑: PP"로 각각 분리해서 작성하세요.
"materialParts": [
  { "part": "본체", "material": "HDPE", "description": "용기의 주요 부분, 단단하고 내구성이 좋음 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" },
  { "part": "뚜껑", "material": "PP", "description": "용기를 닫는 부분, 본체와 다른 재질 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" }
]

JSON 형식으로 응답:
{
  "wasteType": "무색페트|비닐류|캔류|종이|일반팩|유리|플라스틱|폴리에틸렌|복합",
  "subType": "바이오|PET|HDPE|LDPE|PP|PS|OTHER|바이오PET|바이오HDPE|바이오LDPE|바이오PP|바이오PS|철|알미늄",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
        "description": "객체 탐지 결과를 바탕으로 한 쓰레기의 분리배출 방법",
      "disposalMethod": "재활용 수거함에 버리세요",
  "confidence": 0.9,
  "detectedObjects": ["탐지된 주요 객체들"],
  "materialParts": [
    {
      "part": "본체",
      "material": "HDPE",
      "description": "용기의 주요 부분, 단단하고 내구성이 좋음",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "뚜껑",
      "material": "PP",
      "description": "용기를 닫는 부분, 유연하고 밀폐성 좋음",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "라벨",
      "material": "종이",
      "description": "제품 정보가 인쇄된 부분, 제거 가능",
      "disposalMethod": "재활용 수거함에 버리세요"
    }
  ]
}`;

// 라벨 기반 분석 프롬프트
const LABEL_BASED_ANALYSIS_PROMPT = `라벨 탐지 결과를 바탕으로 쓰레기 분류:

**탐지된 라벨들:**
{labelAnalysisResults}

**라벨별 신뢰도:**
{labelConfidenceResults}

위의 라벨 정보를 바탕으로 쓰레기 분류를 수행해주세요.
제품이 여러 부위로 구성되어 있다면 각 부위별로 재질을 분석해주세요.

**재활용 마크 인식 결과(중요):** Vision API에서 추출된 재활용 마크(예: HDPE, PP 등)를 반드시 참고하여 materialParts에 반영하세요.

**중요: materialParts 배열에는 반드시 2개 이상의 부위를 포함해야 합니다.**
- 본체, 뚜껑, 라벨, 손잡이, 펌프, 스프레이 노즐 등 모든 부위를 분석
- 각 부위의 재질이 다르다면 별도로 분리하여 기록
- 최소 2개, 최대 5개의 부위를 분석해주세요

**예시:**
재활용 마크에 "HDPE"와 "PP"가 모두 표시되어 있다면, materialParts에 반드시 "본체: HDPE", "뚜껑: PP"로 각각 분리해서 작성하세요.
"materialParts": [
  { "part": "본체", "material": "HDPE", "description": "용기의 주요 부분, 단단하고 내구성이 좋음 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" },
  { "part": "뚜껑", "material": "PP", "description": "용기를 닫는 부분, 본체와 다른 재질 (마크에서 확인된 재질)", "disposalMethod": "재활용 수거함에 버리세요" }
]

JSON 형식으로 응답:
{
  "wasteType": "무색페트|비닐류|캔류|종이|일반팩|유리|플라스틱|폴리에틸렌|복합",
  "subType": "바이오|PET|HDPE|LDPE|PP|PS|OTHER|바이오PET|바이오HDPE|바이오LDPE|바이오PP|바이오PS|철|알미늄",
  "recyclingMark": "재활용 마크 또는 '해당없음'",
        "description": "라벨 탐지 결과를 바탕으로 한 쓰레기의 분리배출 방법",
      "disposalMethod": "재활용 수거함에 버리세요",
  "confidence": 0.88,
  "detectedLabels": ["탐지된 주요 라벨들"],
  "materialParts": [
    {
      "part": "본체",
      "material": "HDPE",
      "description": "용기의 주요 부분, 단단하고 내구성이 좋음",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "뚜껑",
      "material": "PP",
      "description": "용기를 닫는 부분, 유연하고 밀폐성 좋음",
      "disposalMethod": "재활용 수거함에 버리세요"
    },
    {
      "part": "라벨",
      "material": "종이",
      "description": "제품 정보가 인쇄된 부분, 제거 가능",
      "disposalMethod": "재활용 수거함에 버리세요"
    }
  ]
}`;

// 모듈 내보내기
module.exports = {
    TEXT_BASED_ANALYSIS_PROMPT,
    COMPREHENSIVE_ANALYSIS_PROMPT,
    DIRECT_IMAGE_ANALYSIS_PROMPT,
    OBJECT_BASED_ANALYSIS_PROMPT,
    LABEL_BASED_ANALYSIS_PROMPT
}; 