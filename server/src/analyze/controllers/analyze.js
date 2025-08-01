/**
 * 이미지 분석 컨트롤러
 * 쓰레기 분류를 위한 이미지 업로드 및 분석 기능
 */

const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// 내부 모듈 import
const { 
    UNIFIED_ANALYSIS_PROMPT,
    BASIC_TYPE_ANALYSIS_PROMPT,
    TEXT_BASED_MATERIAL_PROMPT
} = require('./prompts');

const { 
    analyzeImageWithLogoDetection,
    analyzeRecyclingMarksWithObjectsAndLabels,
    performComprehensiveVisionAnalysis,
    performUnifiedVisionAnalysis
} = require('./logo-detector');



// ============================================================================
// 설정 및 초기화
// ============================================================================

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 중복 요청 방지를 위한 처리 중인 요청 추적
const processingRequests = new Set();
const requestTimestamps = new Map(); // 요청 타임스탬프 추적

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempUploadDir = path.join(__dirname, '../../uploads/temp');
        if (!fs.existsSync(tempUploadDir)) {
            fs.mkdirSync(tempUploadDir, { recursive: true });
        }
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'analysis-temp-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
    }
});

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 임시 파일 정리
 * @param {string} filePath - 삭제할 파일 경로
 */
function cleanupFile(filePath) {
    if (!filePath) {
        console.log('⚠️ 파일 경로가 없어 정리 건너뜀');
        return;
    }

    // Cloudinary URL인 경우
    if (filePath.includes('cloudinary.com')) {
        try {
            const urlParts = filePath.split('/');
            const filename = urlParts[urlParts.length - 1];
            const folder = urlParts[urlParts.length - 2];
            const fullPublicId = `${folder}/${filename.split('.')[0]}`;
            
            console.log('🗑️ Cloudinary 이미지 삭제 시작:', fullPublicId);
            
            cloudinary.uploader.destroy(fullPublicId)
                .then(() => console.log('🗑️ Cloudinary 이미지 삭제 완료'))
                .catch(error => console.error('🔥 Cloudinary 이미지 삭제 실패:', error.message));
        } catch (error) {
            console.error('❌ Cloudinary 이미지 삭제 중 오류:', error.message);
        }
        return;
    }

    // 로컬 파일인 경우
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ 임시 파일 정리 완료:', path.basename(filePath));
        } else {
            console.log('⚠️ 파일이 이미 존재하지 않음:', path.basename(filePath));
        }
    } catch (error) {
        console.error('❌ 파일 정리 실패:', error.message);
        
        // 파일이 사용 중인 경우 잠시 후 재시도
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ 지연 삭제 성공:', path.basename(filePath));
                }
            } catch (retryError) {
                console.error('❌ 지연 삭제도 실패:', retryError.message);
            }
        }, 1000);
    }
}

/**
 * Cloudinary 이미지 업로드
 * @param {string} filePath - 업로드할 파일 경로
 * @returns {Promise<string>} 업로드된 이미지 URL
 */
async function uploadToCloudinary(filePath) {
    console.log('📸 Cloudinary 업로드 시작:', path.basename(filePath));
    
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'waste-sorting/analysis-temp',
        resource_type: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
        ]
    });
    
    console.log('✅ Cloudinary 업로드 완료:', result.secure_url);
    return result.secure_url;
}

/**
 * GPT 응답 파싱
 * @param {string} content - GPT 응답 내용
 * @returns {Object} 파싱된 결과
 */
function parseGPTResponse(content) {
    try {
        console.log('🔍 JSON 파싱 시작:', content.substring(0, 200) + '...');
        
        // JSON 블록 추출 시도
        let jsonString = content;
        
        // ```json ... ``` 형태 찾기
        const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            jsonString = jsonBlockMatch[1];
            console.log('✅ JSON 블록 추출 성공');
        } else {
            // 일반 JSON 객체 찾기 (더 정확한 매칭)
            const jsonMatch = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
                console.log('✅ JSON 객체 추출 성공');
            }
        }
        
        // JSON 문자열 정리
        jsonString = jsonString.trim();
        
        // 불완전한 JSON 수정 시도
        if (jsonString.includes('"detectedLabels": [')) {
            // 배열이 불완전하게 끝나는 경우 수정
            const lastBracketIndex = jsonString.lastIndexOf(']');
            const lastBraceIndex = jsonString.lastIndexOf('}');
            
            if (lastBracketIndex > lastBraceIndex) {
                // 배열이 제대로 닫히지 않은 경우
                jsonString = jsonString.substring(0, lastBracketIndex + 1) + '}';
                console.log('🔧 불완전한 배열 수정');
            }
        }
        
        // 중복된 중괄호 제거
        jsonString = jsonString.replace(/}\s*}/g, '}');
        
        console.log('📄 파싱할 JSON:', jsonString.substring(0, 300) + '...');
        
        // JSON 파싱 시도
        const parsed = JSON.parse(jsonString);
        console.log('✅ JSON 파싱 성공:', parsed);
        
        // 필수 필드 검증 및 기본값 설정
        return {
            wasteType: parsed.wasteType || "분류 실패",
            subType: parsed.subType || "알 수 없음",
            recyclingMark: parsed.recyclingMark || "해당없음",
            description: parsed.description || content,
            disposalMethod: parsed.disposalMethod || "확인 필요",
            confidence: parsed.confidence || 0,
            analysisDetails: parsed.analysisDetails || null,
            materialParts: parsed.materialParts || []
        };
        
    } catch (parseError) {
        console.error('❌ JSON 파싱 오류:', parseError.message);
        console.error('📄 원본 내용:', content);
        
        // 수동으로 JSON 구조 추출 시도
        try {
            console.log('🔧 수동 JSON 추출 시도');
            const wasteTypeMatch = content.match(/"wasteType":\s*"([^"]+)"/);
            const subTypeMatch = content.match(/"subType":\s*"([^"]+)"/);
            const descriptionMatch = content.match(/"description":\s*"([^"]+)"/);
            const disposalMethodMatch = content.match(/"disposalMethod":\s*"([^"]+)"/);
            const confidenceMatch = content.match(/"confidence":\s*([0-9.]+)/);
            const recyclingMarkMatch = content.match(/"recyclingMark":\s*"([^"]+)"/);
            
            if (wasteTypeMatch || subTypeMatch) {
                const result = {
                    wasteType: wasteTypeMatch ? wasteTypeMatch[1] : "분류 실패",
                    subType: subTypeMatch ? subTypeMatch[1] : "알 수 없음",
                    recyclingMark: recyclingMarkMatch ? recyclingMarkMatch[1] : "해당없음",
                    description: descriptionMatch ? descriptionMatch[1] : content,
                    disposalMethod: disposalMethodMatch ? disposalMethodMatch[1] : "확인 필요",
                    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
                    analysisDetails: null,
                    materialParts: []
                };
                console.log('✅ 수동 파싱 성공:', result);
                return result;
            }
        } catch (manualParseError) {
            console.error('❌ 수동 파싱도 실패:', manualParseError.message);
        }
        
        // 마지막 시도: 키워드 기반 분류
        console.log('🔍 키워드 기반 분류 시도');
        const lowerContent = content.toLowerCase();
        
        let wasteType = "분류 실패";
        let subType = "알 수 없음";
        
        // 키워드 기반 분류
        if (lowerContent.includes('캔') || lowerContent.includes('can') || lowerContent.includes('aluminum')) {
            wasteType = "캔류";
            subType = "음료수 캔";
        } else if (lowerContent.includes('플라스틱') || lowerContent.includes('plastic') || lowerContent.includes('bottle')) {
            wasteType = "플라스틱";
            subType = "음료수병";
        } else if (lowerContent.includes('종이') || lowerContent.includes('paper') || lowerContent.includes('cardboard')) {
            wasteType = "종이";
            subType = "종이류";
        } else if (lowerContent.includes('유리') || lowerContent.includes('glass')) {
            wasteType = "유리";
            subType = "유리병";
        }
        
        return {
            wasteType: wasteType,
            subType: subType,
            recyclingMark: "해당없음",
            description: content,
            disposalMethod: "확인 필요",
            confidence: 0,
            analysisDetails: null,
            materialParts: []
        };
    }
}

// ============================================================================
// 분석 함수들
// ============================================================================







/**
 * 통합 분석 수행 (Vision API + GPT)
 * @param {string} imagePath - 이미지 경로
 * @returns {Promise<Object>} 분석 결과
 */
async function performUnifiedAnalysis(imagePath) {
    // Vision API로 통합 분석
    const visionAnalysis = await performUnifiedVisionAnalysis(imagePath);
    
    // Vision API 결과를 텍스트로 정리
    const objects = visionAnalysis.objects?.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        description: `${obj.name} (신뢰도: ${Math.round(obj.score * 100)}%)`
    })) || [];
    
    const labels = visionAnalysis.labels?.map(label => ({
        name: label.description,
        confidence: label.score,
        description: `${label.description} (신뢰도: ${Math.round(label.score * 100)}%)`
    })) || [];
    
    const texts = visionAnalysis.texts?.map(text => text.description) || [];
    const recyclingMarks = visionAnalysis.recyclingMarks || [];
    
    // 1단계: 객체/라벨 인식으로 기본 타입 결정
    const basicTypePrompt = BASIC_TYPE_ANALYSIS_PROMPT
        .replace('{objects}', JSON.stringify(objects, null, 2))
        .replace('{labels}', JSON.stringify(labels, null, 2));
    
    console.log('🔍 1단계 GPT 분석 시작...');
    console.log('📝 프롬프트:', basicTypePrompt.substring(0, 200) + '...');
    
    const basicTypeResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: basicTypePrompt }],
        max_tokens: 500,
        temperature: 0.3
    });
    
    console.log('📄 GPT 응답:', basicTypeResponse.choices[0].message.content);
    
    const basicAnalysis = parseGPTResponse(basicTypeResponse.choices[0].message.content);
    
    // 2단계: 텍스트 분석으로 재활용 마크와 materialParts 결정
    const textAnalysisPrompt = TEXT_BASED_MATERIAL_PROMPT
        .replace('{texts}', JSON.stringify(texts, null, 2))
        .replace('{recyclingMarks}', JSON.stringify(recyclingMarks, null, 2))
        .replace('{basicType}', basicAnalysis.wasteType || '기타')
        .replace('{basicSubType}', basicAnalysis.subType || '기타');
    
    console.log('🔍 2단계 GPT 분석 시작...');
    console.log('📝 프롬프트:', textAnalysisPrompt.substring(0, 200) + '...');
    
    const textAnalysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: textAnalysisPrompt }],
        max_tokens: 600,
        temperature: 0.3
    });
    
    console.log('📄 GPT 응답:', textAnalysisResponse.choices[0].message.content);
    
    const textAnalysis = parseGPTResponse(textAnalysisResponse.choices[0].message.content);
    
    // materialParts가 없거나 비어있는 경우 기본값 설정
    if (!textAnalysis.materialParts || textAnalysis.materialParts.length === 0) {
        textAnalysis.materialParts = [
            {
                part: "본체",
                material: basicAnalysis.wasteType || "기타",
                description: "이미지에서 확인된 주요 재질",
                disposalMethod: basicAnalysis.disposalMethod || "일반쓰레기"
            }
        ];
    } else {
        // materialParts의 material 필드가 명확한 재질 정보가 아닌 경우 객체 타입으로 대체
        textAnalysis.materialParts = textAnalysis.materialParts.map(part => {
            const material = part.material || '';
            const isSpecificMaterial = /^(PET|PP|PE|HDPE|LDPE|PS|PVC|알루미늄|스테인리스|철|구리|종이|유리|플라스틱)$/i.test(material);
            
            if (!isSpecificMaterial && material !== '기타') {
                return {
                    ...part,
                    material: basicAnalysis.subType || basicAnalysis.wasteType || "기타",
                    description: `${part.description || ''} (텍스트에서 명확한 재질 정보가 없어 객체 타입으로 표시)`
                };
            }
            return part;
        });
    }
    
    console.log('✅ 분석 완료:', {
        type: basicAnalysis.wasteType,
        detail: basicAnalysis.subType,
        materialParts: textAnalysis.materialParts?.length || 0
    });
    
    return {
        type: basicAnalysis.wasteType,
        detail: basicAnalysis.subType, // 객체 타입 (텍스트 분석과 무관)
        mark: textAnalysis.recyclingMark,
        description: basicAnalysis.description,
        method: basicAnalysis.disposalMethod,
        model: `${basicTypeResponse.model} + ${textAnalysisResponse.model}`,
        token_usage: (basicTypeResponse.usage?.total_tokens || 0) + (textAnalysisResponse.usage?.total_tokens || 0),
        analysis_type: "two_stage_vision_gpt",
        confidence: basicAnalysis.confidence || 0.8,
        detailed_method: {
            basicAnalysis: basicAnalysis.analysisDetails || null,
            textAnalysis: textAnalysis.analysisDetails || null
        },
        materialParts: textAnalysis.materialParts || [],
        vision_analysis: {
            objects: objects.length,
            labels: labels.length,
            texts: texts.length,
            recyclingMarks: recyclingMarks.length
        }
    };
}

// ============================================================================
// 매칭 시스템 함수들
// ============================================================================



// ============================================================================
// 메인 분석 함수들
// ============================================================================



// ============================================================================
// 컨트롤러 객체
// ============================================================================

const analyzeController = {
    /**
     * 분석 페이지 렌더링
     */
    renderAnalyzePage: (req, res) => {
        res.render('analyze/waste-sorting');
    },

    /**
     * 이미지 업로드 및 분석 처리 (통합 분석 사용)
     */
    uploadAndAnalyzeImage: async (req, res) => {
        // 중복 요청 방지를 위한 요청 ID 생성
        const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 최근 요청 확인 (1초 내 동일한 요청 차단)
        const now = Date.now();
        const recentRequests = Array.from(requestTimestamps.entries())
            .filter(([id, timestamp]) => now - timestamp < 1000)
            .map(([id]) => id);
        
        if (recentRequests.length > 0) {
            return res.status(429).json({ 
                error: '최근에 동일한 요청이 처리되었습니다. 잠시 후 다시 시도해주세요.',
                requestId: requestId
            });
        }
        
        // 이미 처리 중인 요청인지 확인
        if (processingRequests.has(requestId)) {
            return res.status(429).json({ 
                error: '이미 처리 중인 요청입니다. 잠시 후 다시 시도해주세요.',
                requestId: requestId
            });
        }
        
        // 처리 중인 요청으로 등록
        processingRequests.add(requestId);
        requestTimestamps.set(requestId, now);
        
        let uploadedFile = null;
        let cloudinaryUrl = '';
        
        try {
            upload.single('image')(req, res, async (err) => {
                if (err) {
                    console.error(`❌ 파일 업로드 실패 [ID: ${requestId}]:`, err.message);
                    processingRequests.delete(requestId); // 처리 완료 표시
                    return res.status(400).json({ error: '파일 업로드 실패', details: err.message });
                }

                if (!req.file) {
                    console.error(`❌ 파일이 없음 [ID: ${requestId}]`);
                    processingRequests.delete(requestId); // 처리 완료 표시
                    return res.status(400).json({ error: '이미지 파일을 선택해주세요.' });
                }

                uploadedFile = req.file.path;
                console.log(`📁 임시 파일 저장됨 [ID: ${requestId}]:`, path.basename(uploadedFile));

                try {
                    // Cloudinary에 업로드
                    cloudinaryUrl = await uploadToCloudinary(uploadedFile);
                    console.log(`☁️ Cloudinary 업로드 완료 [ID: ${requestId}]:`, cloudinaryUrl);

                    // 통합 분석 실행 (Vision API + GPT)
                    const analysisResult = await performUnifiedAnalysis(cloudinaryUrl);
                    
                    // 분석 결과에 이미지 URL 추가
                    analysisResult.imageUrl = cloudinaryUrl;
                    analysisResult.requestId = requestId; // 요청 ID 추가
                    
                    console.log(`✅ 분석 완료 [ID: ${requestId}]:`, {
                        type: analysisResult.type,
                        method: analysisResult.method,
                        confidence: analysisResult.confidence
                    });
                    
                    res.json(analysisResult);
                    
                } catch (analysisError) {
                    console.error(`❌ 통합 분석 실패 [ID: ${requestId}]:`, analysisError.message);
                    res.status(500).json({ 
                        error: '이미지 분석 중 오류가 발생했습니다.',
                        details: analysisError.message,
                        requestId: requestId
                    });
                } finally {
                    // 임시 파일 정리 (성공/실패 관계없이)
                    cleanupFile(uploadedFile);
                    processingRequests.delete(requestId); // 처리 완료 표시
                    requestTimestamps.delete(requestId); // 타임스탬프 정리
                }
            });
        } catch (error) {
            console.error(`❌ 분석 오류:`, error.message);
            // 업로드된 파일이 있으면 정리
            if (uploadedFile) {
                cleanupFile(uploadedFile);
            }
            processingRequests.delete(requestId); // 처리 완료 표시
            requestTimestamps.delete(requestId); // 타임스탬프 정리
            res.status(500).json({ 
                error: '서버 오류가 발생했습니다.', 
                details: error.message,
                requestId: requestId
            });
        }
    },


};

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = analyzeController; 