import React from "react";

function MyProfileCard({ user }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: "12px",
        padding: "1rem 1.5rem",
        width: "250px",
        background: "#fafbfd",
        boxShadow: "0 2px 8px 0 rgba(100,120,150,0.04)",
        margin: "0 auto"
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: 5 }}>
        {user.name} <span style={{
          fontSize: "0.9rem",
          color: "#619bff",
          fontWeight: 500,
          marginLeft: 8,
          padding: "2px 8px",
          background: "#e9f1ff",
          borderRadius: "12px"
        }}>{user.grade || "일반"}</span>
      </div>
      <div style={{ color: "#888", fontSize: "0.95rem", marginBottom: 4 }}>
        {user.email}
      </div>
    </div>
  );
}

export default MyProfileCard;
