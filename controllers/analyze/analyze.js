// 이미지 분석 컨트롤러
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { WASTE_ANALYSIS_PROMPT } = require('./prompts');
const { optimizeImage, optimizeForTextAnalysis, getImageInfo, isImageTooLarge } = require('./image-optimizer');
const { generateImageHash, getFromCache, saveToCache } = require('./cache');

// OpenAI 클라이언트 초기화
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다!');
    console.error('📝 .env 파일에 OPENAI_API_KEY=sk-your-actual-api-key를 추가해주세요.');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Multer 설정 - 이미지 업로드용
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB로 제한 (OpenAI 제한 고려)
    },
    fileFilter: function (req, file, cb) {
        // 이미지 파일만 허용
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
    }
});

const analyzeController = {
    // 분석 페이지 렌더링
    getAnalyzePage: (req, res) => {
        try {
            res.json({ message: '쓰레기 분류 시스템에 접근했습니다.' });
        } catch (error) {
            res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    },

    // 이미지 업로드 및 분석
    uploadAndAnalyzeImage: [
        upload.single('image'),
        async (req, res) => {
            let imagePath = null;
            try {
                if (!req.file) {
                    return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
                }

                imagePath = req.file.path;
                console.log('업로드된 이미지 경로:', imagePath);
                
                // OpenAI Vision API를 사용하여 이미지 분석
                const analysis = await analyzeImageWithGPT(imagePath);
                
                res.json({
                    message: '이미지 분석 완료',
                    analysis: analysis
                });
                
            } catch (error) {
                console.error('이미지 분석 오류:', error);
                res.status(500).json({ 
                    error: '이미지 분석 중 오류가 발생했습니다.',
                    details: error.message 
                });
            } finally {
                // 분석 완료 후 임시 파일 삭제
                if (imagePath && fs.existsSync(imagePath)) {
                    try {
                        fs.unlinkSync(imagePath);
                        console.log('임시 파일 삭제 완료:', imagePath);
                    } catch (deleteError) {
                        console.error('임시 파일 삭제 실패:', deleteError);
                    }
                }
            }
        }
    ]
};

// GPT Vision API를 사용한 이미지 분석 함수
async function analyzeImageWithGPT(imagePath) {
    try {
        // API 키 확인
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API 키가 설정되지 않았습니다.');
        }

        console.log('🔍 이미지 분석 시작:', imagePath);
        
        // 이미지 정보 확인
        const imageInfo = await getImageInfo(imagePath);
        console.log('📊 원본 이미지 정보:', imageInfo);
        
        // 픽셀 크기 확인
        const maxDimension = Math.max(imageInfo.width, imageInfo.height);
        console.log(`📏 최대 픽셀 크기: ${maxDimension}px (${imageInfo.width}x${imageInfo.height})`);
        console.log(`🎯 최적화 기준: 400px 초과 시 최적화 적용`);
        
        // 이미지 최적화 (필요한 경우)
        let optimizedImagePath = imagePath;
        let optimizationApplied = false;
        
        if (await isImageTooLarge(imagePath)) {
            console.log('📦 이미지 최적화 중... (400x400 픽셀 초과)');
            optimizedImagePath = await optimizeForTextAnalysis(imagePath);
            console.log('✅ 이미지 최적화 완료:', optimizedImagePath);
            optimizationApplied = true;
            
            // 최적화된 이미지 정보 확인
            const optimizedInfo = await getImageInfo(optimizedImagePath);
            console.log('📊 최적화된 이미지 정보:', optimizedInfo);
        } else {
            console.log('✅ 이미지 픽셀이 400x400 이하여서 최적화 생략');
        }
        
        // 이미지 파일을 base64로 인코딩
        const imageBuffer = fs.readFileSync(optimizedImagePath);
        const base64Image = imageBuffer.toString('base64');
        
        console.log('📊 이미지 크기:', imageBuffer.length, 'bytes');
        
        // 정확한 토큰 계산 (Vision API 기준)
        const imageTokens = Math.ceil(imageBuffer.length / 4 * 1.37); // Base64 토큰
        const promptTokens = WASTE_ANALYSIS_PROMPT.length / 4; // 프롬프트 토큰
        const totalInputTokens = imageTokens + promptTokens;
        
        console.log('💰 토큰 사용량 분석:');
        console.log('   - 이미지 토큰:', imageTokens);
        console.log('   - 프롬프트 토큰:', Math.ceil(promptTokens));
        console.log('   - 총 입력 토큰:', Math.ceil(totalInputTokens));
        console.log('   - 최적화 적용:', optimizationApplied ? '✅ 예' : '❌ 아니오');
        
        // 캐시 확인
        const imageHash = generateImageHash(imageBuffer);
        const cachedResult = getFromCache(imageHash);
        if (cachedResult) {
            return cachedResult;
        }
        
        // 파일 확장자 확인
        const fileExtension = path.extname(imagePath).toLowerCase();
        let mimeType = 'image/jpeg'; // 기본값
        
        if (fileExtension === '.png') {
            mimeType = 'image/png';
        } else if (fileExtension === '.gif') {
            mimeType = 'image/gif';
        } else if (fileExtension === '.webp') {
            mimeType = 'image/webp';
        }

        console.log('📁 파일 형식:', mimeType);

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: WASTE_ANALYSIS_PROMPT
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 200
        });

        console.log('✅ GPT API 응답 성공');
        console.log('📊 실제 토큰 사용량:', response.usage);

        // JSON 응답 파싱
        let analysisData;
        try {
            const content = response.choices[0].message.content;
            // JSON 부분만 추출 (```json과 ``` 사이의 내용)
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
            analysisData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            // 파싱 실패 시 기본 구조로 변환
            analysisData = {
                wasteType: "분류 실패",
                subType: "알 수 없음",
                recyclingMark: "해당없음",
                description: response.choices[0].message.content,
                disposalMethod: "확인 필요"
            };
        }

        const result = {
            analysis: analysisData,
            model: response.model,
            usage: response.usage,
            optimization: {
                applied: optimizationApplied,
                originalSize: imageInfo?.size,
                optimizedSize: optimizationApplied ? (await getImageInfo(optimizedImagePath))?.size : imageInfo?.size,
                originalPixels: `${imageInfo?.width}x${imageInfo?.height}`,
                optimizedPixels: optimizationApplied ? `${(await getImageInfo(optimizedImagePath))?.width}x${(await getImageInfo(optimizedImagePath))?.height}` : `${imageInfo?.width}x${imageInfo?.height}`
            }
        };
        
        // 결과를 캐시에 저장
        saveToCache(imageHash, result);
        
        return result;
        
    } catch (error) {
        console.error('❌ GPT API 오류:', error);
        
        if (error.response) {
            console.error('📋 응답 상태:', error.response.status);
            console.error('📋 응답 데이터:', error.response.data);
        }
        
        if (error.code) {
            console.error('🔢 오류 코드:', error.code);
        }
        
        if (error.message) {
            console.error('💬 오류 메시지:', error.message);
        }
        
        throw new Error(`이미지 분석에 실패했습니다: ${error.message}`);
    }
}

module.exports = analyzeController; 