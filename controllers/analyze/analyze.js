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
     * 이미지 업로드 및 분석
     */
    uploadAndAnalyzeImage: [
        upload.single('image'),
        async (req, res) => {
            let imagePath = null;
            let optimizedImagePath = null;
            let cloudinaryResult = null;
            
            try {
                // 1. 파일 검증
                if (!req.file) {
                    return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
                }

                imagePath = req.file.path;
                console.log('📁 업로드된 이미지 경로:', imagePath);
                
                // 2. 이미지 정보 확인
                const imageInfo = await getImageInfo(imagePath);
                console.log('📊 원본 이미지 정보:', imageInfo);
                
                // 3. 캐시 확인
                const imageBuffer = fs.readFileSync(imagePath);
                const imageHash = generateImageHash(imageBuffer);
                const cachedResult = getFromCache(imageHash);
                
                if (cachedResult) {
                    console.log('📋 캐시에서 결과 반환');
                    return res.json(cachedResult);
                }
                
                // 4. 이미지 최적화 (필요한 경우)
                let optimizationApplied = false;
                let imageToUpload = imagePath;
                
                if (await isImageTooLarge(imagePath)) {
                    console.log('📦 이미지 최적화 중...');
                    optimizedImagePath = await optimizeForTextAnalysis(imagePath);
                    console.log('✅ 이미지 최적화 완료:', optimizedImagePath);
                    optimizationApplied = true;
                    imageToUpload = optimizedImagePath; // 최적화된 이미지를 업로드용으로 사용
                    
                    const optimizedInfo = await getImageInfo(optimizedImagePath);
                    console.log('📊 최적화된 이미지 정보:', optimizedInfo);
                } else {
                    console.log('✅ 이미지 최적화 생략');
                    optimizedImagePath = imagePath;
                }
                
                // 5. Cloudinary에 최적화된 이미지 업로드
                console.log('☁️ Cloudinary에 최적화된 이미지 업로드 중...');
                console.log('📁 업로드할 이미지 경로:', imageToUpload);
                console.log('📊 이미지 파일 존재 확인:', fs.existsSync(imageToUpload));
                
                try {
                    cloudinaryResult = await uploadAndStoreImage(imageToUpload, {
                        folder: 'waste-sorting',
                        tags: ['waste-analysis'],
                        optimization: true, // Cloudinary 최적화 활성화
                        transformation: {
                            // 추가 최적화 옵션
                            quality: 'auto:good',
                            fetch_format: 'auto',
                            strip: true
                        }
                    });
                    
                    console.log('📤 Cloudinary 업로드 결과:', cloudinaryResult);
                    
                    if (!cloudinaryResult.success) {
                        console.error('❌ Cloudinary 업로드 실패:', cloudinaryResult.error);
                        return res.status(500).json({ 
                            error: '이미지 업로드에 실패했습니다.',
                            details: cloudinaryResult.error 
                        });
                    }
                    
                    console.log('✅ Cloudinary 업로드 완료:', {
                        cloudinaryId: cloudinaryResult.cloudinaryId,
                        url: cloudinaryResult.url,
                        optimizationApplied: optimizationApplied,
                        cloudinaryOptimization: cloudinaryResult.metadata.optimization
                    });
                    
                } catch (uploadError) {
                    console.error('❌ Cloudinary 업로드 중 예외 발생:', uploadError);
                    return res.status(500).json({ 
                        error: '이미지 업로드 중 오류가 발생했습니다.',
                        details: uploadError.message 
                    });
                }
                
                // 6. Google Vision API를 사용한 텍스트 분석 (최적화된 이미지 사용)
                const textAnalysis = await analyzeImageWithLogoDetection(optimizedImagePath);
                
                // 7. 분석 방법 결정 및 실행
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
                    finalAnalysis = await analyzeImageDirectly(optimizedImagePath);
                }
                
                // 8. API 사용량 통합
                const apiUsage = {
                    googleVision: textAnalysis.usage || null,
                    openAI: finalAnalysis.usage || null,
                    analysisType: finalAnalysis.analysisType || "text_based",
                    total: {
                        estimatedTokens: (textAnalysis.usage?.estimatedTokens || 0) + 
                                       (finalAnalysis.usage?.total_tokens || 0),
                        imageSize: textAnalysis.usage?.imageSize || 0,
                        textRegions: textAnalysis.usage?.textRegions || 0
                    }
                };
                
                console.log('📊 통합 API 사용량:', apiUsage);
                
                // 9. 결과 구성
                const result = {
                    message: '이미지 분석 완료',
                    wasteType: finalAnalysis.analysis.wasteType,
                    subType: finalAnalysis.analysis.subType,
                    recyclingMark: finalAnalysis.analysis.recyclingMark,
                    description: finalAnalysis.analysis.description,
                    disposalMethod: finalAnalysis.analysis.disposalMethod,
                    confidence: finalAnalysis.analysis.confidence,
                    analysisType: finalAnalysis.analysisType || "text_based",
                    optimization: {
                        applied: optimizationApplied,
                        originalSize: imageInfo?.size,
                        optimizedSize: optimizationApplied ? 
                            (await getImageInfo(optimizedImagePath))?.size : imageInfo?.size,
                        cloudinaryOptimization: cloudinaryResult.metadata.optimization
                    },
                    // Cloudinary 정보 추가
                    cloudinary: {
                        id: cloudinaryResult.cloudinaryId,
                        url: cloudinaryResult.url,
                        optimizedUrl: getImageUrl(cloudinaryResult.cloudinaryId, {
                            width: 800,
                            height: 800,
                            quality: 'auto:good'
                        }),
                        metadata: {
                            width: cloudinaryResult.metadata.width,
                            height: cloudinaryResult.metadata.height,
                            size: cloudinaryResult.metadata.size,
                            format: cloudinaryResult.metadata.format
                        }
                    }
                };
                
                // 10. 결과를 캐시에 저장
                saveToCache(imageHash, result);
                
                res.json(result);
                
            } catch (error) {
                console.error('❌ 이미지 분석 오류:', error);
                res.status(500).json({ 
                    error: '이미지 분석 중 오류가 발생했습니다.',
                    details: error.message 
                });
            } finally {
                // 11. 임시 파일 정리
                cleanupTempFiles(imagePath, optimizedImagePath);
                
                // 12. Cloudinary 업로드 실패 시 이미지 삭제 (선택사항)
                if (cloudinaryResult && !cloudinaryResult.success && cloudinaryResult.cloudinaryId) {
                    try {
                        await deleteImageFromCloudinary(cloudinaryResult.cloudinaryId);
                        console.log('🗑️ Cloudinary 업로드 실패로 인한 이미지 삭제 완료');
                    } catch (deleteError) {
                        console.error('❌ Cloudinary 이미지 삭제 실패:', deleteError);
                    }
                }
            }
        }
    ]
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