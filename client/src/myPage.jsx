import React, { useEffect, useState } from "react";
import axios from "axios";
import MyProfileCard from "./components/reward/MyProfileCard";
import RewardExchange from "./components/reward/RewardExchange";

function MyPage() {
  const [user, setUser] = useState(null);
  const [rewardList, setRewardList] = useState([]);

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    // window.location.href = "/login"; // 로그인 페이지로 보내기
    return;
  }
  axios.get("http://localhost:4000/api/user/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then((res) => setUser(res.data))
  .catch((err) => {
    // window.location.href = "/login";
  });
}, []);


  function fetchRewards() {
    axios.get(`http://localhost:4000/api/reward/list?email=${user.email}`)
      .then(res => setRewardList(res.data));
  }

  useEffect(() => {
    if (user) fetchRewards();
  }, [user]);

  // 리워드 교환 핸들러
  const handleExchange = (item) => {
    axios.post("http://localhost:4000/api/reward/exchange", {
      userEmail: user.email,
      item: item.name,
      point: item.point,
    })
      .then(res => {
        if (res.data.ok) {
          alert(`${item.name} 교환 완료!`);
          setUser((prev) => ({ ...prev, points: res.data.newPoints }));
          fetchRewards();
        } else {
          alert(res.data.msg);
        }
      });
  };

  if (!user) return <div>로딩중...</div>;

  return (
    <div
    style={{
      minHeight: "100vh",
      width: "208.9399999999vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f7f7f7"
    }}
  >
    <div style={{
      padding: "0 20px",
      width: "100%",
      maxWidth: 2000,
      minHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
    }}>
        {/* 마이페이지 헤더 */}
        <h2 style={{ fontWeight: 700, marginBottom: 8, fontSize: 40 }}>
          마이페이지
        </h2>
        <div style={{ color: "#666", fontSize: 16, marginBottom: 32 }}>
          내 활동 기록과 통계를 확인해보세요
        </div>

        {/* 프로필 카드 */}
        <MyProfileCard user={user} />

        {/* 리워드 교환 내역/기능 */}
        <section style={{ marginTop: 44 }}>
          <RewardExchange
            userPoint={user.points}
            rewardList={rewardList}
            onExchange={handleExchange}
          />
        </section>
      </div>
    </div>
  );
}

export default MyPage;
