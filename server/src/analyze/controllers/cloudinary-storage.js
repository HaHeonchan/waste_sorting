/**
 * Cloudinary 이미지 저장 및 관리 모듈
 * 이미지를 외부 클라우드에 저장하고 URL을 반환
 * MongoDB 적용을 고려한 구조로 설계
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// Cloudinary 설정
// ============================================================================

// 환경 변수에서 설정 가져오기
const CLOUDINARY_CONFIG = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

// 환경 변수 디버깅 (API Secret은 마스킹)
console.log('🔧 Cloudinary 설정 확인:', {
    cloud_name: CLOUDINARY_CONFIG.cloud_name,
    api_key: CLOUDINARY_CONFIG.api_key,
    api_secret: CLOUDINARY_CONFIG.api_secret ? '***설정됨***' : '❌ 설정되지 않음'
});

// Cloudinary 초기화
cloudinary.config(CLOUDINARY_CONFIG);

/**
 * Cloudinary 연결 테스트
 * @returns {Promise<Object>} 연결 테스트 결과
 */
async function testCloudinaryConnection() {
    try {
        console.log('🔧 Cloudinary 연결 테스트 시작...');
        
        // 설정 확인
        if (!CLOUDINARY_CONFIG.api_secret) {
            return {
                success: false,
                error: 'CLOUDINARY_API_SECRET이 설정되지 않았습니다.',
                config: {
                    cloud_name: CLOUDINARY_CONFIG.cloud_name,
                    api_key: CLOUDINARY_CONFIG.api_key,
                    api_secret: '설정되지 않음'
                }
            };
        }
        
        // 간단한 API 호출로 연결 테스트
        const result = await cloudinary.api.ping();
        
        if (result.status === 'ok') {
            console.log('✅ Cloudinary 연결 성공');
            return {
                success: true,
                message: 'Cloudinary 연결이 정상입니다.',
                config: {
                    cloud_name: CLOUDINARY_CONFIG.cloud_name,
                    api_key: CLOUDINARY_CONFIG.api_key,
                    api_secret: '설정됨'
                }
            };
        } else {
            return {
                success: false,
                error: 'Cloudinary 연결에 실패했습니다.',
                result: result
            };
        }
        
    } catch (error) {
        console.error('❌ Cloudinary 연결 테스트 실패:', error);
        return {
            success: false,
            error: error.message,
            config: {
                cloud_name: CLOUDINARY_CONFIG.cloud_name,
                api_key: CLOUDINARY_CONFIG.api_key,
                api_secret: CLOUDINARY_CONFIG.api_secret ? '설정됨' : '설정되지 않음'
            }
        };
    }
}

// ============================================================================
// 이미지 저장 관련 함수들
// ============================================================================

/**
 * 이미지를 Cloudinary에 업로드
 * @param {string} imagePath - 로컬 이미지 경로
 * @param {Object} options - 업로드 옵션
 * @returns {Promise<Object>} 업로드 결과
 */
async function uploadImageToCloudinary(imagePath, options = {}) {
    try {
        console.log('☁️ Cloudinary에 이미지 업로드 시작:', imagePath);
        
        // 파일 존재 확인
        if (!fs.existsSync(imagePath)) {
            throw new Error(`이미지 파일이 존재하지 않습니다: ${imagePath}`);
        }
        
        const {
            publicId = generatePublicId(imagePath),
            folder = 'waste-sorting',
            tags = ['waste-analysis'],
            transformation = {},
            optimization = true
        } = options;
        
        // 기본 최적화 옵션
        const defaultTransformation = {
            quality: 'auto:good', // 자동 품질 최적화
            fetch_format: 'auto', // 자동 포맷 선택
            strip: true, // 메타데이터 제거로 파일 크기 감소
            ...transformation
        };
        
        // 업로드 옵션 구성
        const uploadOptions = {
            public_id: publicId,
            folder: folder,
            tags: tags,
            resource_type: 'image',
            transformation: optimization ? defaultTransformation : transformation
        };
        
        console.log('📤 업로드 옵션:', uploadOptions);
        
        // Cloudinary 업로드 실행
        const result = await cloudinary.uploader.upload(imagePath, uploadOptions);
        
        console.log('✅ Cloudinary 업로드 완료:', {
            publicId: result.public_id,
            url: result.secure_url,
            size: result.bytes,
            format: result.format,
            optimization: optimization
        });
        
        return {
            success: true,
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            size: result.bytes,
            format: result.format,
            createdAt: result.created_at,
            cloudinaryData: result,
            optimization: optimization
        };
        
    } catch (error) {
        console.error('❌ Cloudinary 업로드 실패:', error);
        return {
            success: false,
            error: error.message,
            publicId: null,
            url: null
        };
    }
}

/**
 * Cloudinary에서 이미지 삭제
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} 삭제 결과
 */
async function deleteImageFromCloudinary(publicId) {
    try {
        console.log('🗑️ Cloudinary에서 이미지 삭제:', publicId);
        
        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            console.log('✅ Cloudinary 이미지 삭제 완료:', publicId);
            return { success: true, message: '이미지가 성공적으로 삭제되었습니다.' };
        } else {
            console.log('⚠️ Cloudinary 이미지 삭제 실패:', result);
            return { success: false, message: '이미지 삭제에 실패했습니다.' };
        }
        
    } catch (error) {
        console.error('❌ Cloudinary 이미지 삭제 오류:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cloudinary 이미지 URL 생성 (최적화된 버전)
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - 변환 옵션
 * @returns {string} 최적화된 이미지 URL
 */
function getOptimizedImageUrl(publicId, options = {}) {
    const {
        width = 800,
        height = 800,
        quality = 'auto',
        format = 'auto',
        crop = 'limit'
    } = options;
    
    return cloudinary.url(publicId, {
        width: width,
        height: height,
        quality: quality,
        fetch_format: format,
        crop: crop,
        gravity: 'auto'
    });
}

/**
 * 이미지 메타데이터 가져오기
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} 이미지 메타데이터
 */
async function getImageMetadata(publicId) {
    try {
        console.log('📊 Cloudinary 이미지 메타데이터 조회:', publicId);
        
        const result = await cloudinary.api.resource(publicId);
        
        return {
            success: true,
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            size: result.bytes,
            format: result.format,
            createdAt: result.created_at,
            tags: result.tags || []
        };
        
    } catch (error) {
        console.error('❌ Cloudinary 메타데이터 조회 실패:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 고유한 public ID 생성
 * @param {string} imagePath - 이미지 경로
 * @returns {string} 고유한 public ID
 */
function generatePublicId(imagePath) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(imagePath).replace('.', '');
    const baseName = path.basename(imagePath, path.extname(imagePath));
    
    return `waste-${baseName}-${timestamp}-${randomString}`;
}

/**
 * 이미지 해시 기반 public ID 생성
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @returns {string} 해시 기반 public ID
 */
function generateHashBasedPublicId(imageBuffer) {
    const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    const timestamp = Date.now();
    return `waste-hash-${hash}-${timestamp}`;
}

// ============================================================================
// MongoDB 적용을 위한 인터페이스 함수들
// ============================================================================

/**
 * 이미지 저장 정보를 데이터베이스에 저장할 형식으로 변환
 * @param {Object} uploadResult - Cloudinary 업로드 결과
 * @param {Object} analysisResult - 분석 결과
 * @returns {Object} 데이터베이스 저장용 객체
 */
function createImageRecord(uploadResult, analysisResult = null) {
    return {
        // Cloudinary 정보
        cloudinaryId: uploadResult.publicId,
        cloudinaryUrl: uploadResult.url,
        imageMetadata: {
            width: uploadResult.width,
            height: uploadResult.height,
            size: uploadResult.size,
            format: uploadResult.format
        },
        
        // 분석 결과 (나중에 MongoDB에 저장될)
        analysisResult: analysisResult,
        
        // 메타데이터
        uploadedAt: new Date(),
        createdAt: uploadResult.createdAt,
        tags: ['waste-analysis'],
        
        // 상태 정보
        status: 'uploaded',
        isAnalyzed: !!analysisResult
    };
}

/**
 * 이미지 정보 업데이트 (MongoDB 적용 시 사용)
 * @param {string} cloudinaryId - Cloudinary ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Object} 업데이트 결과
 */
function updateImageRecord(cloudinaryId, updateData) {
    // MongoDB 적용 시 실제 데이터베이스 업데이트 로직으로 교체
    console.log('📝 이미지 레코드 업데이트:', { cloudinaryId, updateData });
    
    return {
        success: true,
        cloudinaryId: cloudinaryId,
        updatedAt: new Date(),
        updatedFields: Object.keys(updateData)
    };
}

/**
 * 이미지 레코드 삭제 (MongoDB 적용 시 사용)
 * @param {string} cloudinaryId - Cloudinary ID
 * @returns {Object} 삭제 결과
 */
async function deleteImageRecord(cloudinaryId) {
    try {
        // 1. Cloudinary에서 이미지 삭제
        const cloudinaryResult = await deleteImageFromCloudinary(cloudinaryId);
        
        if (!cloudinaryResult.success) {
            return cloudinaryResult;
        }
        
        // 2. 데이터베이스에서 레코드 삭제 (MongoDB 적용 시)
        console.log('🗑️ 이미지 레코드 삭제:', cloudinaryId);
        
        return {
            success: true,
            cloudinaryId: cloudinaryId,
            deletedAt: new Date(),
            message: '이미지와 레코드가 성공적으로 삭제되었습니다.'
        };
        
    } catch (error) {
        console.error('❌ 이미지 레코드 삭제 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 분석 결과를 이미지 레코드에 업데이트 (MongoDB 적용 시 사용)
 * @param {string} cloudinaryId - Cloudinary ID
 * @param {Object} analysisResult - 분석 결과
 * @returns {Object} 업데이트 결과
 */
function updateAnalysisResult(cloudinaryId, analysisResult) {
    const updateData = {
        analysisResult: analysisResult,
        isAnalyzed: true,
        analyzedAt: new Date(),
        status: 'analyzed'
    };
    
    return updateImageRecord(cloudinaryId, updateData);
}

/**
 * 이미지 레코드 검색 (MongoDB 적용 시 사용)
 * @param {Object} query - 검색 조건
 * @returns {Array} 검색 결과
 */
function searchImageRecords(query = {}) {
    // MongoDB 적용 시 실제 검색 로직으로 교체
    console.log('🔍 이미지 레코드 검색:', query);
    
    return {
        success: true,
        records: [],
        total: 0,
        query: query
    };
}

/**
 * 이미지 레코드 통계 (MongoDB 적용 시 사용)
 * @returns {Object} 통계 정보
 */
function getImageRecordsStats() {
    // MongoDB 적용 시 실제 통계 로직으로 교체
    console.log('📊 이미지 레코드 통계 조회');
    
    return {
        success: true,
        stats: {
            total: 0,
            analyzed: 0,
            pending: 0,
            totalSize: 0
        }
    };
}

// ============================================================================
// 통합 이미지 관리 함수
// ============================================================================

/**
 * 이미지 업로드 및 저장 (통합 함수)
 * @param {string} imagePath - 로컬 이미지 경로
 * @param {Object} options - 옵션
 * @returns {Promise<Object>} 통합 결과
 */
async function uploadAndStoreImage(imagePath, options = {}) {
    try {
        console.log('🚀 이미지 업로드 및 저장 시작');
        
        const {
            folder = 'waste-sorting',
            tags = ['waste-analysis'],
            optimization = true,
            transformation = {}
        } = options;
        
        // 1. Cloudinary에 업로드 (최적화 포함)
        const uploadResult = await uploadImageToCloudinary(imagePath, {
            folder,
            tags,
            optimization,
            transformation
        });
        
        if (!uploadResult.success) {
            return uploadResult;
        }
        
        // 2. 데이터베이스 레코드 생성 (MongoDB 적용 시)
        const imageRecord = createImageRecord(uploadResult);
        
        console.log('✅ 이미지 업로드 및 저장 완료:', {
            cloudinaryId: uploadResult.publicId,
            url: uploadResult.url,
            size: uploadResult.size,
            optimization: uploadResult.optimization
        });
        
        return {
            success: true,
            cloudinaryId: uploadResult.publicId,
            url: uploadResult.url,
            imageRecord: imageRecord,
            metadata: {
                width: uploadResult.width,
                height: uploadResult.height,
                size: uploadResult.size,
                format: uploadResult.format,
                optimization: uploadResult.optimization
            }
        };
        
    } catch (error) {
        console.error('❌ 이미지 업로드 및 저장 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 이미지 URL 가져오기 (최적화된 버전)
 * @param {string} cloudinaryId - Cloudinary ID
 * @param {Object} options - 변환 옵션
 * @returns {string} 최적화된 이미지 URL
 */
function getImageUrl(cloudinaryId, options = {}) {
    return getOptimizedImageUrl(cloudinaryId, options);
}

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
    // 기본 Cloudinary 함수들
    uploadImageToCloudinary,
    deleteImageFromCloudinary,
    getOptimizedImageUrl,
    getImageMetadata,
    
    // 유틸리티 함수들
    generatePublicId,
    generateHashBasedPublicId,
    
    // MongoDB 적용을 위한 인터페이스
    createImageRecord,
    updateImageRecord,
    deleteImageRecord,
    updateAnalysisResult,
    searchImageRecords,
    getImageRecordsStats,
    
    // 통합 함수들
    uploadAndStoreImage,
    getImageUrl,
    testCloudinaryConnection
}; 