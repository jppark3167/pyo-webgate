// HomeView.jsx: 로그인 후 출하 대시보드 / 출하 도우미로 분기하는 랜딩 화면
const cards = [
    { key: "dashboard", title: "출하 대시보드", desc: "재고·납기 현황 확인" },
    { key: "helper", title: "출하 도우미", desc: "퀵 리스트 확인 · 양식 맞춰 생성" },
];

const cardStyle = {
    background: "#4472C4",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    width: 320,
    height: 180,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    boxShadow: "0 4px 14px rgba(30,58,95,.18)",
    fontFamily: "inherit",
};

export function HomeView({ onSelect, onLogout }) {
    return (
        <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Pretendard','Malgun Gothic',sans-serif", display: "flex", flexDirection: "column" }}>
            {/* 상단 바 */}
            <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🏭</span>
                    <div className="header-title" style={{ fontWeight: 700, fontSize: 15 }}>출하 일정관리</div>
                </div>
                <button
                    className="header-btn"
                    onClick={onLogout}
                    style={{ background: "transparent", color: "#cbd5e1", border: "1px solid #ffffff33", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                    로그아웃
                </button>
            </div>

            {/* 분기 카드 */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div className="home-cards" style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 760 }}>
                    {cards.map(c => (
                        <button key={c.key} className="home-card" style={cardStyle} onClick={() => onSelect(c.key)}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{c.title}</div>
                            {c.desc && <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{c.desc}</div>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
