/**
 * 이미지 분석 컨트롤러
 * 쓰레기 분류를 위한 이미지 업로드 및 분석 기능
 */

const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 내부 모듈 import
const { 
    TEXT_BASED_ANALYSIS_PROMPT, 
    DIRECT_IMAGE_ANALYSIS_PROMPT 
} = require('./prompts');
const { analyzeImageWithLogoDetection } = require('./logo-detector');
const { generateImageHash, getFromCache, saveToCache } = require('./cache');
const { 
    optimizeForTextAnalysis, 
    getImageInfo, 
    isImageTooLarge 
} = require('./image-optimizer');
const { 
    uploadAndStoreImage, 
    deleteImageFromCloudinary,
    getImageUrl,
    testCloudinaryConnection
} = require('./cloudinary-storage');

// ============================================================================
// OpenAI 클라이언트 초기화
// ============================================================================

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다!');
    console.error('📝 .env 파일에 OPENAI_API_KEY를 추가해주세요.');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ============================================================================
// Multer 설정 - 이미지 업로드용
// ============================================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB 제한 (OpenAI 제한 고려)
    },
    fileFilter: (req, file, cb) => {
        // 이미지 파일만 허용
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
    }
});

// ============================================================================
// 컨트롤러 메서드들
// ============================================================================

const analyzeController = {
    /**
     * 분석 페이지 렌더링
     */
    getAnalyzePage: (req, res) => {
        try {
            res.json({ message: '쓰레기 분류 시스템에 접근했습니다.' });
        } catch (error) {
            res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    },

    /**
     * 환경 변수 설정 확인 (디버깅용)
     */
    checkEnvironment: (req, res) => {
        try {
            const envCheck = {
                openai: {
                    apiKey: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
                },
                cloudinary: {
                    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '기본값 사용',
                    apiKey: process.env.CLOUDINARY_API_KEY || '기본값 사용',
                    apiSecret: process.env.CLOUDINARY_API_SECRET ? '설정됨' : '설정되지 않음'
                },
                google: {
                    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? '설정됨' : '설정되지 않음'
                }
            };
            
            res.json({
                message: '환경 변수 설정 확인',
                environment: envCheck
            });
        } catch (error) {
            res.status(500).json({ error: '환경 변수 확인 중 오류가 발생했습니다.' });
        }
    },

    /**
     * Cloudinary 연결 테스트 (디버깅용)
     */
    testCloudinary: async (req, res) => {
        try {
            const testResult = await testCloudinaryConnection();
            res.json({
                message: 'Cloudinary 연결 테스트 결과',
                result: testResult
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Cloudinary 연결 테스트 중 오류가 발생했습니다.',
                details: error.message 
            });
        }
    },

    /**
     * 이미지 업로드 및 분석 처리
     */
    uploadAndAnalyzeImage: async (req, res) => {
        console.log('🚀 이미지 분석 요청 시작:', new Date().toISOString());
        console.log('📋 요청 헤더:', req.headers);
        console.log('📁 요청 파일:', req.file);
        console.log('🔧 환경변수 확인:');
        console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음');
        console.log('  - CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('  - NODE_ENV:', process.env.NODE_ENV);
        
        try {
            // 파일 업로드 처리
            upload.single('image')(req, res, async (err) => {
                if (err) {
                    console.error('❌ 파일 업로드 오류:', err);
                    return res.status(400).json({ 
                        error: '파일 업로드 실패', 
                        details: err.message 
                    });
                }

                if (!req.file) {
                    console.error('❌ 업로드된 파일이 없습니다.');
                    return res.status(400).json({ 
                        error: '이미지 파일을 선택해주세요.' 
                    });
                }

                console.log('✅ 파일 업로드 성공:', req.file.originalname);
                console.log('📊 파일 크기:', req.file.size, 'bytes');

                try {
                    // 이미지 분석 실행
                    console.log('🔍 이미지 분석 시작...');
                    
                    // 1. 이미지 정보 확인
                    const imageInfo = await getImageInfo(req.file.path);
                    console.log('📊 이미지 정보:', imageInfo);
                    
                    // 2. 캐시 확인
                    const imageBuffer = fs.readFileSync(req.file.path);
                    const imageHash = generateImageHash(imageBuffer);
                    const cachedResult = getFromCache(imageHash);
                    
                    if (cachedResult) {
                        console.log('📋 캐시에서 결과 반환');
                        return res.json(cachedResult);
                    }
                    
                    // 3. Google Vision API를 사용한 텍스트 분석
                    console.log('🔍 Google Vision API 분석 시작...');
                    const textAnalysis = await analyzeImageWithLogoDetection(req.file.path);
                    console.log('✅ Google Vision API 분석 완료');
                    
                    // 4. 분석 방법 결정 및 실행
                    let finalAnalysis;
                    const hasRecyclingMarks = textAnalysis.hasRecyclingMarks;
                    const hasTextContent = textAnalysis.logoDetection && 
                                         (textAnalysis.logoDetection.recyclingTexts.length > 0 || 
                                          textAnalysis.logoDetection.recyclingMarks.length > 0);
                    
                    if (hasRecyclingMarks && hasTextContent) {
                        console.log('📝 텍스트 분석 결과를 GPT에게 전달하여 분석합니다.');
                        finalAnalysis = await analyzeWithTextResults(textAnalysis);
                    } else {
                        console.log('🖼️ 마크나 텍스트가 없어 이미지를 직접 분석합니다.');
                        finalAnalysis = await analyzeImageDirectly(req.file.path);
                    }
                    
                    // 5. 결과 구성
                    const result = {
                        type: finalAnalysis.analysis.wasteType,
                        detail: finalAnalysis.analysis.subType,
                        mark: finalAnalysis.analysis.recyclingMark,
                        description: finalAnalysis.analysis.description,
                        method: finalAnalysis.analysis.disposalMethod,
                        model: finalAnalysis.model,
                        token_usage: finalAnalysis.usage?.total_tokens || 0,
                        analysis_type: finalAnalysis.analysisType || "text_based"
                    };
                    
                    console.log('✅ 분석 완료:', {
                        type: result.type,
                        detail: result.detail,
                        model: result.model,
                        tokenUsage: result.token_usage
                    });
                    
                    // 6. 결과를 캐시에 저장
                    saveToCache(imageHash, result);
                    
                    // 7. 응답 전송
                    console.log('📤 응답 전송 시작...');
                    res.json(result);
                    console.log('✅ 응답 전송 완료');
                    
                } catch (analysisError) {
                    console.error('❌ 이미지 분석 오류:', analysisError);
                    res.status(500).json({ 
                        error: '이미지 분석 중 오류가 발생했습니다.',
                        details: analysisError.message 
                    });
                } finally {
                    // 임시 파일 정리
                    try {
                        if (req.file && req.file.path) {
                            fs.unlinkSync(req.file.path);
                            console.log('🗑️ 임시 파일 정리 완료');
                        }
                    } catch (cleanupError) {
                        console.warn('⚠️ 임시 파일 정리 실패:', cleanupError.message);
                    }
                }
            });
        } catch (error) {
            console.error('❌ 컨트롤러 오류:', error);
            res.status(500).json({ 
                error: '서버 오류가 발생했습니다.',
                details: error.message 
            });
        }
    },
};

// ============================================================================
// 헬퍼 함수들
// ============================================================================

/**
 * 텍스트 분석 결과를 GPT에게 전달하여 분류하는 함수
 */
async function analyzeWithTextResults(textAnalysisResults) {
    try {
        console.log('🤖 텍스트 분석 결과를 GPT에게 전달하여 분류 시작');
        
        const prompt = TEXT_BASED_ANALYSIS_PROMPT.replace(
            '{textAnalysisResults}',
            JSON.stringify(textAnalysisResults, null, 2)
        );
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300
        });

        console.log('✅ GPT 텍스트 기반 분석 완료');
        
        const analysisData = parseGPTResponse(response.choices[0].message.content);
        
        return {
            analysis: analysisData,
            model: response.model,
            usage: response.usage,
            textAnalysisSource: textAnalysisResults
        };
        
    } catch (error) {
        console.error('❌ GPT 텍스트 기반 분석 오류:', error);
        throw new Error(`텍스트 기반 분석에 실패했습니다: ${error.message}`);
    }
}

/**
 * 이미지를 직접 분석하는 함수
 */
async function analyzeImageDirectly(imagePath) {
    try {
        console.log('🤖 이미지를 직접 분석하여 분류 시작');
        
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: DIRECT_IMAGE_ANALYSIS_PROMPT },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                        }
                    ]
                }
            ],
            max_tokens: 300
        });

        console.log('✅ GPT 이미지 직접 분석 완료');
        
        const analysisData = parseGPTResponse(response.choices[0].message.content);
        
        return {
            analysis: analysisData,
            model: response.model,
            usage: response.usage,
            analysisType: "direct_image"
        };
        
    } catch (error) {
        console.error('❌ GPT 이미지 직접 분석 오류:', error);
        throw new Error(`이미지 직접 분석에 실패했습니다: ${error.message}`);
    }
}

/**
 * GPT 응답을 파싱하는 함수
 */
function parseGPTResponse(content) {
    try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        return JSON.parse(jsonString);
    } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        return {
            wasteType: "분류 실패",
            subType: "알 수 없음",
            recyclingMark: "해당없음",
            description: content,
            disposalMethod: "확인 필요",
            confidence: 0,
            analysisSummary: "GPT 분석 실패"
        };
    }
}

/**
 * 임시 파일들을 정리하는 함수
 */
function cleanupTempFiles(imagePath, optimizedImagePath) {
    // 원본 임시 파일 삭제
    if (imagePath && fs.existsSync(imagePath)) {
        try {
            fs.unlinkSync(imagePath);
            console.log('🗑️ 원본 임시 파일 삭제 완료:', imagePath);
        } catch (deleteError) {
            console.error('❌ 원본 임시 파일 삭제 실패:', deleteError);
        }
    }
    
    // 최적화된 이미지 파일 삭제 (있는 경우)
    if (optimizedImagePath && optimizedImagePath !== imagePath && 
        fs.existsSync(optimizedImagePath)) {
        try {
            fs.unlinkSync(optimizedImagePath);
            console.log('🗑️ 최적화된 임시 파일 삭제 완료:', optimizedImagePath);
        } catch (deleteError) {
            console.error('❌ 최적화된 임시 파일 삭제 실패:', deleteError);
        }
    }
}

module.exports = analyzeController; 