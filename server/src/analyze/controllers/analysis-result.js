const AnalysisResult = require('../models/AnalysisResult');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/analysis');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'analysis-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 분석 결과 저장
const saveAnalysisResult = async (req, res) => {
  try {
    let analysisResult = req.body.analysisResult;
    const userId = req.user.id; // 인증된 사용자 ID

    if (!analysisResult) {
      return res.status(400).json({ 
        success: false, 
        message: '분석 결과가 필요합니다.' 
      });
    }

    // analysisResult가 문자열로 전송된 경우 파싱
    if (typeof analysisResult === 'string') {
      try {
        analysisResult = JSON.parse(analysisResult);
      } catch (parseError) {
        console.error('분석 결과 파싱 오류:', parseError);
        return res.status(400).json({ 
          success: false, 
          message: '분석 결과 형식이 올바르지 않습니다.' 
        });
      }
    }

    console.log('받은 분석 결과:', analysisResult);

    // 이미지 파일 처리
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/analysis/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '이미지가 필요합니다.' 
      });
    }

    // 분석 결과 저장
    const newAnalysisResult = new AnalysisResult({
      userId: userId,
      imageUrl: imageUrl,
      analysisResult: {
        type: analysisResult.type || '알 수 없음',
        detail: analysisResult.detail || '알 수 없음',
        mark: analysisResult.mark || '알 수 없음',
        description: analysisResult.description || '알 수 없음',
        method: analysisResult.method || '알 수 없음',
        model: analysisResult.model || '알 수 없음',
        tokenUsage: analysisResult.token_usage || analysisResult.tokenUsage || '알 수 없음'
      },
      status: 'uploaded'
    });

    await newAnalysisResult.save();

    console.log('분석 결과 저장 완료:', newAnalysisResult._id);

    res.status(201).json({
      success: true,
      message: '분석 결과가 성공적으로 저장되었습니다.',
      data: {
        id: newAnalysisResult._id,
        imageUrl: newAnalysisResult.imageUrl,
        uploadedAt: newAnalysisResult.uploadedAt
      }
    });

  } catch (error) {
    console.error('분석 결과 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자의 분석 결과 목록 조회
const getUserAnalysisResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const results = await AnalysisResult.find({ userId })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const total = await AnalysisResult.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 특정 분석 결과 조회
const getAnalysisResult = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await AnalysisResult.findOne({ 
      _id: id, 
      userId: userId 
    }).populate('userId', 'name email');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '분석 결과를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 분석 결과 삭제
const deleteAnalysisResult = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await AnalysisResult.findOneAndDelete({ 
      _id: id, 
      userId: userId 
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '분석 결과를 찾을 수 없습니다.'
      });
    }

    // 이미지 파일 삭제
    if (result.imageUrl && result.imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', result.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({
      success: true,
      message: '분석 결과가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('분석 결과 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  saveAnalysisResult,
  getUserAnalysisResults,
  getAnalysisResult,
  deleteAnalysisResult,
  upload
}; 