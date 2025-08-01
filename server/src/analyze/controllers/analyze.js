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
    UNIFIED_SINGLE_STAGE_PROMPT
} = require('./prompts');

const { 
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
        return;
    }

    // Cloudinary URL인 경우
    if (filePath.includes('cloudinary.com')) {
        try {
            const urlParts = filePath.split('/');
            const filename = urlParts[urlParts.length - 1];
            const folder = urlParts[urlParts.length - 2];
            const fullPublicId = `${folder}/${filename.split('.')[0]}`;
                        
            cloudinary.uploader.destroy(fullPublicId);
        } catch (error) {
            console.error('❌ Cloudinary 이미지 삭제 중 오류:', error.message);
        }
        return;
    }

    // 로컬 파일인 경우
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ 임시 파일 정리 완료:', filePath);
        }
    } catch (error) {
        console.error('❌ 파일 정리 실패:', error.message);
        
        // 파일이 사용 중인 경우 잠시 후 재시도
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ 지연 삭제 완료:', filePath);
                }
            } catch (retryError) {
                console.error('❌ 지연 삭제도 실패:', retryError.message);
            }
        }, 1000);
    }
}

/**
 * 임시 디렉토리 정리
 * @param {string} tempDir - 정리할 임시 디렉토리 경로
 */
function cleanupTempDirectory(tempDir) {
    try {
        if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                try {
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                        console.log('🗑️ 임시 파일 정리:', filePath);
                    }
                } catch (error) {
                    console.error('❌ 임시 파일 정리 실패:', error.message);
                }
            });
        }
    } catch (error) {
        console.error('❌ 임시 디렉토리 정리 실패:', error.message);
    }
}

/**
 * Cloudinary 이미지 업로드
 * @param {string} filePath - 업로드할 파일 경로
 * @returns {Promise<string>} 업로드된 이미지 URL
 */
async function uploadToCloudinary(filePath) {    
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
        return result.secure_url;
}

/**
 * GPT 응답 파싱
 * @param {string} content - GPT 응답 내용
 * @returns {Object} 파싱된 결과
 */
function parseGPTResponse(content) {
    try {
        console.log('🔍 GPT 응답 원본:', content);
        
        // JSON 블록 추출 시도
        let jsonString = content;
        
        // response_format이 json_object인 경우 직접 파싱 시도
        try {
            const directParse = JSON.parse(content);
            console.log('✅ 직접 JSON 파싱 성공');
            return {
                wasteType: directParse.wasteType || "분류 실패",
                subType: directParse.subType || "알 수 없음",
                recyclingMark: directParse.recyclingMark || "해당없음",
                description: directParse.description || content,
                disposalMethod: directParse.disposalMethod || "확인 필요",
                confidence: directParse.confidence || 0,
                analysisDetails: directParse.analysisDetails || null,
                materialParts: directParse.materialParts || []
            };
        } catch (directParseError) {
            console.log('🔄 직접 파싱 실패, 블록 추출 시도...');
        }
        
        // ```json ... ``` 형태 찾기
        const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            jsonString = jsonBlockMatch[1];
            console.log('📦 JSON 블록 추출됨');
        } else {
            // 일반 JSON 객체 찾기 (더 정확한 매칭)
            const jsonMatch = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
                console.log('📄 일반 JSON 객체 추출됨');
            }
        }
        
        // JSON 문자열 정리
        jsonString = jsonString.trim();
        console.log('🧹 정리된 JSON:', jsonString);
        
        // 불완전한 JSON 수정 시도
        if (jsonString.includes('"detectedLabels": [')) {
            // 배열이 불완전하게 끝나는 경우 수정
            const lastBracketIndex = jsonString.lastIndexOf(']');
            const lastBraceIndex = jsonString.lastIndexOf('}');
            
            if (lastBracketIndex > lastBraceIndex) {
                // 배열이 제대로 닫히지 않은 경우
                jsonString = jsonString.substring(0, lastBracketIndex + 1) + '}';
                console.log('🔧 배열 닫기 수정됨');
            }
        }
        
        // 중복된 중괄호 제거
        jsonString = jsonString.replace(/}\s*}/g, '}');
        
        // 불완전한 배열이나 객체 수정
        let braceCount = 0;
        let bracketCount = 0;
        let lastValidIndex = -1;
        
        for (let i = 0; i < jsonString.length; i++) {
            if (jsonString[i] === '{') braceCount++;
            else if (jsonString[i] === '}') braceCount--;
            else if (jsonString[i] === '[') bracketCount++;
            else if (jsonString[i] === ']') bracketCount--;
            
            if (braceCount === 0 && bracketCount === 0) {
                lastValidIndex = i;
            }
        }
        
        if (lastValidIndex > 0 && lastValidIndex < jsonString.length - 1) {
            jsonString = jsonString.substring(0, lastValidIndex + 1);
            console.log('🔧 불완전한 JSON 수정됨');
        }
        
        console.log('✅ 최종 JSON:', jsonString);
        
        // JSON 파싱 시도
        const parsed = JSON.parse(jsonString);
        
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
        console.error('🔍 파싱 시도한 JSON:', jsonString);
        
        // 수동으로 JSON 구조 추출 시도
        try {
            console.log('🔄 수동 파싱 시도 중...');
            
            // 더 정교한 정규식으로 JSON 필드 추출
            const wasteTypeMatch = content.match(/"wasteType"\s*:\s*"([^"]+)"/);
            const subTypeMatch = content.match(/"subType"\s*:\s*"([^"]+)"/);
            const descriptionMatch = content.match(/"description"\s*:\s*"([^"]+)"/);
            const disposalMethodMatch = content.match(/"disposalMethod"\s*:\s*"([^"]+)"/);
            const confidenceMatch = content.match(/"confidence"\s*:\s*([0-9.]+)/);
            const recyclingMarkMatch = content.match(/"recyclingMark"\s*:\s*"([^"]+)"/);
            
            // materialParts 배열 추출 시도
            const materialPartsMatch = content.match(/"materialParts"\s*:\s*\[([\s\S]*?)\]/);
            let materialParts = [];
            
            if (materialPartsMatch) {
                try {
                    // materialParts 배열을 개별 객체로 분리
                    const partsString = materialPartsMatch[1];
                    const partMatches = partsString.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
                    
                    if (partMatches) {
                        materialParts = partMatches.map(partStr => {
                            const partMatch = partStr.match(/"part"\s*:\s*"([^"]+)"/);
                            const materialMatch = partStr.match(/"material"\s*:\s*"([^"]+)"/);
                            const descMatch = partStr.match(/"description"\s*:\s*"([^"]+)"/);
                            const disposalMatch = partStr.match(/"disposalMethod"\s*:\s*"([^"]+)"/);
                            
                            return {
                                part: partMatch ? partMatch[1] : "본체",
                                material: materialMatch ? materialMatch[1] : "기타",
                                description: descMatch ? descMatch[1] : "수동 파싱",
                                disposalMethod: disposalMatch ? disposalMatch[1] : "일반쓰레기"
                            };
                        });
                    }
                } catch (partsError) {
                    console.error('❌ materialParts 파싱 실패:', partsError.message);
                }
            }
            
            if (wasteTypeMatch || subTypeMatch) {
                const result = {
                    wasteType: wasteTypeMatch ? wasteTypeMatch[1] : "분류 실패",
                    subType: subTypeMatch ? subTypeMatch[1] : "알 수 없음",
                    recyclingMark: recyclingMarkMatch ? recyclingMarkMatch[1] : "해당없음",
                    description: descriptionMatch ? descriptionMatch[1] : content,
                    disposalMethod: disposalMethodMatch ? disposalMethodMatch[1] : "확인 필요",
                    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
                    analysisDetails: null,
                    materialParts: materialParts.length > 0 ? materialParts : []
                };
                
                console.log('✅ 수동 파싱 성공:', result);
                return result;
            }
        } catch (manualParseError) {
            console.error('❌ 수동 파싱도 실패:', manualParseError.message);
        }
        
        // 마지막 시도: 키워드 기반 분류
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
    
    // Vision API 결과 로그 출력
    console.log('👁️ Vision API 분석 결과:');
    console.log('='.repeat(80));
    console.log('라벨:', visionAnalysis.labels?.map(l => l.description) || []);
    console.log('텍스트:', visionAnalysis.texts?.map(t => t.description) || []);
    console.log('재활용 마크:', visionAnalysis.recyclingMarks || []);
    console.log('='.repeat(80));
    
    // Vision API 결과를 텍스트로 정리 (오브젝트 감지 제거)
    const objects = []; // 오브젝트 감지 제거
    
    const labels = visionAnalysis.labels?.map(label => label.description) || [];
    
    const texts = visionAnalysis.texts?.map(text => text.description) || [];
    const recyclingMarks = visionAnalysis.recyclingMarks || [];
    
    // 이미지 크기 최적화
    let optimizedImageUrl = imagePath;
    
    try {
        // Cloudinary URL인 경우 크기 최적화
        if (imagePath.includes('cloudinary.com')) {
            // GPT Vision API에 최적화된 크기로 조정 (1024x1024 이하 권장)
            // f_auto: 자동 포맷 최적화, q_auto: 자동 품질 최적화, c_limit: 비율 유지
            const optimizedUrl = imagePath.replace('/upload/', '/upload/w_1024,h_1024,c_limit,q_auto,f_auto,fl_progressive/');
            optimizedImageUrl = optimizedUrl;
            console.log('🖼️ Cloudinary 이미지 크기 최적화 완료 (1024x1024):', optimizedImageUrl);
        } else {
            // 로컬 파일인 경우 Sharp를 사용하여 리사이즈
            const sharp = require('sharp');
            
            // 원본 이미지 정보 확인
            const imageInfo = await sharp(imagePath).metadata();
            console.log('📏 원본 이미지 크기:', imageInfo.width, 'x', imageInfo.height);
            
            // GPT Vision API 최적화 (1024x1024 이하, 파일 크기 최소화)
            const resizedBuffer = await sharp(imagePath)
                .resize(1024, 1024, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ 
                    quality: 80,  // 품질을 약간 낮춰서 파일 크기 최적화
                    progressive: true,
                    mozjpeg: true
                })
                .toBuffer();
            
            // 리사이즈된 이미지를 임시 파일로 저장
            const tempDir = path.join(__dirname, '../../uploads/temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const resizedPath = path.join(tempDir, `resized_${Date.now()}.jpg`);
            fs.writeFileSync(resizedPath, resizedBuffer);
            
            // 최적화된 이미지 정보 확인
            const optimizedInfo = await sharp(resizedBuffer).metadata();
            console.log('📏 최적화된 이미지 크기:', optimizedInfo.width, 'x', optimizedInfo.height);
            console.log('📦 파일 크기:', (resizedBuffer.length / 1024).toFixed(2), 'KB');
            
            optimizedImageUrl = resizedPath;
            console.log('🖼️ 로컬 이미지 크기 최적화 완료:', optimizedImageUrl);
        }
    } catch (error) {
        console.log('⚠️ 이미지 최적화 실패, 원본 사용:', error.message);
        optimizedImageUrl = imagePath;
    }
    
    // GPT Vision API를 사용한 통합 분석
    const visionPrompt = `다음은 Google Vision API로 분석된 결과입니다:

**탐지된 라벨들:**
${JSON.stringify(labels, null, 2)}

**탐지된 텍스트들:**
${JSON.stringify(texts, null, 2)}

**재활용 마크/아이콘:**
${JSON.stringify(recyclingMarks, null, 2)}

위 정보와 이미지를 종합하여 쓰레기 분류를 수행해주세요.

**중요: 반드시 완전한 JSON 형식으로 응답해주세요.**
**중요: 재활용 마크에 쉼표(,)가 있으면 반드시 각 재질을 별도의 materialParts 항목으로 만들어주세요.**
**중요: 재활용 마크가 하나의 재질만 있는 경우에는 본체만 분류하고 중복 분류하지 마세요.**
**중요: wasteType과 subType이 재질적으로 많이 다르면 subType을 우선적으로 따르세요.**
**응답 형식:**
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
}`;

    // GPT 입력 프롬프트 로그 출력
    console.log('🔍 GPT Vision 입력 프롬프트 전문:');
    console.log('='.repeat(80));
    console.log(visionPrompt);
    console.log('='.repeat(80));
    
    const unifiedResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { 
                role: "system", 
                content: "당신은 한국의 개쩌는 분리수거 전문가입니다. 이미지와 Vision API 분석 결과를 바탕으로 정확한 쓰레기 분류를 수행합니다. 재활용 마크가 있으면 반드시 라벨보다 재활용 마크를 우선적으로 고려하여 wasteType을 결정해야 합니다. wasteType과 subType이 재질적으로 많이 다르면 subType을 우선적으로 따릅니다. 재활용 마크에 여러 재질이 있으면 반드시 각각을 다른 부위(본체, 뚜껑, 라벨 등)로 분류해야 합니다. 단일 재질인 경우에는 본체만 분류하고 중복 분류하지 마세요." 
            },
            { 
                role: "user", 
                content: [
                    { type: "text", text: visionPrompt },
                    { type: "image_url", image_url: { url: optimizedImageUrl } }
                ]
            }
        ],
        max_tokens: 1800,
        temperature: 0.05,  // 더 일관된 결과를 위해 낮춤
        response_format: { type: "json_object" }
    });
    
    // GPT 응답 로그 출력
    console.log('🤖 GPT 응답 전문:');
    console.log('='.repeat(80));
    console.log(unifiedResponse.choices[0].message.content);
    console.log('='.repeat(80));
    console.log('📊 토큰 사용량:', unifiedResponse.usage?.total_tokens || 0);
    console.log('='.repeat(80));
    
    // GPT 응답 파싱 시도
    console.log('🔍 GPT 응답 파싱 시도:');
    console.log('='.repeat(80));
    const unifiedAnalysis = parseGPTResponse(unifiedResponse.choices[0].message.content);
    console.log('📋 파싱된 결과:', JSON.stringify(unifiedAnalysis, null, 2));
    console.log('='.repeat(80));
    
    // materialParts가 없거나 비어있는 경우 기본값 설정
    if (!unifiedAnalysis.materialParts || unifiedAnalysis.materialParts.length === 0) {
        unifiedAnalysis.materialParts = [
            {
                part: "본체",
                material: unifiedAnalysis.wasteType || "기타",
                description: "이미지에서 확인된 주요 재질",
                disposalMethod: unifiedAnalysis.disposalMethod || "일반쓰레기"
            }
        ];
    }
    
    const result = {
        type: unifiedAnalysis.wasteType,
        detail: unifiedAnalysis.subType,
        mark: unifiedAnalysis.recyclingMark,
        description: unifiedAnalysis.description,
        method: unifiedAnalysis.disposalMethod,
        model: unifiedResponse.model,
        token_usage: unifiedResponse.usage?.total_tokens || 0,
        analysis_type: "unified_single_stage_vision_gpt",
        confidence: unifiedAnalysis.confidence || 0.8,
        detailed_method: {
            unifiedAnalysis: unifiedAnalysis.analysisDetails || null
        },
        materialParts: unifiedAnalysis.materialParts || [],
        vision_analysis: {
            objects: 0, // 오브젝트 감지 제거
            labels: labels.length,
            texts: texts.length,
            recyclingMarks: recyclingMarks.length
        }
    };
    
    // 결과 객체 디버깅
    console.log('🔍 결과 객체 디버깅:');
    console.log('='.repeat(80));
    console.log('unifiedAnalysis.wasteType:', unifiedAnalysis.wasteType);
    console.log('unifiedAnalysis.subType:', unifiedAnalysis.subType);
    console.log('unifiedAnalysis.recyclingMark:', unifiedAnalysis.recyclingMark);
    console.log('unifiedAnalysis.description:', unifiedAnalysis.description);
    console.log('unifiedAnalysis.disposalMethod:', unifiedAnalysis.disposalMethod);
    console.log('unifiedAnalysis.confidence:', unifiedAnalysis.confidence);
    console.log('unifiedAnalysis.materialParts:', unifiedAnalysis.materialParts);
    console.log('='.repeat(80));
    
    // 최종 분석 결과 로그 출력
    console.log('✅ 최종 분석 결과:');
    console.log('='.repeat(80));
    console.log('타입:', result.type);
    console.log('세부분류:', result.detail);
    console.log('재활용마크:', result.mark);
    console.log('배출방법:', result.method);
    console.log('신뢰도:', result.confidence);
    console.log('materialParts:', result.materialParts);
    console.log('='.repeat(80));
    
    return result;
}

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
                try {
                    // Cloudinary에 업로드
                    cloudinaryUrl = await uploadToCloudinary(uploadedFile);

                    // 통합 분석 실행 (Vision API + GPT)
                    const analysisResult = await performUnifiedAnalysis(cloudinaryUrl);
                    
                    // 분석 결과에 이미지 URL 추가
                    analysisResult.imageUrl = cloudinaryUrl;
                    analysisResult.requestId = requestId; // 요청 ID 추가
                    
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
                    
                    // 임시 디렉토리 정리
                    const tempDir = path.join(__dirname, '../../uploads/temp');
                    cleanupTempDirectory(tempDir);
                    
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
            
            // 임시 디렉토리 정리
            const tempDir = path.join(__dirname, '../../uploads/temp');
            cleanupTempDirectory(tempDir);
            
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