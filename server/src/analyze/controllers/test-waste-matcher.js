/**
 * 쓰레기 분류 매칭 시스템 테스트
 */

const {
    findMatchingDisposalMethod,
    generateGPTFallbackPrompt,
    convertMatchToAnalysisResult
} = require('./waste-matcher');

// 테스트 케이스들
const testCases = [
    {
        name: "비닐류 OTHER 테스트",
        wasteType: "비닐류",
        subType: "OTHER",
        description: "복합플라스틱 비닐류"
    },
    {
        name: "비닐류 LDPE 테스트",
        wasteType: "비닐류",
        subType: "LDPE",
        description: "LDPE 비닐류"
    },
    {
        name: "비닐류 다중 옵션 테스트",
        wasteType: "비닐류",
        subType: "LDPE|HDPE|PP|OTHER",
        description: "LDPE, HDPE, PP, OTHER 중 하나인 비닐류"
    },
    {
        name: "매칭 실패 테스트",
        wasteType: "알 수 없는 타입",
        subType: "알 수 없는 서브타입",
        description: "매칭되지 않는 항목"
    }
];

// 테스트 실행
async function runTests() {
    console.log('🧪 쓰레기 분류 매칭 시스템 테스트 시작\n');
    
    for (const testCase of testCases) {
        console.log(`📋 테스트: ${testCase.name}`);
        console.log(`   입력: ${testCase.wasteType} / ${testCase.subType}`);
        console.log(`   설명: ${testCase.description}`);
        
        const result = findMatchingDisposalMethod(
            testCase.wasteType,
            testCase.subType,
            testCase.description
        );
        
        if (result) {
            console.log(`   ✅ 매칭 성공 (${result.matchType})`);
            console.log(`   제목: ${result.title}`);
            console.log(`   서브타입: ${result.subType}`);
            console.log(`   신뢰도: ${result.confidence}`);
            if (result.note) {
                console.log(`   참고: ${result.note}`);
            }
        } else {
            console.log(`   ❌ 매칭 실패 - GPT 폴백 필요`);
        }
        
        console.log('');
    }
    
    console.log('🎯 GPT 폴백 프롬프트 테스트');
    const fallbackPrompt = generateGPTFallbackPrompt(
        "알 수 없는 타입",
        "알 수 없는 서브타입",
        "테스트 설명",
        { test: "data" }
    );
    console.log('생성된 프롬프트 길이:', fallbackPrompt.length);
    console.log('프롬프트 미리보기:', fallbackPrompt.substring(0, 200) + '...');
}

// 직접 실행 시 테스트 실행
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests }; 