/**
 * 이미지 분석 컨트롤러 - 최적화 버전
 * 쓰레기 분류를 위한 이미지 업로드 및 분석 기능
 */

const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 내부 모듈 import
const { 
    TEXT_BASED_ANALYSIS_PROMPT, 
    COMPREHENSIVE_ANALYSIS_PROMPT,
    DIRECT_IMAGE_ANALYSIS_PROMPT,
    OBJECT_BASED_ANALYSIS_PROMPT,
    LABEL_BASED_ANALYSIS_PROMPT
} = require('./prompts');
const { 
    analyzeImageWithLogoDetection,
    analyzeRecyclingMarksWithObjectsAndLabels,
    performComprehensiveVisionAnalysis
} = require('./logo-detector');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Multer 설정
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
});

// 컨트롤러 객체
const analyzeController = {
    // 분석 페이지 렌더링
    renderAnalyzePage: (req, res) => {
        res.render('analyze/waste-sorting');
    },

    // 이미지 업로드 및 분석 처리
    uploadAndAnalyzeImage: async (req, res) => {
        console.log('🚀 이미지 분석 요청 시작');
        
        try {
            upload.single('image')(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ error: '파일 업로드 실패', details: err.message });
                }

                if (!req.file) {
                    return res.status(400).json({ error: '이미지 파일을 선택해주세요.' });
                }

                try {
                    // 분석 실행
                    const result = await performAnalysis(req.file.path);
                    
                    res.json(result);
                    
                } catch (analysisError) {
                    res.status(500).json({ 
                        error: '이미지 분석 중 오류가 발생했습니다.',
                        details: analysisError.message 
                    });
                } finally {
                    // 임시 파일 정리
                    cleanupFile(req.file.path);
                }
            });
        } catch (error) {
            res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
        }
    },

    // 개선된 이미지 업로드 및 분석 처리 (객체/라벨 포함)
    uploadAndAnalyzeImageComprehensive: async (req, res) => {
        console.log('🚀 개선된 이미지 분석 요청 시작 (객체/라벨 포함)');
        
        try {
            upload.single('image')(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ error: '파일 업로드 실패', details: err.message });
                }

                if (!req.file) {
                    return res.status(400).json({ error: '이미지 파일을 선택해주세요.' });
                }

                try {
                    // 개선된 분석 실행
                    const result = await performComprehensiveAnalysis(req.file.path);
                    
                    res.json(result);
                    
                } catch (analysisError) {
                    res.status(500).json({ 
                        error: '이미지 분석 중 오류가 발생했습니다.',
                        details: analysisError.message 
                    });
                } finally {
                    // 임시 파일 정리
                    cleanupFile(req.file.path);
                }
            });
        } catch (error) {
            res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
        }
    }
};

// 기존 분석 수행 함수
async function performAnalysis(imagePath) {
    console.log('🔍 이미지 분석 시작...');
    
    // Google Vision API로 텍스트 분석
    const textAnalysis = await analyzeImageWithLogoDetection(imagePath);
    
    // 분석 방법 결정 및 실행
    const hasRecyclingContent = textAnalysis.hasRecyclingMarks && 
                               textAnalysis.logoDetection && 
                               (textAnalysis.logoDetection.recyclingTexts.length > 0 || 
                                textAnalysis.logoDetection.recyclingMarks.length > 0);
    
    let finalAnalysis;
    if (hasRecyclingContent) {
        console.log('📝 텍스트 기반 분석 실행');
        finalAnalysis = await analyzeWithTextResults(textAnalysis);
    } else {
        console.log('🖼️ 이미지 직접 분석 실행');
        finalAnalysis = await analyzeImageDirectly(imagePath);
    }
    
    return {
        type: finalAnalysis.analysis.wasteType,
        detail: finalAnalysis.analysis.subType,
        mark: finalAnalysis.analysis.recyclingMark,
        description: finalAnalysis.analysis.description,
        method: finalAnalysis.analysis.disposalMethod,
        model: finalAnalysis.model,
        token_usage: finalAnalysis.usage?.total_tokens || 0,
        analysis_type: finalAnalysis.analysisType || "text_based"
    };
}

// 개선된 분석 수행 함수 (객체/라벨 포함)
async function performComprehensiveAnalysis(imagePath) {
    console.log('🔍 개선된 이미지 분석 시작 (객체/라벨 포함)...');
    
    // 통합 Vision API 분석 실행
    const comprehensiveAnalysis = await analyzeRecyclingMarksWithObjectsAndLabels(imagePath);
    
    // 분석 방법 결정 및 실행
    const hasRecyclingContent = comprehensiveAnalysis.recyclingMarks.length > 0 ||
                               comprehensiveAnalysis.recyclingObjects?.length > 0 ||
                               comprehensiveAnalysis.recyclingLabels?.length > 0;
    
    let finalAnalysis;
    if (hasRecyclingContent) {
        console.log('📝 통합 분석 실행 (텍스트 + 객체 + 라벨)');
        finalAnalysis = await analyzeWithComprehensiveResults(comprehensiveAnalysis);
    } else {
        console.log('🖼️ 이미지 직접 분석 실행');
        finalAnalysis = await analyzeImageDirectly(imagePath);
    }
    
    return {
        type: finalAnalysis.analysis.wasteType,
        detail: finalAnalysis.analysis.subType,
        mark: finalAnalysis.analysis.recyclingMark,
        description: finalAnalysis.analysis.description,
        method: finalAnalysis.analysis.disposalMethod,
        model: finalAnalysis.model,
        token_usage: finalAnalysis.usage?.total_tokens || 0,
        analysis_type: finalAnalysis.analysisType || "comprehensive",
        confidence: comprehensiveAnalysis.confidence || 0,
        analysis_details: finalAnalysis.analysis.analysisDetails || null
    };
}

// 텍스트 기반 분석
async function analyzeWithTextResults(textAnalysisResults) {
    const prompt = TEXT_BASED_ANALYSIS_PROMPT.replace(
        '{textAnalysisResults}',
        JSON.stringify(textAnalysisResults, null, 2)
    );
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300
    });

    return {
        analysis: parseGPTResponse(response.choices[0].message.content),
        model: response.model,
        usage: response.usage,
        analysisType: "text_based"
    };
}

// 통합 분석 (텍스트 + 객체 + 라벨)
async function analyzeWithComprehensiveResults(comprehensiveResults) {
    // 텍스트 분석 결과 포맷팅
    const textAnalysisResults = {
        hasRecyclingMarks: comprehensiveResults.recyclingMarks.length > 0,
        recyclingTexts: comprehensiveResults.recyclingTexts || [],
        recyclingMarks: comprehensiveResults.recyclingMarks || [],
        complexAnalysis: comprehensiveResults.complexAnalysis || [],
        confidence: comprehensiveResults.confidence || 0,
        summary: comprehensiveResults.summary || ''
    };

    // 객체 분석 결과 포맷팅
    const objectAnalysisResults = comprehensiveResults.recyclingObjects?.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        description: `${obj.name} (신뢰도: ${Math.round(obj.score * 100)}%)`
    })) || [];

    // 라벨 분석 결과 포맷팅
    const labelAnalysisResults = comprehensiveResults.recyclingLabels?.map(label => ({
        name: label.description,
        confidence: label.score,
        description: `${label.description} (신뢰도: ${Math.round(label.score * 100)}%)`
    })) || [];

    // 로고 분석 결과 포맷팅
    const logoAnalysisResults = comprehensiveResults.logos?.map(logo => ({
        name: logo.description,
        confidence: logo.score || 0.8,
        description: `${logo.description} (신뢰도: ${Math.round((logo.score || 0.8) * 100)}%)`
    })) || [];

    const prompt = COMPREHENSIVE_ANALYSIS_PROMPT
        .replace('{textAnalysisResults}', JSON.stringify(textAnalysisResults, null, 2))
        .replace('{objectAnalysisResults}', JSON.stringify(objectAnalysisResults, null, 2))
        .replace('{labelAnalysisResults}', JSON.stringify(labelAnalysisResults, null, 2))
        .replace('{logoAnalysisResults}', JSON.stringify(logoAnalysisResults, null, 2));
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
    });

    return {
        analysis: parseGPTResponse(response.choices[0].message.content),
        model: response.model,
        usage: response.usage,
        analysisType: "comprehensive"
    };
}

// 객체 기반 분석
async function analyzeWithObjectResults(objectResults) {
    const objectAnalysisResults = objectResults.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        description: `${obj.name} (신뢰도: ${Math.round(obj.score * 100)}%)`
    }));

    const objectConfidenceResults = objectResults.map(obj => 
        `${obj.name}: ${Math.round(obj.score * 100)}%`
    ).join(', ');

    const prompt = OBJECT_BASED_ANALYSIS_PROMPT
        .replace('{objectAnalysisResults}', JSON.stringify(objectAnalysisResults, null, 2))
        .replace('{objectConfidenceResults}', objectConfidenceResults);
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300
    });

    return {
        analysis: parseGPTResponse(response.choices[0].message.content),
        model: response.model,
        usage: response.usage,
        analysisType: "object_based"
    };
}

// 라벨 기반 분석
async function analyzeWithLabelResults(labelResults) {
    const labelAnalysisResults = labelResults.map(label => ({
        name: label.description,
        confidence: label.score,
        description: `${label.description} (신뢰도: ${Math.round(label.score * 100)}%)`
    }));

    const labelConfidenceResults = labelResults.map(label => 
        `${label.description}: ${Math.round(label.score * 100)}%`
    ).join(', ');

    const prompt = LABEL_BASED_ANALYSIS_PROMPT
        .replace('{labelAnalysisResults}', JSON.stringify(labelAnalysisResults, null, 2))
        .replace('{labelConfidenceResults}', labelConfidenceResults);
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300
    });

    return {
        analysis: parseGPTResponse(response.choices[0].message.content),
        model: response.model,
        usage: response.usage,
        analysisType: "label_based"
    };
}

// 이미지 직접 분석
async function analyzeImageDirectly(imagePath) {
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

    return {
        analysis: parseGPTResponse(response.choices[0].message.content),
        model: response.model,
        usage: response.usage,
        analysisType: "direct_image"
    };
}

// GPT 응답 파싱
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
            confidence: 0
        };
    }
}

// 파일 정리
function cleanupFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log('🗑️ 임시 파일 정리 완료');
        } catch (error) {
            console.error('❌ 파일 정리 실패:', error);
        }
    }
}

module.exports = analyzeController; 