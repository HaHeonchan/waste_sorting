const Report = require('../models/report');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

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

// 2. 민원 작성 (Cloudinary 업로드)
exports.createReport = async (req, res) => {
    try {
        let image_url = '';

        // 이미지 업로드 처리
        if (req.file) {
            console.log('📸 민원 이미지 Cloudinary 업로드 시작:', req.file.filename);
            
            try {
                // Cloudinary에 업로드 (최적화 옵션 추가)
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'waste-sorting/complaints',
                    resource_type: 'auto',
                    quality: 'auto:good', // 자동 품질 최적화
                    fetch_format: 'auto', // 자동 포맷 선택
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit' }, // 최대 크기 제한
                        { quality: 'auto:good' }
                    ]
                });
                
                image_url = result.secure_url;
                console.log('✅ Cloudinary 업로드 완료:', image_url);
                
                // 임시 파일 삭제
                fs.unlinkSync(req.file.path);
                console.log('🗑️ 임시 파일 삭제 완료');
                
            } catch (uploadError) {
                console.error('🔥 Cloudinary 업로드 실패:', uploadError);
                // 임시 파일 삭제
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: '이미지 업로드 실패', error: uploadError.message });
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
            likes: 0
        });

        res.status(201).json({ 
            message: '등록 완료', 
            report_id: newReport._id,
            image_url: image_url
        });
    } catch (err) {
        console.error('민원 등록 에러:', err);
        res.status(500).json({ message: '민원 등록 실패', error: err.message });
    }
};

// 3. 민원 수정 (Cloudinary 업로드)
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
            console.log('📸 민원 이미지 수정 Cloudinary 업로드 시작:', req.file.filename);
            
            try {
                // 기존 이미지가 Cloudinary URL인 경우 삭제 (비동기 처리)
                if (report.image_url && report.image_url.includes('cloudinary.com')) {
                    // Cloudinary URL에서 public ID 추출
                    const urlParts = report.image_url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = filename.split('.')[0];
                    
                    // 폴더 경로 포함하여 전체 public ID 구성
                    const fullPublicId = `waste-sorting/complaints/${publicId}`;
                    
                    console.log('🗑️ 기존 Cloudinary 이미지 삭제 시작 (비동기):', fullPublicId);
                    
                    // 비동기로 삭제 처리 (응답을 기다리지 않음)
                    cloudinary.uploader.destroy(fullPublicId)
                        .then(() => console.log('🗑️ 기존 Cloudinary 이미지 삭제 완료'))
                        .catch(error => console.error('🔥 기존 Cloudinary 이미지 삭제 실패:', error.message));
                }
                
                // 새 이미지를 Cloudinary에 업로드 (최적화 옵션 추가)
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'waste-sorting/complaints',
                    resource_type: 'auto',
                    quality: 'auto:good', // 자동 품질 최적화
                    fetch_format: 'auto', // 자동 포맷 선택
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit' }, // 최대 크기 제한
                        { quality: 'auto:good' }
                    ]
                });
                
                report.image_url = result.secure_url;
                console.log('✅ Cloudinary 수정 업로드 완료:', report.image_url);
                
                // 임시 파일 삭제
                fs.unlinkSync(req.file.path);
                console.log('🗑️ 임시 파일 삭제 완료');
                
            } catch (uploadError) {
                console.error('🔥 Cloudinary 업로드 실패:', uploadError);
                // 임시 파일 삭제
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: '이미지 업로드 실패', error: uploadError.message });
            }
        }

        // 텍스트 필드 업데이트
        if ('title' in req.body) report.title = title;
        if ('content' in req.body) report.content = content;
        if ('reward' in req.body) report.reward = reward;

        await report.save();
        res.json({ 
            message: '수정 완료',
            image_url: report.image_url
        });
    } catch (err) {
        console.error('민원 수정 에러:', err);
        res.status(500).json({ message: '민원 수정 실패', error: err.message });
    }
};

// 4. 민원 삭제 (Cloudinary 이미지도 함께 삭제)
exports.deleteReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        
        console.log('🗑️ 삭제 요청 받음:', { 
            report_id, 
            params: req.params,
            method: req.method,
            url: req.url,
            headers: req.headers
        });
        
        // ObjectId 검증
        if (!mongoose.Types.ObjectId.isValid(report_id)) {
            console.log('❌ 잘못된 ObjectId:', report_id);
            return res.status(400).json({ message: '잘못된 리포트 ID' });
        }

        const userId = req.user ? req.user.user_id : 1;
        console.log('🔍 신고 검색:', { report_id, userId });
        
        // 먼저 해당 ID의 신고가 존재하는지 확인 (사용자 ID 무관)
        const reportExists = await Report.findById(report_id);
        if (!reportExists) {
            console.log('❌ 신고를 찾을 수 없음:', report_id);
            return res.status(404).json({ message: '삭제할 민원 없음' });
        }
        
        console.log('✅ 신고 발견:', { 
            id: reportExists._id, 
            title: reportExists.title, 
            user_id: reportExists.user_id 
        });
        
        // 사용자 권한 확인 (임시로 비활성화)
        const report = await Report.findOne({ _id: report_id, user_id: userId });
        
        if (!report) {
            console.log('⚠️ 사용자 권한 없음, 하지만 신고는 존재함. 임시로 삭제 허용');
            // 임시로 권한 체크를 건너뛰고 삭제 진행
        }

        // 실제 삭제할 신고 객체 결정 (권한 체크를 건너뛰었으므로 reportExists 사용)
        const reportToDelete = report || reportExists;
        
        // Cloudinary에서 이미지 삭제 (비동기 처리)
        if (reportToDelete.image_url && reportToDelete.image_url.includes('cloudinary.com')) {
            // Cloudinary URL에서 public ID 추출
            const urlParts = reportToDelete.image_url.split('/');
            const filename = urlParts[urlParts.length - 1];
            const publicId = filename.split('.')[0];
            
            // 폴더 경로 포함하여 전체 public ID 구성
            const fullPublicId = `waste-sorting/complaints/${publicId}`;
            
            console.log('🗑️ Cloudinary 이미지 삭제 시작 (비동기):', fullPublicId);
            
            // 비동기로 삭제 처리 (응답을 기다리지 않음)
            cloudinary.uploader.destroy(fullPublicId)
                .then(() => console.log('🗑️ Cloudinary 이미지 삭제 완료'))
                .catch(error => console.error('🔥 Cloudinary 이미지 삭제 실패:', error.message));
        }

        // 데이터베이스에서 삭제 (사용자 ID 조건 제거)
        const deleteResult = await Report.deleteOne({ _id: report_id });
        console.log('🗑️ 데이터베이스 삭제 결과:', deleteResult);
        
        if (deleteResult.deletedCount === 0) {
            console.log('❌ 삭제 실패: 해당 ID의 신고가 없음');
            return res.status(404).json({ message: '삭제할 민원 없음' });
        }
        
        console.log('✅ 삭제 완료');
        res.status(200).json({ message: '삭제 완료', deletedId: report_id });
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
