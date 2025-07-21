const { readReports, writeReports, getNextReportId } = require('../models/complain.model');

// 1. 민원 목록 조회 (정렬 지원)
exports.listReports = (req, res) => {
    const { sort = 'date', order = 'desc' } = req.query;
    const all = readReports();

    const sorted = all.sort((a, b) => {
        if (sort === 'likes') {
            return order === 'asc' ? a.likes - b.likes : b.likes - a.likes;
        } else {
            return order === 'asc'
                ? new Date(a.created_at) - new Date(b.created_at)
                : new Date(b.created_at) - new Date(a.created_at);
        }
    });

    res.json(sorted);
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