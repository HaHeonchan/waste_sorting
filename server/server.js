const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const PORT = 4000;
const authMiddleware = require('./middlewares/auth');
const dotenv = require('dotenv');

require('dotenv').config();


app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/testdb' , { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("몽고DB 연결 성공!"))
  .catch(err => console.log("몽고DB 연결 실패:", err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  points: Number,
  recycleCount: Number,
  reportCount: Number,
});
const rewardSchema = new mongoose.Schema({
  userEmail: String,
  date: String,
  item: String,
  point: Number,
  desc: String,
  received: Boolean
});
const User = mongoose.model('User', userSchema);
const Reward = mongoose.model('Reward', rewardSchema);

app.use('/api/auth', require('./routes/auth'));

app.get('/api/user/info', authMiddleware, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

app.get('/api/reward/list', authMiddleware, async (req, res) => {
  const rewards = await Reward.find({ userEmail: req.user.email }).sort({ date: -1 });
  res.json(rewards);
});

app.post('/api/reward/exchange', authMiddleware, async (req, res) => {
  const { item, point } = req.body;
  const userEmail = req.user.email; 
  const user = await User.findOne({ email: userEmail });
  if (!user) return res.json({ ok: false, msg: "유저를 찾을 수 없음" });
  if (user.points < point) return res.json({ ok: false, msg: "포인트 부족" });
  const already = await Reward.findOne({ userEmail, item, received: true });
  if (already) return res.json({ ok: false, msg: "이미 교환한 상품!" });
  user.points -= point;
  await user.save();
  await Reward.create({
    userEmail,
    item,
    point,
    date: new Date().toISOString().slice(0, 10),
    received: true,
  });
  res.json({ ok: true, newPoints: user.points });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
