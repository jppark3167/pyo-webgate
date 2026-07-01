// HomeView.jsx: 로그인 후 출하 대시보드 / 출하 업무로 분기하는 랜딩 화면
// 테마: WEBGATE CI — 메인 하늘색(PANTONE 306U) + 서브 네이비(Reflex Blue U)

const SKY = "#12A7E0";   // 메인컬러 (PANTONE 306U)
const NAVY = "#2A368C";  // 서브컬러 (PANTONE Reflex Blue U)

// 대시보드 아이콘 (막대 차트)
const IconDashboard = () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v17a1 1 0 0 0 1 1h17" />
        <rect x="7" y="12" width="3" height="5" rx="1" />
        <rect x="12" y="8" width="3" height="9" rx="1" />
        <rect x="17" y="5" width="3" height="12" rx="1" />
    </svg>
);

// 출하 업무 아이콘 (배송 트럭)
const IconTruck = () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h8A1.5 1.5 0 0 1 14 6.5V16H3z" />
        <path d="M14 9h3.6a1.5 1.5 0 0 1 1.2.6L21 12.5V16h-7z" />
        <circle cx="7" cy="18" r="1.7" />
        <circle cx="17" cy="18" r="1.7" />
    </svg>
);

const cards = [
    { key: "helper", title: "출하 업무", desc: "퀵 리스트 확인 · 양식 맞춰 생성", accent: SKY, tint: "#e5f5fc", Icon: IconTruck },
    { key: "dashboard", title: "출하 대시보드", desc: "재고·납기 현황 확인", accent: NAVY, tint: "#e8eaf5", Icon: IconDashboard },
];

const cardStyle = (accent) => ({
    position: "relative",
    background: "#fff",
    color: "#1e293b",
    border: "1px solid #e3e9f1",
    borderTop: `3px solid ${accent}`,
    borderRadius: 16,
    width: 300,
    height: 200,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    padding: "24px 26px",
    boxShadow: "0 4px 14px rgba(42,54,140,.08)",
    fontFamily: "inherit",
    textAlign: "left",
});

export function HomeView({ onSelect, onLogout }) {
    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#ffffff 0%,#eef7fb 100%)", fontFamily: "'Pretendard','Malgun Gothic',sans-serif", display: "flex", flexDirection: "column" }}>
            {/* 상단 바 — 서브 네이비 */}
            <div style={{ background: NAVY, color: "#fff", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="header-title" style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.06em", color: SKY }}>WEBGATE</span>
                    <span style={{ width: 1, height: 15, background: "#ffffff40" }} />
                    <span className="header-title" style={{ fontWeight: 600, fontSize: 14, color: "#dbe1f5" }}>출하 일정관리</span>
                </div>
                <button
                    className="header-btn"
                    onClick={onLogout}
                    style={{ background: "transparent", color: "#c7cef0", border: "1px solid #ffffff33", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                    로그아웃
                </button>
            </div>

            {/* 분기 영역 */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, color: NAVY, letterSpacing: "-0.02em" }}>어떤 작업을 하시겠어요?</div>
                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 6 }}>원하는 메뉴를 선택하세요</div>
                </div>

                <div className="home-cards" style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 700 }}>
                    {cards.map(({ key, title, desc, accent, tint, Icon }) => (
                        <button key={key} className="home-card" style={cardStyle(accent)} onClick={() => onSelect(key)}>
                            <div style={{ width: 54, height: 54, borderRadius: 14, background: tint, color: accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <Icon />
                            </div>
                            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{title}</div>
                            {desc && <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{desc}</div>}
                            <span style={{ position: "absolute", top: 20, right: 22, color: accent, fontSize: "1.1rem", fontWeight: 700 }}>→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
