// 이미지 업로드 및 분석 기능
let selectedFile = null;



// 미리보기 표시 함수
function showPreview(file) {
    const preview = document.getElementById('preview');
    const previewImage = document.getElementById('previewImage');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 이미지 분석 함수
async function analyzeImage() {
    if (!selectedFile) {
        alert('이미지를 선택해주세요.');
        return;
    }

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="loading">🔍 이미지를 분석하고 있습니다...</div>';

    try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch('/analyze/upload-analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || '서버 오류가 발생했습니다.');
        }

        const data = await response.json();
        console.log('서버 응답 데이터:', data); // 디버깅용
        
        // 결과 표시
        const analysis = data.analysis.analysis;
        const optimization = data.optimization;
        const textAnalysis = data.textAnalysis;
        const apiUsage = data.apiUsage;
        const isTextBasedAnalysis = data.analysis.textAnalysisSource;

        resultDiv.innerHTML = `
            <div class="result-container">
                <h3>📊 분석 결과</h3>
                <div class="analysis-result">
                    <div class="result-item">
                        <span class="label">🗂️ 쓰레기 종류:</span>
                        <span class="value ${getWasteTypeClass(analysis.wasteType)}">${analysis.wasteType}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">📦 세부 분류:</span>
                        <span class="value">${analysis.subType}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">♻️ 재활용 마크:</span>
                        <span class="value">${analysis.recyclingMark}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">💡 설명:</span>
                        <span class="value">${analysis.description}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">🗑️ 처리 방법:</span>
                        <span class="value">${analysis.disposalMethod}</span>
                    </div>
                    ${analysis.confidence ? `
                    <div class="result-item">
                        <span class="label">🎯 분석 신뢰도:</span>
                        <span class="value">${Math.round(analysis.confidence * 100)}%</span>
                    </div>
                    ` : ''}
                    <div class="result-item">
                        <span class="label">🤖 모델:</span>
                        <span class="value">${data.analysis.model} ${isTextBasedAnalysis ? '(텍스트 기반 분석)' : '(이미지 기반 분석)'}</span>
                    </div>
                    ${apiUsage ? `
                    <div class="result-item">
                        <span class="label">📊 API 사용량:</span>
                        <span class="value">
                            <div class="api-usage-item">
                                <strong>🤖 OpenAI:</strong> ${apiUsage.openAI?.total_tokens || 0} 토큰 
                                (입력: ${apiUsage.openAI?.prompt_tokens || 0}, 출력: ${apiUsage.openAI?.completion_tokens || 0})
                            </div>
                            ${apiUsage.googleVision ? `
                            <div class="api-usage-item">
                                <strong>🔍 Google Vision:</strong> ${apiUsage.googleVision.estimatedTokens || 0} 토큰 추정 
                                (이미지: ${Math.round(apiUsage.googleVision.imageSize/1024)}KB, 텍스트 영역: ${apiUsage.googleVision.textRegions}개)
                            </div>
                            ` : ''}
                            <div class="api-usage-item total">
                                <strong>📈 총 사용량:</strong> ${apiUsage.total.estimatedTokens} 토큰 추정
                            </div>
                        </span>
                    </div>
                    ` : ''}
                    ${analysis.textAnalysisSummary ? `
                    <div class="result-item">
                        <span class="label">📝 텍스트 분석 요약:</span>
                        <span class="value">${analysis.textAnalysisSummary}</span>
                    </div>
                    ` : ''}
                    ${analysis.components && analysis.components.length > 0 ? `
                    <div class="result-item">
                        <span class="label">🧩 복합 제품 구성:</span>
                        <span class="value">
                            ${analysis.components.map(component => 
                                `<div class="component-item">${component.part}: <strong>${component.wasteType}</strong> (${component.disposalMethod})</div>`
                            ).join('')}
                        </span>
                    </div>
                    ` : ''}
                    ${optimization ? `
                    <div class="result-item">
                        <span class="label">⚡ 최적화:</span>
                        <span class="value">${optimization.applied ? '✅ 적용됨 (400px 초과)' : '❌ 불필요 (400px 이하)'} ${optimization.applied ? `(${optimization.originalPixels} → ${optimization.optimizedPixels}, ${Math.round(optimization.originalSize/1024)}KB → ${Math.round(optimization.optimizedSize/1024)}KB)` : `(${optimization.originalPixels})`}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${textAnalysis ? `
                <div class="logo-detection-section">
                    <h3>🔍 텍스트 분석 결과</h3>
                    <div class="logo-result">
                        <div class="result-item">
                            <span class="label">♻️ 분리수거 마크:</span>
                            <span class="value ${textAnalysis.hasRecyclingMarks ? 'recyclable' : 'general-waste'}">${textAnalysis.hasRecyclingMarks ? '✅ 발견됨' : '❌ 발견되지 않음'}</span>
                        </div>
                        ${textAnalysis.confidence > 0 ? `
                        <div class="result-item">
                            <span class="label">🎯 탐지 신뢰도:</span>
                            <span class="value">${Math.round(textAnalysis.confidence * 100)}%</span>
                        </div>
                        ` : ''}
                        ${textAnalysis.summary ? `
                        <div class="result-item">
                            <span class="label">📝 탐지 요약:</span>
                            <span class="value">${textAnalysis.summary}</span>
                        </div>
                        ` : ''}
                        ${textAnalysis.recyclingKeywords && textAnalysis.recyclingKeywords.length > 0 ? `
                        <div class="result-item">
                            <span class="label">🔤 분리수거 키워드:</span>
                            <span class="value">${textAnalysis.recyclingKeywords.join(', ')}</span>
                        </div>
                        ` : ''}
                        ${textAnalysis.complexAnalysis && textAnalysis.complexAnalysis.length > 0 ? `
                        <div class="result-item">
                            <span class="label">📋 복합 분석 결과:</span>
                            <span class="value">
                                ${textAnalysis.complexAnalysis.map(item => 
                                    `<div class="complex-item">${item.part}: <strong>${item.wasteType}</strong></div>`
                                ).join('')}
                            </span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('분석 오류:', error);
        let errorMessage = '알 수 없는 오류가 발생했습니다.';
        
        if (error.message) {
            errorMessage = error.message;
        }
        
        resultDiv.innerHTML = `
            <div class="error">
                ❌ 분석 중 오류가 발생했습니다: ${errorMessage}
            </div>
        `;
    }
}

// 쓰레기 종류에 따른 CSS 클래스 반환 함수
function getWasteTypeClass(wasteType) {
    switch(wasteType) {
        case '재활용품':
            return 'recyclable';
        case '음식물쓰레기':
            return 'food-waste';
        case '유해폐기물':
            return 'hazardous';
        case '일반쓰레기':
        default:
            return 'general-waste';
    }
}

// 파일 선택 버튼 클릭 이벤트
document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('uploadBtn');
    const imageInput = document.getElementById('imageInput');
    
    if (uploadBtn && imageInput) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault(); // 기본 동작 방지
            imageInput.click();
        });
    }
    
    // 파일 선택 시 미리보기 표시
    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                selectedFile = file;
                showPreview(file);
            }
        });
    }
}); 