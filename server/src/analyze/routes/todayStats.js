// server/src/analyze/routes/todayStats.js
const express = require('express');
const mongoose = require('mongoose');
const guides = require('../data/waste-disposal-guides.json');

const router = express.Router();

/** 카테고리별 CO₂ 계수(kg/건) — 필요 시 .env 로 덮어쓰기 */
const CO2_FACTORS = {
  '무색페트': Number(process.env.CO2_CLEAR_PET ?? 0.07),
  '플라스틱': Number(process.env.CO2_PLASTIC   ?? 0.08),
  '비닐류'  : Number(process.env.CO2_VINYL     ?? 0.03),
  '종이'    : Number(process.env.CO2_PAPER     ?? 0.04),
  '일반팩'  : Number(process.env.CO2_PACK      ?? 0.03),
  '멸균팩'  : Number(process.env.CO2_ASEPTIC   ?? 0.035),
  '캔류'    : Number(process.env.CO2_CAN       ?? 0.05),
  '유리'    : Number(process.env.CO2_GLASS     ?? 0.02),
  '기타'    : Number(process.env.CO2_ETC       ?? 0),
};
const VALID_CATS = new Set(Object.keys(CO2_FACTORS));

/** 문자열 정규화 */
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\/_,.\-]/g, '')
    .replace(/알미늄/g, '알루미늄');

/** disposalGuides 사전 */
const buildDict = () => {
  const dict = new Map();
  const items = guides?.disposalGuides?.['재활용품'] || {};
  for (const key of Object.keys(items)) {
    const it = items[key];
    const cat = it?.category || '기타';
    const tokens = new Set([
      it?.itemNameKor, it?.subType, it?.category,
      ...(it?.recyclingMarks || []),
      ...(it?.keywords || []),
      key,
    ].filter(Boolean));
    for (const t of tokens) dict.set(norm(t), cat);
  }
  // 추가 룰
  dict.set(norm('캔'), '캔류');
  dict.set(norm('철캔'), '캔류');
  dict.set(norm('알루미늄 캔'), '캔류');
  dict.set(norm('음료수캔'), '캔류');
  dict.set(norm('맥주캔'), '캔류');
  dict.set(norm('유리병'), '유리');
  dict.set(norm('병'), '유리');
  dict.set(norm('와인병'), '유리');
  dict.set(norm('종이팩'), '일반팩');
  dict.set(norm('우유팩'), '일반팩');
  dict.set(norm('멸균팩'), '멸균팩');
  dict.set(norm('테트라팩'), '멸균팩');
  dict.set(norm('투명페트병'), '무색페트');
  dict.set(norm('무색페트병'), '무색페트');
  dict.set(norm('생수병'), '무색페트');
  dict.set(norm('페트병'), '무색페트');
  return dict;
};
const LABEL_DICT = buildDict();

/** 후보 라벨 추출 */
const extractLabels = (doc) =>
  [
    doc?.predictedLabel,
    doc?.topPrediction?.label,
    doc?.label,
    doc?.category,
    doc?.type,
    doc?.kind,
    doc?.result?.predictedLabel,
    doc?.result?.label,
    doc?.result?.category,
    doc?.details?.category,
    doc?.details?.type,
    doc?.meta?.category,
    doc?.analysis?.category,
    // 한글 키
    doc?.['종류'],
    doc?.['세부 분류'],
    doc?.['세부분류'],
    doc?.['분류'],
    // 모델을 바꿨을 때를 대비해 조금 넉넉히
    doc?.analysisResult?.type,      // <-- 모델이 저장한 필드
    doc?.analysisResult?.detail,
  ].filter(Boolean);

/** 라벨 → 표준카테고리 */
const mapToCategory = (cands) => {
  for (const c of cands) {
    const n = norm(c);
    const hit = LABEL_DICT.get(n);
    if (hit && VALID_CATS.has(hit)) return hit;
  }
  const joined = norm(cands.join('|'));
  if (/캔/.test(joined)) return '캔류';
  if (/유리|유리병|병/.test(joined)) return '유리';
  if (/멸균|테트라/.test(joined)) return '멸균팩';
  if (/종이팩|우유팩/.test(joined)) return '일반팩';
  if (/비닐|랩|봉투|포장비닐/.test(joined)) return '비닐류';
  if (/페트|pet/.test(joined)) return '무색페트';
  if (/플라스틱|pp|ps|hdpe|ldpe|other/.test(joined)) return '플라스틱';
  return '기타';
};

const KST_MIN = 9 * 60;
const todayRangeKST = () => {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const kstNow = new Date(utc.getTime() + KST_MIN * 60000);
  const start = new Date(kstNow); start.setHours(0,0,0,0);
  const end   = new Date(kstNow); end.setHours(23,59,59,999);
  return { start, end };
};

router.get('/stats/today', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'DB_DISCONNECTED' });
    }

    const { start, end } = todayRangeKST();
    const colName = process.env.ANALYSIS_COLLECTION || 'analysisresults';
    const col = mongoose.connection.collection(colName);

    const docs = await col.find(
      { createdAt: { $gte: start, $lte: end } },
      { projection: {
          createdAt: 1,
          predictedLabel: 1, topPrediction: 1, label: 1, category: 1, type: 1, kind: 1,
          result: 1, details: 1, meta: 1, analysis: 1,
          '종류': 1, '세부 분류': 1, '세부분류': 1, '분류': 1,
          analysisResult: 1, // 새 모델 구조 대비
        } }
    ).toArray();

    const total = docs.length;
    const breakdown = {};
    const samples = []; // debug용

    for (const d of docs) {
      const cands = extractLabels(d);
      const cat = mapToCategory(cands);
      breakdown[cat] = (breakdown[cat] || 0) + 1;

      if (req.query.debug) {
        samples.push({
          id: String(d._id).slice(-12),
          picked: cat,
          type: d?.analysisResult?.type || d?.type || d?.category || '',
          detail: d?.analysisResult?.detail || d?.['세부 분류'] || '',
          labels: cands.slice(0, 5),
        });
      }
    }

    const etc = breakdown['기타'] || 0;
    const accuracyPercent = total ? Math.round(((total - etc) / total) * 1000) / 10 : 0;

    // === 핵심: g 단위로 합산하여 소수 손실/반올림 문제 제거 ===
    let co2Grams = 0; // 정수 g
    for (const [cat, cnt] of Object.entries(breakdown)) {
      const kgPerItem = CO2_FACTORS[cat] || 0; // kg/개
      co2Grams += Math.round(kgPerItem * 1000) * cnt; // g/개 × 개수
    }
    const co2TodayKg = co2Grams / 1000; // kg (반올림하지 않음)

    const payload = {
      totalAnalyses: total,
      accuracyPercent,
      co2TodayKg: Math.round(co2TodayKg * 1000) / 1000, // 최대 소수 3자리까지
      breakdown,
    };

    if (req.query.debug) payload.samples = samples;
    // 원하면 grams도 주기
    if (req.query.debug) payload.co2TodayGrams = co2Grams;

    res.json(payload);
  } catch (e) {
    console.error('today stats error:', e);
    res.status(500).json({ error: 'FAILED_TODAY_STATS', message: e.message });
  }
});

module.exports = router;
