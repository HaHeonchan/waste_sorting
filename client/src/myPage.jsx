import React, { useEffect, useState } from "react";
import axios from "axios";
import MyProfileCard from "./components/reward/MyProfileCard";
import RewardExchange from "./components//reward/RewardExchange";

function MyPage() {
  const [user, setUser] = useState(null);
  const [rewardList, setRewardList] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4000/api/user/me")
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err));
  }, []);

  function fetchRewards() {
    axios.get(`http://localhost:4000/api/reward/list?email=${user.email}`)
      .then(res => setRewardList(res.data));
  }

  useEffect(() => {
    if (user) fetchRewards();
  }, [user]);

  const handleExchange = (item) => {
    axios.post("http://localhost:4000/api/reward/exchange", {
      userEmail: user.email,
      item: item.name,
      point: item.point,
    })
      .then(res => {
        if (res.data.ok) {
          alert(`${item.name} 교환 완료!`);
          setUser((prev) => ({ ...prev, points: res.data.newPoints })); // 새 포인트 반영
          fetchRewards(); // 리워드 내역 갱신
        } else {
          alert(res.data.msg);
        }
      });
  };

  if (!user) return <div>로딩중...</div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100vh",
        background: "#fff"
      }}
    >
      <MyProfileCard user={user} />
      <RewardExchange
          userPoint={user.points}
          rewardList={rewardList}
           onExchange={handleExchange}
      />
      <div style={{
        textAlign: "center",
        marginTop: 24,
        fontSize: "1.05rem"
      }}>
        이름: {user.name} <br />
        이메일: {user.email} <br />
        누적 포인트: {user.points}P <br />
        분리배출 횟수: {user.recycleCountL ?? user.recycleCount}회 <br />
        민원 제보 횟수: {user.reportCount}건
      </div>
    </div>
  );
}

export default MyPage;
