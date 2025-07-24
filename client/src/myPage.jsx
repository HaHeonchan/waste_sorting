import React, { useEffect, useState } from "react";
import axios from "axios";
import MyProfileCard from "./components/reward/MyProfileCard";
import RewardExchange from "./components/reward/RewardExchange";

// 마이페이지 컴포넌트
// 유저 정보와 리워드 목록을 보여주고 교환 기능을 제공
function MyPage() {
  const [user, setUser] = useState(null);
  const [rewardList, setRewardList] = useState([]);

  // 마이페이지 로드 시 유저 정보 가져오기
  // 토큰을 이용해 서버에서 유저 정보를 가져옴
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
    window.location.href = "/login";
    return;
    }
    axios.get("http://localhost:4000/api/user/info", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })  
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("유저 정보 가져오기 실패:", err);
        setUser({
          name: "게스트",
          email: ""
        });
      });
  }, []);

  // 리워드 목록 가져오기
  // 유저 정보가 있을 때만 호출
  function fetchRewards() {
  if (!user?.email) return;
  const token = localStorage.getItem("token");
  axios.get(`http://localhost:4000/api/reward/list?email=${user.email}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => setRewardList(res.data));
}
  useEffect(() => {
    if (user) fetchRewards();
  }, [user]);

  // 리워드 교환 핸들러
 const handleExchange = (item) => {
  const token = localStorage.getItem("token");
  axios.post("http://localhost:4000/api/reward/exchange", {
    userEmail: user.email,
    item: item.name,
    point: item.point,
  }, {
    headers: { Authorization: `Bearer ${token}` }
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

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // 또는 useNavigate로 이동
  };
  
  if (!user) return <div>로딩중...</div>;

  return (
    <div className="mypage-wrapper">
      <div className="mypage-container">

        <button onClick={handleLogout}>로그아웃</button>

        {/* 마이페이지 헤더 */}
        <div className="mypage-title">마이페이지</div>
        <div className="mypage-sub">내 활동 기록과 통계를 확인해보세요</div>

        {/* 프로필 카드 */}
        <MyProfileCard user={user} />

        {/* 리워드 교환 내역/기능 */}
        <section className="mypage-section">
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
