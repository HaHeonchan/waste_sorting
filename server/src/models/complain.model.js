const fs = require('fs');
const path = require('path');

const REPORTS_FILE = path.join(__dirname, '../data/trash.json');

// 데이터 읽기
function readReports() {
    try {
        if (!fs.existsSync(REPORTS_FILE)) return [];
        const data = fs.readFileSync(REPORTS_FILE, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('파일 읽기 오류:', err);
        return [];
    }
}

// 데이터 쓰기
function writeReports(reports) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

// 새 report_id 생성
function getNextReportId() {
    const reports = readReports();
    if (reports.length === 0) return 1;
    return Math.max(...reports.map(r => r.report_id)) + 1;
}

module.exports = {
    readReports,
    writeReports,
    getNextReportId
};