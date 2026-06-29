import React, { useState, useEffect } from "react";
import { fmtD } from "./utils";

// ── 공통 스타일 ────────────────────────────────
const tabStyle = {
    flex: 1, minWidth: "5rem", background: "none", border: "none",
    padding: "0.5rem 0.25rem", fontSize: "0.8125rem", fontWeight: "600",
    color: "#475569", cursor: "pointer", borderRadius: "6px", transition: "all 0.15s ease"
};
const activeTabStyle = { ...tabStyle, background: "#1e3a5f", color: "#fff" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", tableLayout: "fixed" };
const theadTrStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const theadStyle = { position: "sticky", top: 0, zIndex: 10 };
const thStyle = { padding: "0.45rem 0.4rem", fontWeight: "600", color: "#475569", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", background: "#f8fafc" };
const tbodyTrStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "0.45rem 0.4rem", color: "#334155", textAlign: "center", verticalAlign: "middle", overflow: "hidden", wordBreak: "break-word" };

// ── 모바일 감지 훅 ─────────────────────────────
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isMobile;
}

// ── 상태 배지 ──────────────────────────────────
export function renderStatusBadge(status) {
    switch (status) {
        case "ok": return <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>이상없음</span>;
        case "shortage": return <span style={{ background: "#fef3c7", color: "#b45309", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>재고부족</span>;
        case "neg": return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>마이너스</span>;
        case "prod_planned": return <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>생산예정</span>;
        case "completed": return <span style={{ background: "#e5e7eb", color: "#4b5563", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>선발행</span>;
        case "kce_scheduled": return <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>KCE입고예정</span>;
        case "skip": return <span style={{ color: "#cbd5e1", fontSize: "0.7rem" }}>-</span>;
        default: return <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" }}>미등록</span>;
    }
}

// ── 모바일 카드 (출하의뢰) ──────────────────────
function ShipCard({ item }) {
    const statusColor = {
        ok: { bg: "#f0fdf4", border: "#86efac" },
        shortage: { bg: "#fffbeb", border: "#fcd34d" },
        neg: { bg: "#fff1f2", border: "#fca5a5" },
        skip: { bg: "#f8fafc", border: "#e2e8f0" },
    }[item._status] || { bg: "#f8fafc", border: "#e2e8f0" };

    return (
        <div style={{
            background: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
            borderRadius: "10px", padding: "0.875rem",
            marginBottom: "0.625rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}>
            {/* 상단: 납기일 + 상태 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>📅 {item.납기일자 || "-"}</span>
                {renderStatusBadge(item._status)}
            </div>

            {/* 거래처 + 담당자 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.375rem" }}>
                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1e3a5f" }}>{item.거래처명}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem", whiteSpace: "nowrap" }}>{item.담당자}</span>
            </div>

            {/* 품목명 + 품번 */}
            <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>{item.품목명}</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>{item.품목번호}</div>
            </div>

            {/* 재고 정보 그리드 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.375rem", background: "rgba(255,255,255,0.7)", borderRadius: "6px", padding: "0.5rem" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "2px" }}>수량</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1e3a5f" }}>{item.수량}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "2px" }}>현재고</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>{item._currentInvQty ?? "-"}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#2563eb", marginBottom: "2px" }}>생산예정</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: item._incomingProd > 0 ? "#2563eb" : "#94a3b8" }}>
                        {item._incomingProd > 0 ? `+${item._incomingProd}` : "-"}
                    </div>
                    {item._incomingProd > 0 && item._prodDates?.length > 0 && (
                        <div style={{ fontSize: "0.6rem", color: "#60a5fa" }}>{item._prodDates.map(d => fmtD(d)).join(", ")}</div>
                    )}
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#1e40af", marginBottom: "2px" }}>KCE입고</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: item._kceIncoming > 0 ? "#1e40af" : "#94a3b8" }}>
                        {item._kceIncoming > 0 ? `+${item._kceIncoming}` : "-"}
                    </div>
                    {item._kceIncoming > 0 && item._kceDates?.length > 0 && (
                        <div style={{ fontSize: "0.6rem", color: "#3b82f6" }}>{item._kceDates.map(d => fmtD(d)).join(", ")}</div>
                    )}
                </div>
            </div>

            {/* 예상재고 + 비고 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.75rem" }}>
                    <span style={{ color: "#94a3b8" }}>예상재고 </span>
                    <span style={{ fontWeight: "700", color: item._projectedInvQty < 0 ? "#ef4444" : "#334155" }}>
                        {item._projectedInvQty ?? "-"}
                    </span>
                </div>
                {item._note && (
                    <span style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: "600" }}>{item._note}</span>
                )}
            </div>
        </div>
    );
}

// ── INPUT VIEW ─────────────────────────────────
export function InputView({
    setView, handleResetData, parseMsg,
    handleProdFile, prodData, prodFile,
    handleInvFile, invData, invFile,
    shipText, setShipText, handleShipParse,
    kceText, setKceText, handleKceParse, kceData
}) {
    return (
        <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#334155", margin: 0 }}>📂 데이터 입력 및 설정</h2>
                <button onClick={handleResetData} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}>
                    데이터 전체 초기화
                </button>
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>🏭 생산 데이터 업로드 (Excel)</h3>
                <input type="file" accept=".xlsx, .xls" onChange={(e) => { if (e.target.files[0]) handleProdFile(e.target.files[0]); }} />
                {prodFile && <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.5rem", fontWeight: "600" }}>✅ {prodFile} (총 {prodData?.length || 0}건)</p>}
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>📦 재고 데이터 업로드 (Excel)</h3>
                <input type="file" accept=".xlsx, .xls" onChange={(e) => { if (e.target.files[0]) handleInvFile(e.target.files[0]); }} />
                {invFile && <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.5rem", fontWeight: "600" }}>✅ {invFile} (총 {invData?.length || 0}건)</p>}
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>🚚 출하 의뢰 텍스트 붙여넣기</h3>
                <textarea value={shipText} onChange={(e) => setShipText(e.target.value)}
                    placeholder="ERP에서 복사한 출하 의뢰 텍스트를 붙여넣으세요..."
                    style={{ width: "100%", height: "120px", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8125rem", boxSizing: "border-box", fontFamily: "inherit" }} />
                <button onClick={handleShipParse} style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "6px", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer", marginTop: "0.75rem", width: "100%" }}>
                    데이터 파싱 및 출하 목록 적용
                </button>
                {parseMsg && <p style={{ fontSize: "0.8125rem", color: parseMsg.includes("✅") ? "#166534" : "#b91c1c", marginTop: "0.75rem", fontWeight: "600" }}>{parseMsg}</p>}
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.5rem", color: "#1e3a5f" }}>📥 KCE 입고일정 붙여넣기</h3>
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 0, marginBottom: "0.75rem" }}>
                    품번 / 발주수량 / 발주일 / 입고예정일 / 발주요청 순서로 붙여넣으세요.
                </p>
                <textarea value={kceText} onChange={(e) => setKceText(e.target.value)}
                    placeholder="KCE 입고일정 데이터를 붙여넣으세요..."
                    style={{ width: "100%", height: "120px", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8125rem", boxSizing: "border-box", fontFamily: "inherit" }} />
                <button onClick={handleKceParse} style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: "6px", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer", marginTop: "0.75rem", width: "100%" }}>
                    KCE 입고일정 적용
                </button>
                {kceData?.length > 0 && (
                    <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.5rem", fontWeight: "600" }}>
                        ✅ KCE {kceData.length}건 ({[...new Set(kceData.map(d => d.품번))].length}개 품번)
                    </p>
                )}
            </div>
        </div>
    );
}

// ── DASH VIEW ──────────────────────────────────
export function DashView({
    mainTab, setMainTab, prodStats, filterStatus, setFilterStatus, search, setSearch,
    sortDesc, setSortDesc, sortedShipDom, sortedShipOvs, sortedProd, prodSummaryData = [],
    dailySummaryData = [], allShipData = [], apiSaveMemo = null, initialMemos = null
}) {
    const isMobile = useIsMobile();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedProdDate, setSelectedProdDate] = useState(null);
    const [editingKey, setEditingKey] = useState(null);

    const [memos, setMemos] = useState(() => {
        if (initialMemos) return initialMemos;
        try { return JSON.parse(localStorage.getItem("wg_memos") || "{}"); } catch { return {}; }
    });

    const saveMemo = (key, value) => {
        const updated = { ...memos, [key]: value };
        setMemos(updated);
        localStorage.setItem("wg_memos", JSON.stringify(updated));
        if (apiSaveMemo) apiSaveMemo(key, value).catch(console.error);
    };

    let activeData = [];
    if (mainTab === "ship_dom") activeData = sortedShipDom;
    else if (mainTab === "ship_ovs") activeData = sortedShipOvs;
    else if (mainTab === "prod") activeData = sortedProd;

    return (
        <div style={{ padding: isMobile ? "0.375rem" : "0.5rem" }}>

            {/* 탭 메뉴 */}
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.625rem", background: "#fff", padding: "0.375rem", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
                <button style={mainTab === "ship_dom" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_dom")}>🚚 국내</button>
                <button style={mainTab === "ship_ovs" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_ovs")}>✈️ 해외</button>
                <button style={mainTab === "prod" ? activeTabStyle : tabStyle} onClick={() => setMainTab("prod")}>📋 생산</button>
                <button style={mainTab === "summary" ? activeTabStyle : tabStyle} onClick={() => setMainTab("summary")}>📅 요약</button>
            </div>

            {/* 검색/필터 */}
            {mainTab.includes("ship") && (
                <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.5rem", flexWrap: "wrap", background: "#fff", padding: "0.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <input
                        type="text"
                        placeholder="검색 (고객, 모델, 품번)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px", flex: 1, minWidth: "120px" }}
                    />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="all">전체</option>
                        <option value="ok">이상없음</option>
                        <option value="shortage">재고부족</option>
                    </select>
                    <button onClick={() => setSortDesc(!sortDesc)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {sortDesc ? "날짜▽" : "날짜△"}
                    </button>
                </div>
            )}

            {/* ── 모바일: 카드 레이아웃 ── */}
            {isMobile && mainTab.includes("ship") && (
                <div style={{ paddingBottom: "1rem" }}>
                    {activeData.length === 0
                        ? <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>데이터가 없습니다.</div>
                        : activeData.map((item, idx) => <ShipCard key={idx} item={item} />)
                    }
                </div>
            )}

            {/* ── 모바일: 날짜별 요약 카드 ── */}
            {isMobile && mainTab === "summary" && (
                <div style={{ paddingBottom: "1rem" }}>
                    {dailySummaryData.length === 0
                        ? <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>데이터가 없습니다.</div>
                        : dailySummaryData.map((item, idx) => {
                            const isOpen = selectedDate === item.납기일자;
                            const detailItems = isOpen
                                ? allShipData.filter(r => (r.납기일자 || "날짜미정") === item.납기일자)
                                    .sort((a, b) => (a.거래처명 || "").localeCompare(b.거래처명 || "", "ko"))
                                : [];
                            return (
                                <div key={idx}>
                                    <div onClick={() => setSelectedDate(isOpen ? null : item.납기일자)}
                                        style={{ background: isOpen ? "#1e3a5f" : "#fff", color: isOpen ? "#fff" : "#1e3a5f", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "0.375rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontWeight: "700" }}>
                                        <span>{isOpen ? "▼" : "▶"} {item.납기일자}</span>
                                        <span style={{ fontSize: "0.8rem", fontWeight: "500" }}>{item.건수}건 · {item.총수량?.toLocaleString()}개</span>
                                    </div>
                                    {isOpen && detailItems.map((d, di) => {
                                        const memoKey = d.출하의뢰번호 || `${d.거래처명}_${d.품목번호}_${d.납기일자}`;
                                        const memoVal = memos[memoKey] || "";
                                        return (
                                            <div key={di} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.375rem", marginLeft: "0.5rem" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                                    <span style={{ fontWeight: "700", fontSize: "0.875rem" }}>{d.거래처명}</span>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.담당자}</span>
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "0.25rem" }}>{d.품목명}</div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>{renderStatusBadge(d._status)}</div>
                                                    <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>수량 {d.수량}</span>
                                                </div>
                                                {memoVal && <div style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "#1d4ed8", fontWeight: "600" }}>📝 {memoVal}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {/* ── 모바일: 생산계획 카드 ── */}
            {isMobile && mainTab === "prod" && (
                <div style={{ paddingBottom: "1rem" }}>
                    {prodSummaryData.length === 0
                        ? <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>데이터가 없습니다.</div>
                        : prodSummaryData.map((item, idx) => {
                            const isOpen = selectedProdDate === item.생산계획일자;
                            const detailItems = isOpen ? sortedProd.filter(r => (r.생산계획일자 || "날짜미정") === item.생산계획일자) : [];
                            return (
                                <div key={idx}>
                                    <div onClick={() => setSelectedProdDate(isOpen ? null : item.생산계획일자)}
                                        style={{ background: isOpen ? "#0284c7" : "#fff", color: isOpen ? "#fff" : "#0284c7", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "0.375rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontWeight: "700" }}>
                                        <span>{isOpen ? "▼" : "▶"} {item.생산계획일자}</span>
                                        <span style={{ fontSize: "0.8rem", fontWeight: "500" }}>{item.건수}건 · {item.총수량?.toLocaleString()}개</span>
                                    </div>
                                    {isOpen && detailItems.map((d, di) => (
                                        <div key={di} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.375rem", marginLeft: "0.5rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                                <span style={{ fontWeight: "700", fontSize: "0.875rem" }}>{d.고객명}</span>
                                                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#0284c7" }}>{d.수량}개</span>
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "#334155" }}>{d.모델명}</div>
                                            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>{d.제품코드}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {/* ── PC: 테이블 레이아웃 ── */}
            {!isMobile && (
                <div className="swipe-menu" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", width: "100%", overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 200px)", WebkitOverflowScrolling: "touch" }}>
                    <table style={tableStyle}>
                        <thead style={theadStyle}>
                            <tr style={theadTrStyle}>
                                {mainTab.includes("ship") && (<>
                                    <th style={{ ...thStyle, width: "6%" }}>납기일자</th>
                                    <th style={{ ...thStyle, width: "12%" }}>의뢰처명</th>
                                    <th style={{ ...thStyle, width: "18%", textAlign: "left", paddingLeft: "0.5rem" }}>품목명</th>
                                    <th style={{ ...thStyle, width: "5%" }}>수량</th>
                                    <th style={{ ...thStyle, width: "5%" }}>현재고</th>
                                    <th style={{ ...thStyle, width: "7%" }}>생산예정</th>
                                    <th style={{ ...thStyle, width: "7%", color: "#1e40af" }}>KCE 입고</th>
                                    <th style={{ ...thStyle, width: "8%" }}>예상재고</th>
                                    <th style={{ ...thStyle, width: "7%" }}>상태</th>
                                    <th style={{ ...thStyle, width: "10%" }}>의뢰번호</th>
                                    <th style={{ ...thStyle, width: "5%" }}>담당</th>
                                    <th style={{ ...thStyle, width: "10%", textAlign: "left", paddingLeft: "0.5rem" }}>비고</th>
                                </>)}
                                {mainTab === "prod" && (<>
                                    <th style={{ ...thStyle, width: "15%" }}>계획일자</th>
                                    <th style={{ ...thStyle, width: "10%" }}>건수</th>
                                    <th style={{ ...thStyle, width: "15%" }}>총 수량</th>
                                </>)}
                                {mainTab === "summary" && (<>
                                    <th style={thStyle}>납기일자</th>
                                    <th style={thStyle}>출하 건수</th>
                                    <th style={thStyle}>총 출하수량</th>
                                </>)}
                            </tr>
                        </thead>
                        <tbody>
                            {/* 출하 탭 */}
                            {mainTab.includes("ship") && activeData.map((item, idx) => (
                                <tr key={idx} style={tbodyTrStyle}>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.7rem", color: "#64748b" }}>{fmtD(item.납기일자)}</td>
                                    <td style={{ ...tdStyle, fontWeight: "600", textAlign: "left", paddingLeft: "0.5rem", wordBreak: "keep-all" }}>{item.거래처명}</td>
                                    <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem" }}>
                                        <div style={{ fontWeight: "600", wordBreak: "break-all" }}>{item.품목명}</div>
                                        <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px", wordBreak: "break-all" }}>{item.품목번호}</div>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: "600", whiteSpace: "nowrap" }}>{item.수량}</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item._currentInvQty ?? "-"}</td>
                                    <td style={{ ...tdStyle, color: item._incomingProd > 0 ? "#2563eb" : "#94a3b8" }}>
                                        <div style={{ whiteSpace: "nowrap" }}>
                                            {item._incomingProd > 0 ? `+${item._incomingProd}` : "-"}
                                            {item._incomingProd > 0 && item._prodDates?.length > 0 && (
                                                <div style={{ fontSize: "0.6rem", color: "#60a5fa", marginTop: "1px" }}>
                                                    {item._prodDates.map(d => fmtD(d)).join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, color: item._kceIncoming > 0 ? "#1e40af" : "#94a3b8" }}>
                                        <div style={{ whiteSpace: "nowrap" }}>
                                            {item._kceIncoming > 0 ? (
                                                <>
                                                    <span style={{ fontWeight: "700", color: "#1e40af" }}>+{item._kceIncoming}</span>
                                                    {item._kceDates?.length > 0 && (
                                                        <div style={{ fontSize: "0.6rem", color: "#3b82f6", marginTop: "1px" }}>
                                                            {item._kceDates.map(d => fmtD(d)).join(", ")}
                                                        </div>
                                                    )}
                                                </>
                                            ) : "-"}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: "700", color: item._projectedInvQty < 0 ? "#ef4444" : "#334155" }}>
                                        <div style={{ whiteSpace: "nowrap" }}>{item._projectedInvQty ?? "-"}</div>
                                    </td>
                                    <td style={tdStyle}>{renderStatusBadge(item._status)}</td>
                                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.65rem", wordBreak: "break-all" }}>{item.출하의뢰번호}</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.담당자}</td>
                                    <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem", fontSize: "0.7rem" }}>
                                        {item._note
                                            ? <span style={{ color: "#d97706", fontWeight: "600", wordBreak: "keep-all" }}>{item._note}</span>
                                            : <span style={{ color: "#cbd5e1" }}>-</span>}
                                    </td>
                                </tr>
                            ))}

                            {/* 생산계획 탭 */}
                            {mainTab === "prod" && prodSummaryData.map((item, idx) => {
                                const isOpen = selectedProdDate === item.생산계획일자;
                                const detailItems = isOpen ? sortedProd.filter(r => (r.생산계획일자 || "날짜미정") === item.생산계획일자) : [];
                                return (
                                    <React.Fragment key={idx}>
                                        <tr style={{ ...tbodyTrStyle, cursor: "pointer", background: isOpen ? "#f0f9ff" : undefined }}
                                            onClick={() => setSelectedProdDate(isOpen ? null : item.생산계획일자)}>
                                            <td style={{ ...tdStyle, fontWeight: "600", color: "#0ea5e9", whiteSpace: "nowrap" }}>
                                                {isOpen ? "▼" : "▶"} {item.생산계획일자}
                                            </td>
                                            <td style={tdStyle}>{item.건수}건</td>
                                            <td style={{ ...tdStyle, fontWeight: "700" }}>{item.총수량?.toLocaleString()}</td>
                                        </tr>
                                        {isOpen && (
                                            <tr>
                                                <td colSpan="3" style={{ padding: 0, background: "#f8fafc" }}>
                                                    <table style={{ ...tableStyle, tableLayout: "fixed" }}>
                                                        <thead>
                                                            <tr style={{ background: "#eef2f7" }}>
                                                                <th style={{ ...thStyle, width: "20%", textAlign: "left", paddingLeft: "0.75rem" }}>출하일자</th>
                                                                <th style={{ ...thStyle, width: "25%", textAlign: "left", paddingLeft: "0.5rem" }}>고객명</th>
                                                                <th style={{ ...thStyle, width: "40%", textAlign: "left", paddingLeft: "0.5rem" }}>모델명</th>
                                                                <th style={{ ...thStyle, width: "15%" }}>수량</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {detailItems.map((d, di) => (
                                                                <tr key={di} style={tbodyTrStyle}>
                                                                    <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.75rem", fontSize: "0.7rem", color: "#64748b", whiteSpace: "nowrap" }}>{fmtD(d.출하일자) || "-"}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem", wordBreak: "keep-all" }}>{d.고객명}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem" }}>
                                                                        <div style={{ fontWeight: "600" }}>{d.모델명}</div>
                                                                        <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px" }}>{d.제품코드}</div>
                                                                    </td>
                                                                    <td style={{ ...tdStyle, fontWeight: "600" }}>{d.수량}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {/* 날짜별 요약 탭 */}
                            {mainTab === "summary" && dailySummaryData.map((item, idx) => {
                                const isOpen = selectedDate === item.납기일자;
                                const detailItems = isOpen
                                    ? allShipData.filter(r => (r.납기일자 || "날짜미정") === item.납기일자)
                                        .sort((a, b) => (a.거래처명 || "").localeCompare(b.거래처명 || "", "ko"))
                                    : [];
                                return (
                                    <React.Fragment key={idx}>
                                        <tr style={{ ...tbodyTrStyle, cursor: "pointer", background: isOpen ? "#f0f9ff" : undefined }}
                                            onClick={() => setSelectedDate(isOpen ? null : item.납기일자)}>
                                            <td style={{ ...tdStyle, fontWeight: "600", color: "#0ea5e9" }}>
                                                {isOpen ? "▼" : "▶"} {item.납기일자}
                                            </td>
                                            <td style={tdStyle}>{item.건수}건</td>
                                            <td style={{ ...tdStyle, fontWeight: "700" }}>{item.총수량?.toLocaleString()}</td>
                                        </tr>
                                        {isOpen && (
                                            <tr>
                                                <td colSpan="3" style={{ padding: 0, background: "#f8fafc" }}>
                                                    <table style={{ ...tableStyle, width: "100%" }}>
                                                        <thead>
                                                            <tr style={{ background: "#eef2f7" }}>
                                                                <th style={thStyle}>거래처명</th>
                                                                <th style={{ ...thStyle, width: "22%" }}>품목명</th>
                                                                <th style={thStyle}>수량</th>
                                                                <th style={thStyle}>담당</th>
                                                                <th style={thStyle}>상태</th>
                                                                <th style={{ ...thStyle, width: "22%", textAlign: "left", paddingLeft: "0.5rem" }}>메모</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {detailItems.map((d, di) => {
                                                                const memoKey = d.출하의뢰번호 || `${d.거래처명}_${d.품목번호}_${d.납기일자}`;
                                                                const isEditing = editingKey === memoKey;
                                                                const memoVal = memos[memoKey] || "";
                                                                const displayStatus = (d._note && memoVal) ? "kce_scheduled" : d._status;
                                                                const rowBg = (d._note && memoVal) ? "#f5f3ff" : d._status === "shortage" ? "#fffbeb" : undefined;
                                                                return (
                                                                    <tr key={di} style={{ ...tbodyTrStyle, background: rowBg }}>
                                                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{d.거래처명}</td>
                                                                        <td style={{ ...tdStyle, textAlign: "left" }}>
                                                                            <div style={{ fontWeight: "600" }}>{d.품목명}</div>
                                                                            <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: "2px" }}>{d.규격}</div>
                                                                        </td>
                                                                        <td style={tdStyle}>{d.수량}</td>
                                                                        <td style={tdStyle}>{d.담당자}</td>
                                                                        <td style={tdStyle}>{renderStatusBadge(displayStatus)}</td>
                                                                        <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.4rem" }}>
                                                                            {isEditing ? (
                                                                                <input autoFocus defaultValue={memoVal}
                                                                                    onKeyDown={e => {
                                                                                        if (e.key === "Enter") { saveMemo(memoKey, e.target.value); setEditingKey(null); }
                                                                                        if (e.key === "Escape") setEditingKey(null);
                                                                                    }}
                                                                                    onBlur={e => { saveMemo(memoKey, e.target.value); setEditingKey(null); }}
                                                                                    placeholder="예: 6/21 생산완료"
                                                                                    style={{ width: "100%", fontSize: "0.75rem", padding: "3px 6px", border: "1px solid #93c5fd", borderRadius: "4px", outline: "none", boxSizing: "border-box" }}
                                                                                />
                                                                            ) : (
                                                                                <div onClick={() => setEditingKey(memoKey)}
                                                                                    style={{ cursor: "pointer", minHeight: "22px", padding: "2px 6px", borderRadius: "4px", border: "1px dashed transparent" }}
                                                                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#93c5fd"}
                                                                                    onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
                                                                                    {memoVal
                                                                                        ? <span style={{ fontSize: "0.75rem", color: "#1d4ed8", fontWeight: "600" }}>{memoVal}</span>
                                                                                        : <span style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>클릭하여 입력</span>}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {detailItems.length === 0 && (
                                                                <tr><td colSpan="6" style={{ padding: "1rem", textAlign: "center", color: "#94a3b8" }}>데이터가 없습니다.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {/* 빈 데이터 */}
                            {((mainTab.includes("ship") && activeData.length === 0) ||
                                (mainTab === "summary" && dailySummaryData.length === 0) ||
                                (mainTab === "prod" && prodSummaryData.length === 0)) && (
                                    <tr><td colSpan="12" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>데이터가 없습니다.</td></tr>
                                )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}