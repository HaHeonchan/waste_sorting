const Report = require('../models/report');
const mongoose = require('mongoose');
const cloudinaryStorage = require('../../analyze/controllers/cloudinary-storage');
const fs = require('fs');
const path = require('path');

// 1. 민원 목록 조회 (정렬 + 페이지네이션 지원)
exports.listReports = async (req, res) => {
    try {
        let { sort = 'date', order = 'desc', page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const validSorts = ['likes', 'date'];
        if (!validSorts.includes(sort)) sort = 'date';

        const sortKey = sort === 'likes' ? 'likes' : 'created_at';
        const sortOption = order === 'asc' ? 1 : -1;

        const total = await Report.countDocuments();
        const data = await Report.find()
            .sort({ [sortKey]: sortOption })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ total, page, limit, data });
    } catch (err) {
        console.error('민원 목록 조회 에러:', err);
        res.status(500).json({ message: '민원 목록 조회 실패', error: err.message });
    }
};

// 2. 민원 작성 (Cloudinary 통합)
exports.createReport = async (req, res) => {
    try {
        let image_url = '';
        let cloudinary_id = '';
        let image_metadata = {};

        // 이미지 업로드 처리
        if (req.file) {
            console.log('📸 민원 이미지 업로드 시작:', req.file.filename);
            
            // Cloudinary에 업로드
            const uploadResult = await cloudinaryStorage.uploadImageToCloudinary(req.file.path, {
                folder: 'complain-reports',
                tags: ['complain', 'report'],
                optimization: true
            });

            if (uploadResult.success) {
                image_url = uploadResult.url;
                cloudinary_id = uploadResult.publicId;
                image_metadata = {
                    width: uploadResult.width,
                    height: uploadResult.height,
                    size: uploadResult.size,
                    format: uploadResult.format
                };
                
                console.log('✅ Cloudinary 업로드 성공:', {
                    cloudinary_id: cloudinary_id,
                    url: image_url,
                    size: uploadResult.size
                });
            } else {
                console.error('❌ Cloudinary 업로드 실패:', uploadResult.error);
                return res.status(500).json({ 
                    message: '이미지 업로드 실패', 
                    error: uploadResult.error 
                });
            }

            // 로컬 임시 파일 삭제
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ 임시 파일 삭제 완료:', req.file.path);
            } catch (deleteError) {
                console.warn('⚠️ 임시 파일 삭제 실패:', deleteError.message);
            }
        } else {
            image_url = req.body.image_url || '';
        }

        const { title, content, reward } = req.body;
        if (!title || !content || !reward) {
            return res.status(400).json({ message: '제목, 내용, 포상금 유형은 필수입니다' });
        }

        // 임시 사용자 ID (인증 미들웨어 비활성화 상태)
        const userId = req.user ? req.user.user_id : 1;

        const newReport = await Report.create({
            user_id: userId,
            title,
            content,
            reward,
            image_url,
            cloudinary_id,
            image_metadata,
            likes: 0
        });

        res.status(201).json({ 
            message: '등록 완료', 
            report_id: newReport._id,
            image_url: image_url,
            cloudinary_id: cloudinary_id
        });
    } catch (err) {
        console.error('민원 등록 에러:', err);
        res.status(500).json({ message: '민원 등록 실패', error: err.message });
    }
};

// 3. 민원 수정 (Cloudinary 통합)
exports.updateReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        const { title, content, reward } = req.body;

        // ObjectId 검증
        if (!mongoose.Types.ObjectId.isValid(report_id)) {
            return res.status(400).json({ message: '잘못된 리포트 ID' });
        }

        const userId = req.user ? req.user.user_id : 1;
        const report = await Report.findOne({ _id: report_id, user_id: userId });
        if (!report) return res.status(404).json({ message: '수정할 민원 없음' });

        // 새 이미지 업로드 처리
        if (req.file) {
            console.log('📸 민원 이미지 수정 업로드 시작:', req.file.filename);
            
            // 기존 Cloudinary 이미지 삭제
            if (report.cloudinary_id) {
                try {
                    await cloudinaryStorage.deleteImageFromCloudinary(report.cloudinary_id);
                    console.log('🗑️ 기존 Cloudinary 이미지 삭제 완료:', report.cloudinary_id);
                } catch (deleteError) {
                    console.warn('⚠️ 기존 이미지 삭제 실패:', deleteError.message);
                }
            }

            // 새 이미지를 Cloudinary에 업로드
            const uploadResult = await cloudinaryStorage.uploadImageToCloudinary(req.file.path, {
                folder: 'complain-reports',
                tags: ['complain', 'report'],
                optimization: true
            });

            if (uploadResult.success) {
                report.image_url = uploadResult.url;
                report.cloudinary_id = uploadResult.publicId;
                report.image_metadata = {
                    width: uploadResult.width,
                    height: uploadResult.height,
                    size: uploadResult.size,
                    format: uploadResult.format
                };
                
                console.log('✅ Cloudinary 수정 업로드 성공:', {
                    cloudinary_id: uploadResult.publicId,
                    url: uploadResult.url
                });
            } else {
                console.error('❌ Cloudinary 수정 업로드 실패:', uploadResult.error);
                return res.status(500).json({ 
                    message: '이미지 업로드 실패', 
                    error: uploadResult.error 
                });
            }

            // 로컬 임시 파일 삭제
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ 임시 파일 삭제 완료:', req.file.path);
            } catch (deleteError) {
                console.warn('⚠️ 임시 파일 삭제 실패:', deleteError.message);
            }
        }

        // 텍스트 필드 업데이트
        if ('title' in req.body) report.title = title;
        if ('content' in req.body) report.content = content;
        if ('reward' in req.body) report.reward = reward;

        await report.save();
        res.json({ 
            message: '수정 완료',
            image_url: report.image_url,
            cloudinary_id: report.cloudinary_id
        });
    } catch (err) {
        console.error('민원 수정 에러:', err);
        res.status(500).json({ message: '민원 수정 실패', error: err.message });
    }
};

// 4. 민원 삭제 (Cloudinary 통합)
exports.deleteReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        
        // ObjectId 검증
        if (!mongoose.Types.ObjectId.isValid(report_id)) {
            return res.status(400).json({ message: '잘못된 리포트 ID' });
        }

        const userId = req.user ? req.user.user_id : 1;
        const report = await Report.findOne({ _id: report_id, user_id: userId });
        
        if (!report) {
            return res.status(404).json({ message: '삭제할 민원 없음' });
        }

        // Cloudinary에서 이미지 삭제
        if (report.cloudinary_id) {
            try {
                await cloudinaryStorage.deleteImageFromCloudinary(report.cloudinary_id);
                console.log('🗑️ Cloudinary 이미지 삭제 완료:', report.cloudinary_id);
            } catch (deleteError) {
                console.warn('⚠️ Cloudinary 이미지 삭제 실패:', deleteError.message);
            }
        }

        // 데이터베이스에서 삭제
        await Report.deleteOne({ _id: report_id, user_id: userId });
        
        res.status(204).send();
    } catch (err) {
        console.error('민원 삭제 에러:', err);
        res.status(500).json({ message: '민원 삭제 실패', error: err.message });
    }
};

// 5. 민원 추천 (like)
exports.likeReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        
        // ObjectId 검증
        if (!mongoose.Types.ObjectId.isValid(report_id)) {
            return res.status(400).json({ message: '잘못된 리포트 ID' });
        }

        const report = await Report.findById(report_id);
        if (!report) return res.status(404).json({ message: '리포트를 찾을 수 없음' });

        report.likes = (report.likes || 0) + 1;
        await report.save();

        res.json({ message: '추천 완료', likes: report.likes });
    } catch (err) {
        console.error('추천 에러:', err);
        res.status(500).json({ message: '추천 실패', error: err.message });
    }
};

// 6. 민원 신고 시 정보 조회용
exports.getReportInfo = async (req, res) => {
    try {
        const { report_id } = req.params;
        
        // ObjectId 검증
        if (!mongoose.Types.ObjectId.isValid(report_id)) {
            return res.status(400).json({ message: '잘못된 리포트 ID' });
        }

        const report = await Report.findById(report_id);
        if (!report) return res.status(404).json({ message: '해당 리포트 없음' });

        const 신고링크 = "https://www.sejong.go.kr/citizen/sub03_0307.do";
        const rewardAmountMap = {
            a: "20,000원",
            b: "100,000원",
            c: "100,000원",
            d: "200,000원",
            e: "400,000원",
            f: "금액 미상"
        };

        res.json({
            title: report.title,
            content: report.content,
            reward_amount: rewardAmountMap[report.reward] || "-",
            report_url: 신고링크
        });
    } catch (err) {
        console.error('신고 정보 조회 에러:', err);
        res.status(500).json({ message: '신고 정보 조회 실패', error: err.message });
    }
};
