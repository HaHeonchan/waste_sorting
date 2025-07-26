/**
 * 개선된 분석 기능 테스트 파일
 * Google Vision API의 objects와 labels 기능을 포함한 통합 분석 예시
 */

const { 
    performComprehensiveVisionAnalysis,
    analyzeRecyclingMarksWithObjectsAndLabels,
    detectObjects,
    detectLabels,
    detectText,
    detectLogos
} = require('./logo-detector');

/**
 * 개선된 분석 기능 사용 예시
 */
async function testComprehensiveAnalysis() {
    console.log('🧪 개선된 분석 기능 테스트 시작');
    
    // 테스트 이미지 경로 (실제 이미지 파일로 교체 필요)
    const testImagePath = './test-image.jpg';
    
    try {
        // 1. 통합 Vision API 분석 (텍스트, 객체, 라벨, 로고 모두)
        console.log('\n1️⃣ 통합 Vision API 분석 실행...');
        const comprehensiveResult = await performComprehensiveVisionAnalysis(testImagePath);
        
        console.log('📊 통합 분석 결과:');
        console.log(`   📝 텍스트: ${comprehensiveResult.text.detections.length}개`);
        console.log(`   🎯 객체: ${comprehensiveResult.objects.length}개`);
        console.log(`   🏷️ 라벨: ${comprehensiveResult.labels.length}개`);
        console.log(`   🔍 로고: ${comprehensiveResult.logos.length}개`);
        
        // 2. 개선된 분리수거 마크 분석 (객체/라벨 포함)
        console.log('\n2️⃣ 개선된 분리수거 마크 분석 실행...');
        const recyclingAnalysis = await analyzeRecyclingMarksWithObjectsAndLabels(testImagePath);
        
        console.log('♻️ 분리수거 분석 결과:');
        console.log(`   📝 텍스트 기반: ${recyclingAnalysis.recyclingTexts.length}개`);
        console.log(`   🎯 객체 기반: ${recyclingAnalysis.recyclingObjects?.length || 0}개`);
        console.log(`   🏷️ 라벨 기반: ${recyclingAnalysis.recyclingLabels?.length || 0}개`);
        console.log(`   🎯 신뢰도: ${Math.round(recyclingAnalysis.confidence * 100)}%`);
        console.log(`   📋 요약: ${recyclingAnalysis.summary}`);
        
        // 3. 개별 기능 테스트
        console.log('\n3️⃣ 개별 기능 테스트...');
        
        // 객체 탐지만
        const objectsOnly = await detectObjects(testImagePath);
        console.log(`   🎯 객체 탐지: ${objectsOnly.length}개`);
        
        // 라벨 탐지만
        const labelsOnly = await detectLabels(testImagePath);
        console.log(`   🏷️ 라벨 탐지: ${labelsOnly.length}개`);
        
        // 텍스트 탐지만
        const textOnly = await detectText(testImagePath);
        console.log(`   📝 텍스트 탐지: ${textOnly.detections.length}개`);
        
        // 로고 탐지만
        const logosOnly = await detectLogos(testImagePath);
        console.log(`   🔍 로고 탐지: ${logosOnly.length}개`);
        
        return {
            comprehensive: comprehensiveResult,
            recycling: recyclingAnalysis,
            individual: {
                objects: objectsOnly,
                labels: labelsOnly,
                text: textOnly,
                logos: logosOnly
            }
        };
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error);
        throw error;
    }
}

/**
 * GPT에게 전달할 데이터 포맷팅 예시
 */
function formatDataForGPT(comprehensiveResult, recyclingAnalysis) {
    // 텍스트 분석 결과 포맷팅
    const textAnalysisResults = {
        hasRecyclingMarks: recyclingAnalysis.recyclingMarks.length > 0,
        recyclingTexts: recyclingAnalysis.recyclingTexts || [],
        recyclingMarks: recyclingAnalysis.recyclingMarks || [],
        complexAnalysis: recyclingAnalysis.complexAnalysis || [],
        confidence: recyclingAnalysis.confidence || 0,
        summary: recyclingAnalysis.summary || ''
    };

    // 객체 분석 결과 포맷팅
    const objectAnalysisResults = recyclingAnalysis.recyclingObjects?.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        description: `${obj.name} (신뢰도: ${Math.round(obj.score * 100)}%)`
    })) || [];

    // 라벨 분석 결과 포맷팅
    const labelAnalysisResults = recyclingAnalysis.recyclingLabels?.map(label => ({
        name: label.description,
        confidence: label.score,
        description: `${label.description} (신뢰도: ${Math.round(label.score * 100)}%)`
    })) || [];

    // 로고 분석 결과 포맷팅
    const logoAnalysisResults = recyclingAnalysis.logos?.map(logo => ({
        name: logo.description,
        confidence: logo.score || 0.8,
        description: `${logo.description} (신뢰도: ${Math.round((logo.score || 0.8) * 100)}%)`
    })) || [];

    return {
        textAnalysisResults,
        objectAnalysisResults,
        labelAnalysisResults,
        logoAnalysisResults
    };
}

/**
 * 분석 결과 비교 예시
 */
function compareAnalysisResults(basicResult, comprehensiveResult) {
    console.log('\n📊 분석 결과 비교:');
    console.log('기본 분석 (텍스트만):');
    console.log(`   신뢰도: ${Math.round(basicResult.confidence * 100)}%`);
    console.log(`   발견된 키워드: ${basicResult.recyclingTexts.length}개`);
    
    console.log('\n개선된 분석 (텍스트 + 객체 + 라벨):');
    console.log(`   신뢰도: ${Math.round(comprehensiveResult.confidence * 100)}%`);
    console.log(`   텍스트 키워드: ${comprehensiveResult.recyclingTexts.length}개`);
    console.log(`   객체 정보: ${comprehensiveResult.recyclingObjects?.length || 0}개`);
    console.log(`   라벨 정보: ${comprehensiveResult.recyclingLabels?.length || 0}개`);
    
    const improvement = comprehensiveResult.confidence - basicResult.confidence;
    console.log(`\n🎯 개선 효과: ${Math.round(improvement * 100)}%p 향상`);
}

// 모듈 내보내기
module.exports = {
    testComprehensiveAnalysis,
    formatDataForGPT,
    compareAnalysisResults
};

// 직접 실행 시 테스트
if (require.main === module) {
    testComprehensiveAnalysis()
        .then(result => {
            console.log('\n✅ 테스트 완료!');
            console.log('📋 결과 요약:', JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error('❌ 테스트 실패:', error);
            process.exit(1);
        });
} 