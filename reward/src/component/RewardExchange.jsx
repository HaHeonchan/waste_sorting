import React, { useState } from "react";

// 상품 리스트
const rewards = [
  { name: "화장지", point: 500, image: "🧻" },
  { name: "커피 기프티콘", point: 1000, image: "☕" },
  { name: "편의점 상품권", point: 2000, image: "💳" },
  { name: "현금 환급", point: 5000, image: "💰" },
];

function RewardExchange({ userPoint, rewardList, onExchange }) {
  // rewardList 예시: [{item: "화장지", received: true}, ...]
  const exchanged = {};
  rewardList.forEach(r => {
    if (r.item && r.received) exchanged[r.item] = true;
  });

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>리워드 내역</h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16
      }}>
        {rewards.map((item) => {
          const canExchange = userPoint >= item.point;
          const isExchanged = exchanged[item.name];
          return (
            <div key={item.name}>
              <div style={{ fontSize: 32 }}>{item.image}</div>
              <div style={{ fontWeight: 500, margin: "8px 0 4px" }}>{item.name}</div>
              <div style={{ color: "#fcb900", fontWeight: 700, marginBottom: 8 }}>
                {item.point.toLocaleString()}P
              </div>
              <button
                onClick={() => !isExchanged && canExchange && onExchange(item)}
                disabled={!canExchange || isExchanged}
                style={{
                  width: "100%",
                  background: isExchanged ? "#eee" : (canExchange ? "#34c759" : "#eee"),
                  color: isExchanged ? "#34c759" : (canExchange ? "#fff" : "#aaa"),
                  border: isExchanged ? "1.5px solid #34c759" : "none",
                  fontWeight: 500,
                  borderRadius: 8,
                  padding: "7px 0",
                  cursor: isExchanged ? "default" : (canExchange ? "pointer" : "not-allowed"),
                  marginTop: 6
                }}
              >
                {isExchanged ? "수령 완료" : "교환하기"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RewardExchange;