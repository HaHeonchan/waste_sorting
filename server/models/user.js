const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, // 나중엔 암호화해서 저장 추천!
});

module.exports = mongoose.model("User", userSchema);
