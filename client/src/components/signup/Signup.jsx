import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("http://localhost:4000/api/auth/signup", {
        name, email, password
      });
      alert("회원가입 성공! 로그인해주세요.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "회원가입 실패");
    }
  };

  return (
    <div className="signup-wrapper">
      <form onSubmit={handleSignup}>
        <h2>회원가입</h2>
        <input placeholder="이름" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        <input placeholder="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit">회원가입</button>
      </form>
    </div>
  );
};

export default Signup;