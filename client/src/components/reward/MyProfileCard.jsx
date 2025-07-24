import React from "react";

function MyProfileCard({ user }) {
  return (
    <div
      style={{
        background: "linear-gradient(90deg,#1896f7 0%,#1683db 100%)",
        borderRadius: "20px",
        padding: "20px 400px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        minHeight: 110,
        color: "#fff",
        boxShadow: "0 2px 14px 0 rgba(22, 147, 218, 0.07)",
        maxWidth: 760,
        margin: "0 auto 34px auto",
        justifyContent: "space-between"
      }}
    >
      {/* 왼쪽 아이콘 + 프로필 정보 */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.13)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 24,
            fontSize: 32
          }}
        >
          {/* 분리배출 아이콘, SVG나 이모지 대체 가능 */}
          ♻️
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 21, marginBottom: 2 }}>
            {user.name || "익명"}
          </div>
          <div style={{ fontSize: 15, marginBottom: 2 }}>
            가입일: {user.joinedDate || "2025. 7. 24."}
          </div>
          <div style={{ fontSize: 15 }}>
            레벨: {user.level || "환경 전문가 (Lv.1)"}
          </div>
        </div>
      </div>
      {/* 오른쪽: 포인트 */}
      <div style={{ textAlign: "right", minWidth: 90 }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -2 }}>
          {user.points ?? 0} <span style={{ fontSize: 18, fontWeight: 400 }}>P</span>
        </div>
        <div style={{ fontSize: 13, color: "#e3f2fd" }}>보유 포인트</div>
      </div>
    </div>
  );
}

export default MyProfileCard;