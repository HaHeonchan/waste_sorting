const Post = require('../../community/models/Post');
const AnalysisResult = require('../models/AnalysisResult');
const User = require('../../auth/models/User');

// 통계 데이터를 가져오는 컨트롤러
exports.getStats = async (req, res) => {
    try {
        // 총 게시글 수 조회
        const totalPosts = await Post.countDocuments();
        
        // 분리배출 인증 횟수 조회
        const totalAnalysis = await AnalysisResult.countDocuments();

        // 총 사용자 수 조회
        const totalUsers = await User.countDocuments();

        res.json({
            success: true,
            data: {
                totalPosts,
                totalAnalysis,
                totalUsers
            }
        });
    } catch (error) {
        console.error('통계 데이터 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            error: '통계 데이터를 가져오는 중 오류가 발생했습니다.'
        });
    }
};