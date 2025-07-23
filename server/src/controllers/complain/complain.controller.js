const { readReports, writeReports, getNextReportId } = require('../../models/report.model');

// 1. 민원 목록 조회 (정렬 + 페이지네이션 지원)
exports.listReports = (req, res) => {
    let { sort = 'date', order = 'desc', page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const validSorts = ['likes', 'date'];
    if (!validSorts.includes(sort)) sort = 'date';

    const all = readReports();

    const sorted = all.sort((a, b) => {
        let aVal = sort === 'likes' ? (a.likes || 0) : new Date(a.created_at);
        let bVal = sort === 'likes' ? (b.likes || 0) : new Date(b.created_at);
        return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const startIdx = (page - 1) * limit;
    const paged = sorted.slice(startIdx, startIdx + limit);

    res.json({
        total: sorted.length,
        page,
        limit,
        data: paged
    });
};

// 2. 민원 작성
exports.createReport = (req, res) => {
    let image_url = '';
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    } else {
        image_url = req.body.image_url || '';
    }

    const { title, content, reward } = req.body;
    if (!title || !content || !reward) {
        return res.status(400).json({ message: '제목, 내용, 포상금 유형은 필수입니다' });
    }

    const all = readReports();
    const newReport = {
        report_id: getNextReportId(),
        user_id: req.user.user_id,
        title,
        content,
        reward,
        image_url,
        likes: 0,
        created_at: new Date().toISOString()
    };
    all.push(newReport);
    writeReports(all);
    res.status(201).json({ message: '등록 완료', report_id: newReport.report_id });
};

// 3. 민원 수정
exports.updateReport = (req, res) => {
    const { report_id } = req.params;
    const { title, content, reward } = req.body;
    const all = readReports();
    const idx = all.findIndex(r => r.report_id == report_id && r.user_id === req.user.user_id);
    if (idx === -1) return res.status(404).json({ message: '수정할 민원 없음' });

    if (req.file) {
        all[idx].image_url = '/uploads/' + req.file.filename;
    }
    if ('title' in req.body) all[idx].title = title;
    if ('content' in req.body) all[idx].content = content;
    if ('reward' in req.body) all[idx].reward = reward;

    writeReports(all);
    res.json({ message: '수정 완료' });
};

// 4. 민원 삭제
exports.deleteReport = (req, res) => {
    const { report_id } = req.params;
    const all = readReports();
    const idx = all.findIndex(r => r.report_id == report_id && r.user_id === req.user.user_id);
    if (idx === -1) return res.status(404).json({ message: '삭제할 민원 없음' });

    all.splice(idx, 1);
    writeReports(all);
    res.status(204).send();
};

// 5. 민원 추천 (like)
exports.likeReport = (req, res) => {
    const { report_id } = req.params;
    const all = readReports();
    const report = all.find(r => r.report_id == report_id);
    if (!report) return res.status(404).json({ message: '리포트를 찾을 수 없음' });

    report.likes = (report.likes || 0) + 1;
    writeReports(all);

    res.json({ message: '추천 완료', likes: report.likes });
};

// 6. 민원 신고 시 정보 조회용
exports.getReportInfo = (req, res) => {
    const { report_id } = req.params;
    const all = readReports();
    const report = all.find(r => r.report_id == report_id);
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
};
const Report = require('../models/report.model');

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
        res.status(500).json({ message: '민원 목록 조회 실패', error: err.message });
    }
};

// 2. 민원 작성
exports.createReport = async (req, res) => {
    try {
        let image_url = '';
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        } else {
            image_url = req.body.image_url || '';
        }

        const { title, content, reward } = req.body;
        if (!title || !content || !reward) {
            return res.status(400).json({ message: '제목, 내용, 포상금 유형은 필수입니다' });
        }

        const newReport = await Report.create({
            user_id: req.user.user_id,
            title,
            content,
            reward,
            image_url,
            likes: 0
        });

        res.status(201).json({ message: '등록 완료', report_id: newReport._id });
    } catch (err) {
        res.status(500).json({ message: '민원 등록 실패', error: err.message });
    }
};

// 3. 민원 수정
exports.updateReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        const { title, content, reward } = req.body;

        const report = await Report.findOne({ _id: report_id, user_id: req.user.user_id });
        if (!report) return res.status(404).json({ message: '수정할 민원 없음' });

        if (req.file) report.image_url = '/uploads/' + req.file.filename;
        if ('title' in req.body) report.title = title;
        if ('content' in req.body) report.content = content;
        if ('reward' in req.body) report.reward = reward;

        await report.save();
        res.json({ message: '수정 완료' });
    } catch (err) {
        res.status(500).json({ message: '민원 수정 실패', error: err.message });
    }
};

// 4. 민원 삭제
exports.deleteReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        const result = await Report.deleteOne({ _id: report_id, user_id: req.user.user_id });
        if (result.deletedCount === 0) return res.status(404).json({ message: '삭제할 민원 없음' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: '민원 삭제 실패', error: err.message });
    }
};

// 5. 민원 추천 (like)
exports.likeReport = async (req, res) => {
    try {
        const { report_id } = req.params;
        const report = await Report.findById(report_id);
        if (!report) return res.status(404).json({ message: '리포트를 찾을 수 없음' });

        report.likes = (report.likes || 0) + 1;
        await report.save();

        res.json({ message: '추천 완료', likes: report.likes });
    } catch (err) {
        res.status(500).json({ message: '추천 실패', error: err.message });
    }
};

// 6. 민원 신고 시 정보 조회용
exports.getReportInfo = async (req, res) => {
    try {
        const { report_id } = req.params;
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
        res.status(500).json({ message: '신고 정보 조회 실패', error: err.message });
    }
};
