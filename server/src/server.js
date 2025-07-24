const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 4000;
app.use(cors());
app.use(express.json());


mongoose.connect('mongodb://localhost:27017/testdb' , { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("몽고DB 연결 성공!"))
  .catch(err => console.log("몽고DB 연결 실패:", err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  points: Number,
  recycleCountL: Number,
  reportCount:Number,
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
const Reward = mongoose.model('Reward',rewardSchema);

app.get('/api/user/me', async (req, res) => {
  const user = await User.findOne({ email: "junsu5072@daum.net"});
  res.json(user);
});

app.get('/api/reward/list', async (req, res) => {
  const { email } = req.query;
  const rewards = await Reward.find(email ? { userEmail: email } : {});
  res.json(rewards);
});

app.post('/api/reward/exchange', async (req, res) => {
  const { userEmail, item, point } = req.body;
  const user = await User.findOne({email : userEmail});

  if (!user) return res.json({ ok: false, msg: "유저를 찾을 수 없음" });

  if (user.points < point) return res.json({ ok: false, msg: "포인트 부족" });  // 이 부분은 굳이 필요한가 싶음 어차피 포인트가 부족하면 교환요청이 안뜰텐데

  const already = await Reward.findOne({ userEmail, item, received: true });  // 이 부분도. 교환 요청에서 수령 완료로 변했을텐데 굳이?
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


  res.json({ ok: true, newPoints : user.points });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
