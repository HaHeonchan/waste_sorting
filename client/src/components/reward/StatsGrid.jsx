import React from "react";

// 각각의 박스 컴포넌트
function StatCard({ icon, value, label, color, onClick, href }) {
  return (
    <a
      href={href}
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: "18px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        margin: "0 12px",
        minWidth: 150,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 500,
        fontSize: 19,
        textDecoration: "none",
        cursor: "pointer",
        transition: "box-shadow .15s",
        border: "2px solid transparent",
      }}
      onClick={onClick}
      target="_blank" // 새 탭에서 열고 싶으면 유지, 아니면 빼도 됨
      rel="noopener noreferrer"
    >
      <div style={{ fontSize: 38, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 16, color: "#888", marginTop: 3 }}>{label}</div>
    </a>
  );
}

// 통계 카드 4개를 한 줄에!
function StatsGrid({ stats }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      margin: "34px 0 32px 0"
    }}>
      {stats.map((stat, i) => (
        <StatCard
          key={i}
          {...stat}
        />
      ))}
    </div>
  );
}

export default StatsGrid;