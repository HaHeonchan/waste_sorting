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
        
        // 결과 표시 (새로운 응답 구조에 맞게 수정)
        const optimization = data.optimization;
        const analysisType = data.analysisType || "text_based";
        const analysisTypeText = analysisType === "text_based" ? "텍스트 기반 분석" : "이미지 직접 분석";

        resultDiv.innerHTML = `
            <div class="result-container">
                <h3>📊 분석 결과</h3>
                <div class="analysis-result">
                    <div class="result-item">
                        <span class="label">🗂️ 쓰레기 종류:</span>
                        <span class="value ${getWasteTypeClass(data.wasteType)}">${data.wasteType}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">📦 세부 분류:</span>
                        <span class="value">${data.subType}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">♻️ 재활용 마크:</span>
                        <span class="value">${data.recyclingMark}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">💡 설명:</span>
                        <span class="value">${data.description}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">🗑️ 처리 방법:</span>
                        <span class="value">${data.disposalMethod}</span>
                    </div>
                    
                    ${data.materialParts && data.materialParts.length > 0 ? `
                    <div class="material-parts-section">
                        <h4>🔍 부위별 재질 분석</h4>
                        <div class="material-parts-grid">
                            ${data.materialParts.map(part => `
                                <div class="material-part-card">
                                    <div class="part-header">
                                        <span class="part-name">${part.part}</span>
                                        <span class="material-type">${part.material}</span>
                                    </div>
                                    <div class="part-description">${part.description}</div>
                                    ${part.disposalMethod ? `
                                        <div class="part-disposal">
                                            <strong>처리 방법:</strong> ${part.disposalMethod}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="result-item">
                        <span class="label">🎯 분석 신뢰도:</span>
                        <span class="value">${Math.round(data.confidence * 100)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="label">🔍 분석 방식:</span>
                        <span class="value ${analysisType === 'text_based' ? 'text_based' : 'direct_image'}">${analysisTypeText}</span>
                    </div>
                    ${optimization ? `
                    <div class="result-item">
                        <span class="label">⚡ 최적화:</span>
                        <span class="value">${optimization.applied ? '✅ 적용됨' : '❌ 불필요'} ${optimization.applied ? `(${Math.round(optimization.originalSize/1024)}KB → ${Math.round(optimization.optimizedSize/1024)}KB)` : ''}</span>
                    </div>
                    ` : ''}
                </div>
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