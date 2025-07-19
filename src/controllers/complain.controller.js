const { readReports, writeReports, getNextReportId } = require('../models/complain.model');

// 1. 민원 목록 조회 (작성일자 desc)
exports.listReports = (req, res) => {
    const all = readReports();
    const list = all
      .filter(r => r.user_id === req.user.user_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(list);
};

// 2. 민원 작성
exports.createReport = (req, res) => {
    // 파일이 업로드된 경우
    let image_url = '';
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`; // 서버 정적 폴더에 접근
    } else {
        image_url = req.body.image_url || '';
    }
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '내용 필수' });

    const all = readReports();
    const newReport = { // 새 report_id 생성
        report_id: getNextReportId(),
        user_id: req.user.user_id,
        image_url,
        content,
        status: '대기',
        created_at: new Date().toISOString()
    };
    all.push(newReport);
    writeReports(all);
    res.status(201).json({ message: '등록 완료', report_id: newReport.report_id });
};

// 3. 민원 수정 (이미지 파일 업로드 포함)
exports.updateReport = (req, res) => {
  const { report_id } = req.params;
  const { content, status } = req.body;
  const all = readReports();
  const idx = all.findIndex(r => r.report_id == report_id && r.user_id === req.user.user_id);
  if (idx === -1) return res.status(404).json({ message: '수정할 민원 없음' });

  if (req.file) {// 파일이 업로드된 경우
    all[idx].image_url = '/uploads/' + req.file.filename;
  }
  if ('content' in req.body) all[idx].content = content;
  if ('status' in req.body) all[idx].status = status;
  writeReports(all);// 데이터 덮어쓰기
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
