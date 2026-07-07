// ModeSelect.jsx: 출하 업무 홈 화면 — 하위 기능(퀵 관리/출하 상태/일마감/재고 검색) 분기 카드
const MODE_CARDS = [
    { key: "quick", title: "퀵 관리", desc: "퀵 지정 · 조회 · 라벨 인쇄", emoji: "⚡", accent: "#4472C4", tint: "#eef2fc" },
    { key: "status", title: "출하 상태", desc: "출하 진행 상태 확인 · 변경", emoji: "🚦", accent: "#f59e0b", tint: "#fef3c7" },
    { key: "closeout", title: "일마감", desc: "출하 내역을 채팅방 공유 양식으로 변환", emoji: "📤", accent: "#059669", tint: "#d1fae5" },
    { key: "inv", title: "재고 검색", desc: "품번 · 품명으로 예상재고 조회", emoji: "📦", accent: "#0b7bad", tint: "#e5f5fc" },
];

export function ModeSelect({ onSelect, quickCount }) {
    return (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {MODE_CARDS.map(({ key, title, desc, emoji, accent, tint }) => (
                <button key={key} onClick={() => onSelect(key)} style={{
                    background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${accent}`,
                    borderRadius: 14, width: 230, height: 150, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
                    gap: 6, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,.06)", fontFamily: "inherit", textAlign: "left",
                }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>
                        {title}{key === "quick" && quickCount > 0 && <span style={{ marginLeft: 6, fontSize: "0.75rem", color: accent, fontWeight: 700 }}>· {quickCount}건</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{desc}</div>
                </button>
            ))}
        </div>
    );
}
