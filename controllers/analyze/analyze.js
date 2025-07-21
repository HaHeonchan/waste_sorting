// 이미지 분석 컨트롤러
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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
        
        // 이미지 파일을 base64로 인코딩
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        console.log('📊 이미지 크기:', imageBuffer.length, 'bytes');
        
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
                            text: `이 이미지에 있는 쓰레기를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "wasteType": "일반쓰레기|재활용품|음식물쓰레기|유해폐기물",
  "subType": "세부 분류 (예: 플라스틱병, 종이, 유리병, 캔, 전자제품 등)",
  "recyclingMark": "재활용 마크 종류 (PET, PP, PE, PS, PVC, 종이, 유리, 알루미늄, 철 등) - 재활용품이 아닌 경우 '해당없음'",
  "description": "분류 이유와 처리 방법에 대한 간단한 설명",
  "disposalMethod": "올바른 처리 방법 (예: 일반쓰레기봉투, 재활용품수거함, 음식물쓰레기통, 유해폐기물수거함)"
}

반드시 유효한 JSON 형식으로만 응답해주세요.`
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
            max_tokens: 500
        });

        console.log('✅ GPT API 응답 성공');

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

        return {
            analysis: analysisData,
            model: response.model,
            usage: response.usage
        };
        
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