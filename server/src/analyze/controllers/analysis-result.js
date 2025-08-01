/**
 * 분석 결과 관리 컨트롤러
 * 분석 결과의 저장, 조회, 삭제 기능을 담당
 */

const AnalysisResult = require('../models/AnalysisResult');
const User = require('../../auth/models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// ============================================================================
// 설정 및 유틸리티
// ============================================================================

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
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
 * 분석 결과 파싱
 * @param {any} analysisResult - 파싱할 분석 결과
 * @returns {Object} 파싱된 분석 결과
 */
function parseAnalysisResult(analysisResult) {
  if (typeof analysisResult === 'string') {
    try {
      return JSON.parse(analysisResult);
    } catch (error) {
      throw new Error('분석 결과 형식이 올바르지 않습니다.');
    }
  }
  return analysisResult;
}

/**
 * 오늘 날짜의 시작 시간 반환
 * @returns {Date} 오늘 날짜의 시작 시간
 */
function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 사용자 포인트 계산
 * @param {number} sameTypeCount - 같은 타입 분석 결과 개수
 * @returns {number} 계산된 포인트
 */
function calculatePoints(sameTypeCount) {
  let points = 10;
  if (sameTypeCount > 0) {
    points = Math.max(1, 10 - sameTypeCount); // 최소 1점 보장
  }
  return points;
}

/**
 * Cloudinary 이미지 업로드
 * @param {string} filePath - 업로드할 파일 경로
 * @returns {Promise<string>} 업로드된 이미지 URL
 */
async function uploadToCloudinary(filePath) {
  console.log('📸 Cloudinary 업로드 시작:', path.basename(filePath));
  
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'waste-sorting/analysis',
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
 * 임시 파일 정리
 * @param {string} filePath - 삭제할 파일 경로
 */
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ 임시 파일 삭제 완료:', path.basename(filePath));
    }
  } catch (error) {
    console.error('❌ 임시 파일 삭제 실패:', error.message);
  }
}

/**
 * Cloudinary 이미지 삭제
 * @param {string} imageUrl - 삭제할 이미지 URL
 */
async function deleteCloudinaryImage(imageUrl) {
  try {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    const fullPublicId = `waste-sorting/analysis/${publicId}`;
    
    console.log('🗑️ Cloudinary 이미지 삭제 시작:', fullPublicId);
    
    await cloudinary.uploader.destroy(fullPublicId);
    console.log('🗑️ Cloudinary 이미지 삭제 완료');
  } catch (error) {
    console.error('🔥 Cloudinary 이미지 삭제 실패:', error.message);
  }
}

// ============================================================================
// 분석 결과 저장 관련 함수들
// ============================================================================

/**
 * 일일 분석 결과 제한 확인
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} 제한 초과 여부
 */
async function checkDailyLimit(userId) {
  const today = getTodayStart();
  const countToday = await AnalysisResult.countDocuments({
    userId: userId,
    uploadedAt: { $gte: today }
  });
  
  console.log(`📊 오늘 분석 결과 개수: ${countToday}/5`);
  return countToday >= 5;
}

/**
 * 같은 타입 분석 결과 개수 조회
 * @param {string} userId - 사용자 ID
 * @param {string} analysisType - 분석 타입
 * @returns {Promise<number>} 같은 타입 개수
 */
async function getSameTypeCount(userId, analysisType) {
  const today = getTodayStart();
  return await AnalysisResult.countDocuments({
    userId,
    'analysisResult.type': analysisType,
    uploadedAt: { $gte: today }
  });
}

/**
 * 사용자 포인트 업데이트
 * @param {string} userId - 사용자 ID
 * @param {number} points - 추가할 포인트
 */
async function updateUserPoints(userId, points) {
  await User.findByIdAndUpdate(userId, {
    $inc: { points: points, recycleCount: 1 }
  });
  console.log(`💰 사용자 포인트 업데이트: +${points}점`);
}

/**
 * 이미지 URL 처리
 * @param {Object} req - 요청 객체
 * @returns {Promise<string>} 처리된 이미지 URL
 */
async function processImageUrl(req) {
  if (req.file) {
    try {
      const imageUrl = await uploadToCloudinary(req.file.path);
      cleanupTempFile(req.file.path);
      return imageUrl;
    } catch (error) {
      cleanupTempFile(req.file.path);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
  } else if (req.body.imageUrl) {
    return req.body.imageUrl;
  } else {
    throw new Error('이미지가 필요합니다.');
  }
}

/**
 * 분석 결과 데이터 정규화
 * @param {Object} analysisResult - 원본 분석 결과
 * @returns {Object} 정규화된 분석 결과
 */
function normalizeAnalysisResult(analysisResult) {
  return {
    type: analysisResult.type || '알 수 없음',
    detail: analysisResult.detail || '알 수 없음',
    mark: analysisResult.mark || '알 수 없음',
    description: analysisResult.description || '알 수 없음',
    method: analysisResult.method || '알 수 없음',
    model: analysisResult.model || '알 수 없음',
    tokenUsage: analysisResult.token_usage || analysisResult.tokenUsage || '알 수 없음',
    materialParts: analysisResult.materialParts || []
  };
}

// ============================================================================
// 메인 컨트롤러 함수들
// ============================================================================

/**
 * 분석 결과 저장
 */
const saveAnalysisResult = async (req, res) => {
  try {
    console.log('💾 분석 결과 저장 시작');
    
    const userId = req.user.id;
    let analysisResult = parseAnalysisResult(req.body.analysisResult);
    
    // 일일 제한 확인
    if (await checkDailyLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: '오늘은 최대 5개의 분석 결과만 저장할 수 있습니다.',
        limit: 5
      });
    }
    
    // 포인트 계산 및 업데이트
    const sameTypeCount = await getSameTypeCount(userId, analysisResult.type);
    const points = calculatePoints(sameTypeCount);
    await updateUserPoints(userId, points);
    
    // 이미지 처리
    const imageUrl = await processImageUrl(req);
    
    // 분석 결과 저장
    const normalizedResult = normalizeAnalysisResult(analysisResult);
    const newAnalysisResult = new AnalysisResult({
      userId: userId,
      imageUrl: imageUrl,
      analysisResult: normalizedResult,
      status: 'uploaded'
    });
    
    await newAnalysisResult.save();
    console.log('✅ 분석 결과 저장 완료:', newAnalysisResult._id);
    
    res.status(201).json({
      success: true,
      message: '분석 결과가 성공적으로 저장되었습니다.',
      data: {
        id: newAnalysisResult._id,
        imageUrl: newAnalysisResult.imageUrl,
        uploadedAt: newAnalysisResult.uploadedAt,
        points: points
      }
    });
    
  } catch (error) {
    console.error('❌ 분석 결과 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 사용자의 분석 결과 목록 조회
 */
const getUserAnalysisResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [results, total] = await Promise.all([
      AnalysisResult.find({ userId })
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      AnalysisResult.countDocuments({ userId })
    ]);
    
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
    console.error('❌ 분석 결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 특정 분석 결과 조회
 */
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
    console.error('❌ 분석 결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 분석 결과 삭제
 */
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
    if (result.imageUrl) {
      if (result.imageUrl.includes('cloudinary.com')) {
        await deleteCloudinaryImage(result.imageUrl);
      } else if (result.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', result.imageUrl);
        cleanupTempFile(imagePath);
      }
    }
    
    res.json({
      success: true,
      message: '분석 결과가 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 분석 결과 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '분석 결과 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
  saveAnalysisResult,
  getUserAnalysisResults,
  getAnalysisResult,
  deleteAnalysisResult,
  upload
}; 