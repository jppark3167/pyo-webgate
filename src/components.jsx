import React, { useState } from "react";

// ==========================================
// 1. 공통 인라인 스타일 정의 (한눈에 보기 최적화)
// ==========================================
const tabStyle = {
    flex: 1,
    minWidth: "6rem",
    background: "none",
    border: "none",
    padding: "0.5rem 0.25rem",
    fontSize: "0.8125rem", // 약 13px
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.15s ease"
};

const activeTabStyle = {
    ...tabStyle,
    background: "#1e3a5f",
    color: "#fff"
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.75rem",
    tableLayout: "fixed"  // 💡 고정 레이아웃으로 컬럼 너비 제어
};

const theadTrStyle = {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
};

const thStyle = {
    padding: "0.45rem 0.4rem",
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden"
};

const tbodyTrStyle = {
    borderBottom: "1px solid #f1f5f9"
};

const tdStyle = {
    padding: "0.45rem 0.4rem",
    color: "#334155",
    textAlign: "center",
    verticalAlign: "middle",
    overflow: "hidden",
    wordBreak: "break-word"
};

// ==========================================
// 2. 상태 표시 배지 렌더링 헬퍼 함수
// ==========================================
export function renderStatusBadge(status) {
    switch (status) {
        case "ok":
            return <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>이상없음</span>;
        case "shortage":
            return <span style={{ background: "#fef3c7", color: "#b45309", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>재고부족</span>;
        case "neg":
            return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>마이너스</span>;
        case "prod_planned":
            return <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>생산예정</span>;
        case "completed":
            return <span style={{ background: "#e5e7eb", color: "#4b5563", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>선발행</span>;
        case "skip":
            return <span style={{ color: "#cbd5e1", fontSize: "0.7rem" }}>-</span>;
        default:
            return <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>미등록</span>;
    }
}

// ==========================================
// 3. INPUT VIEW (파일 업로드 및 텍스트 파싱)
// ==========================================
export function InputView({
    setView, handleResetData, parseMsg, handleProdFile, prodData, prodFile,
    handleInvFile, invData, invFile, shipText, setShipText, handleShipParse
}) {
    return (
        <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#334155", margin: 0 }}>📂 데이터 입력 및 설정</h2>
                <button
                    onClick={handleResetData}
                    style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}
                >
                    데이터 전체 초기화
                </button>
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>🏭 생산 데이터 업로드 (Excel)</h3>
                <input type="file" accept=".xlsx, .xls" onChange={(e) => { if (e.target.files[0]) handleProdFile(e.target.files[0]); }} />
                {prodFile && <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.5rem", fontWeight: "600" }}>✅ 현재 적용된 파일: {prodFile} (총 {prodData?.length || 0}건)</p>}
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>📦 재고 데이터 업로드 (Excel)</h3>
                <input type="file" accept=".xlsx, .xls" onChange={(e) => { if (e.target.files[0]) handleInvFile(e.target.files[0]); }} />
                {invFile && <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.5rem", fontWeight: "600" }}>✅ 현재 적용된 파일: {invFile} (총 {invData?.length || 0}건)</p>}
            </div>

            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>🚚 출하 의뢰 텍스트 붙여넣기</h3>
                <textarea
                    value={shipText}
                    onChange={(e) => setShipText(e.target.value)}
                    placeholder="ERP 등에서 복사한 출하 의뢰 텍스트 데이터를 이곳에 붙여넣으세요..."
                    style={{ width: "100%", height: "120px", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8125rem", boxSizing: "border-box", fontFamily: "inherit" }}
                />
                <button
                    onClick={handleShipParse}
                    style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "6px", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer", marginTop: "0.75rem", width: "100%" }}
                >
                    데이터 파싱 및 출하 목록 적용
                </button>
                {parseMsg && <p style={{ fontSize: "0.8125rem", color: parseMsg.includes("✅") ? "#166534" : "#b91c1c", marginTop: "0.75rem", fontWeight: "600" }}>{parseMsg}</p>}
            </div>
        </div>
    );
}

// ==========================================
// 4. DASH VIEW (메인 관리 화면 및 탭)
// ==========================================
export function DashView({
    mainTab, setMainTab, prodStats, filterStatus, setFilterStatus, search, setSearch,
    sortDesc, setSortDesc, sortedShipDom, sortedShipOvs, sortedProd, prodSummaryData = [],
    dailySummaryData = [], allShipData = []
}) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedProdDate, setSelectedProdDate] = useState(null);

    // 메모 상태: { [출하의뢰번호]: "메모 텍스트" }
    const [memos, setMemos] = useState(() => {
        try { return JSON.parse(localStorage.getItem('wg_memos') || '{}'); } catch { return {}; }
    });
    const [editingKey, setEditingKey] = useState(null); // 현재 편집 중인 의뢰번호

    const saveMemo = (key, value) => {
        const updated = { ...memos, [key]: value };
        setMemos(updated);
        localStorage.setItem('wg_memos', JSON.stringify(updated));
    };

    let activeData = [];
    if (mainTab === "ship_dom") activeData = sortedShipDom;
    else if (mainTab === "ship_ovs") activeData = sortedShipOvs;
    else if (mainTab === "prod") activeData = sortedProd;

    return (
        <div style={{ padding: "0.5rem" }}>
            {/* 탭 메뉴 */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap", background: "#fff", padding: "0.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <button style={mainTab === "ship_dom" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_dom")}>🚚 국내 출하의뢰</button>
                <button style={mainTab === "ship_ovs" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_ovs")}>✈️ 해외 출하의뢰</button>
                <button style={mainTab === "prod" ? activeTabStyle : tabStyle} onClick={() => setMainTab("prod")}>📋 생산계획 전체</button>
                <button style={mainTab === "summary" ? activeTabStyle : tabStyle} onClick={() => setMainTab("summary")}>📅 날짜별 요약</button>
            </div>

            {/* 검색 및 필터 */}
            {mainTab !== "summary" && mainTab !== "prod" && (
                <div style={{ flexShrink: 0, display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap", background: "#fff", padding: "0.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <input
                        type="text"
                        placeholder="검색어 입력 (고객, 모델, 품번 등)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px", flex: 1, minWidth: "150px" }}
                    />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="all">전체 상태</option>
                        <option value="ok">이상없음</option>
                        <option value="shortage">재고부족</option>
                        <option value="neg">마이너스</option>
                        <option value="completed">선발행</option>
                    </select>
                    <button onClick={() => setSortDesc(!sortDesc)} style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
                        날짜 {sortDesc ? "내림차순 ▽" : "오름차순 △"}
                    </button>
                </div>
            )}

            {/* 데이터 테이블 컨테이너 */}
            <div className="swipe-menu" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={tableStyle}>
                    <thead style={theadTrStyle}>
                        <tr>
                            {mainTab.includes("ship") && (
                                <>
                                    <th style={{ ...thStyle, width: "6%" }}>납기일자</th>
                                    <th style={{ ...thStyle, width: "12%" }}>의뢰처명</th>
                                    <th style={{ ...thStyle, width: "20%", textAlign: "left", paddingLeft: "0.5rem" }}>품목명</th>
                                    <th style={{ ...thStyle, width: "5%" }}>수량</th>
                                    <th style={{ ...thStyle, width: "6%" }}>현재고</th>
                                    <th style={{ ...thStyle, width: "8%" }}>생산예정</th>
                                    <th style={{ ...thStyle, width: "9%" }}>예상재고</th>
                                    <th style={{ ...thStyle, width: "7%" }}>상태</th>
                                    <th style={{ ...thStyle, width: "10%" }}>의뢰번호</th>
                                    <th style={{ ...thStyle, width: "5%" }}>담당</th>
                                    <th style={{ ...thStyle, width: "12%", textAlign: "left", paddingLeft: "0.5rem" }}>비고</th>
                                </>
                            )}
                            {mainTab === "prod" && (
                                <>
                                    <th style={{ ...thStyle, width: "15%" }}>계획일자</th>
                                    <th style={{ ...thStyle, width: "10%" }}>건수</th>
                                    <th style={{ ...thStyle, width: "15%" }}>총 수량</th>
                                </>
                            )}
                            {mainTab === "summary" && (
                                <>
                                    <th style={thStyle}>납기일자</th>
                                    <th style={thStyle}>출하 건수</th>
                                    <th style={thStyle}>총 출하수량</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {/* 출하 탭 렌더링 */}
                        {mainTab.includes("ship") && activeData.map((item, idx) => (
                            <tr key={idx} style={tbodyTrStyle}>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.7rem", color: "#64748b" }}>{item.납기일자}</td>
                                <td style={{ ...tdStyle, fontWeight: "600", textAlign: "left", paddingLeft: "0.5rem", wordBreak: "keep-all" }}>{item.거래처명}</td>
                                <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem" }}>
                                    <div style={{ fontWeight: "600", wordBreak: "break-all" }}>{item.품목명}</div>
                                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px", wordBreak: "break-all" }}>{item.품목번호}</div>
                                </td>
                                <td style={{ ...tdStyle, fontWeight: "600", whiteSpace: "nowrap" }}>{item.수량}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item._currentInvQty ?? "-"}</td>
                                <td style={{ ...tdStyle, color: item._incomingProd > 0 ? "#2563eb" : "#94a3b8" }}>
                                    <div style={{ whiteSpace: "nowrap" }}>{item._incomingProd > 0 ? `+${item._incomingProd}` : "-"}</div>
                                </td>
                                <td style={{ ...tdStyle, fontWeight: "700", color: item._projectedInvQty < 0 ? "#ef4444" : "#334155" }}>
                                    <div style={{ whiteSpace: "nowrap" }}>{item._projectedInvQty ?? "-"}</div>
                                </td>
                                <td style={{ ...tdStyle }}>{renderStatusBadge(item._status)}</td>
                                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.65rem", wordBreak: "break-all" }}>{item.출하의뢰번호}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.담당자}</td>
                                <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem", fontSize: "0.7rem" }}>
                                    {item._note ? <span style={{ color: "#d97706", fontWeight: "600", wordBreak: "keep-all" }}>{item._note}</span> : <span style={{ color: "#cbd5e1" }}>-</span>}
                                </td>
                            </tr>
                        ))}

                        {/* 📋 생산계획 이중탭 (Accordion) 렌더링 로직 */}
                        {mainTab === "prod" && prodSummaryData.map((item, idx) => {
                            const isOpen = selectedProdDate === item.생산계획일자;
                            const detailItems = isOpen
                                ? sortedProd.filter(r => (r.생산계획일자 || "날짜미정") === item.생산계획일자)
                                : [];

                            return (
                                <React.Fragment key={idx}>
                                    {/* 1단계: 계획일자별 행 */}
                                    <tr
                                        style={{ ...tbodyTrStyle, cursor: "pointer", background: isOpen ? "#f0f9ff" : undefined }}
                                        onClick={() => setSelectedProdDate(isOpen ? null : item.생산계획일자)}
                                    >
                                        <td style={{ ...tdStyle, fontWeight: "600", color: "#0ea5e9", whiteSpace: "nowrap" }}>
                                            {isOpen ? "▼" : "▶"} {item.생산계획일자}
                                        </td>
                                        <td style={tdStyle}>{item.건수}건</td>
                                        <td style={{ ...tdStyle, fontWeight: "700" }}>{item.총수량?.toLocaleString()}</td>
                                    </tr>

                                    {/* 2단계: 해당 날짜의 세부 목록 */}
                                    {isOpen && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: 0, background: "#f8fafc" }}>
                                                <table style={{ ...tableStyle, tableLayout: "fixed" }}>
                                                    <thead>
                                                        <tr style={{ background: "#eef2f7" }}>
                                                            <th style={{ ...thStyle, width: "35%", textAlign: "left", paddingLeft: "0.75rem" }}>모델명</th>
                                                            <th style={{ ...thStyle, width: "30%", textAlign: "left", paddingLeft: "0.5rem" }}>고객명</th>
                                                            <th style={{ ...thStyle, width: "15%" }}>수량</th>
                                                            <th style={{ ...thStyle, width: "20%" }}>출하일자</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailItems.map((d, di) => (
                                                            <tr key={di} style={tbodyTrStyle}>
                                                                <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.75rem" }}>
                                                                    <div style={{ fontWeight: "600" }}>{d.모델명}</div>
                                                                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px" }}>{d.제품코드}</div>
                                                                </td>
                                                                <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem", wordBreak: "keep-all" }}>{d.고객명}</td>
                                                                <td style={{ ...tdStyle, fontWeight: "600" }}>{d.수량}</td>
                                                                <td style={{ ...tdStyle, fontSize: "0.7rem", color: "#64748b" }}>{d.출하일자 || "-"}</td>
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

                        {/* 📅 날짜별 요약 (Summary) 렌더링 로직 */}
                        {mainTab === "summary" && dailySummaryData.map((item, idx) => {
                            const isOpen = selectedDate === item.납기일자;
                            const detailItems = isOpen
                                ? allShipData
                                    .filter(r => (r.납기일자 || "날짜미정") === item.납기일자)
                                    .sort((a, b) => (a.거래처명 || "").localeCompare(b.거래처명 || "", "ko"))
                                : [];

                            return (
                                <React.Fragment key={idx}>
                                    <tr
                                        style={{ ...tbodyTrStyle, cursor: "pointer", background: isOpen ? "#f0f9ff" : undefined }}
                                        onClick={() => setSelectedDate(isOpen ? null : item.납기일자)}
                                    >
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
                                                            <th style={{ ...thStyle, width: "22%" }}>품목명 / 규격</th>
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
                                                            return (
                                                                <tr key={di} style={{ ...tbodyTrStyle, background: d._status === "shortage" ? "#fffbeb" : undefined }}>
                                                                    <td style={{ ...tdStyle, fontWeight: "600" }}>{d.거래처명}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "left" }}>
                                                                        <div style={{ fontWeight: "600" }}>{d.품목명}</div>
                                                                        <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: "2px" }}>{d.규격}</div>
                                                                    </td>
                                                                    <td style={tdStyle}>{d.수량}</td>
                                                                    <td style={tdStyle}>{d.담당자}</td>
                                                                    <td style={tdStyle}>{renderStatusBadge(d._status)}</td>
                                                                    <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.4rem" }}>
                                                                        {isEditing ? (
                                                                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                                                <input
                                                                                    autoFocus
                                                                                    defaultValue={memoVal}
                                                                                    onKeyDown={e => {
                                                                                        if (e.key === "Enter") { saveMemo(memoKey, e.target.value); setEditingKey(null); }
                                                                                        if (e.key === "Escape") setEditingKey(null);
                                                                                    }}
                                                                                    onBlur={e => { saveMemo(memoKey, e.target.value); setEditingKey(null); }}
                                                                                    placeholder="예: 6/21 생산완료"
                                                                                    style={{ flex: 1, fontSize: "0.75rem", padding: "3px 6px", border: "1px solid #93c5fd", borderRadius: "4px", outline: "none", minWidth: 0 }}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                onClick={() => setEditingKey(memoKey)}
                                                                                style={{ cursor: "pointer", minHeight: "22px", padding: "2px 6px", borderRadius: "4px", border: "1px dashed transparent", transition: "border 0.15s" }}
                                                                                onMouseEnter={e => e.currentTarget.style.borderColor = "#93c5fd"}
                                                                                onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                                                                            >
                                                                                {memoVal
                                                                                    ? <span style={{ fontSize: "0.75rem", color: "#1d4ed8", fontWeight: "600" }}>{memoVal}</span>
                                                                                    : <span style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>클릭하여 입력</span>
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {detailItems.length === 0 && (
                                                            <tr>
                                                                <td colSpan="6" style={{ padding: "1rem", textAlign: "center", color: "#94a3b8" }}>해당 날짜 출하 데이터가 없습니다.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* 빈 데이터 상태 표시 */}
                        {((mainTab.includes("ship") && activeData.length === 0) ||
                            (mainTab === "summary" && dailySummaryData.length === 0) ||
                            (mainTab === "prod" && prodSummaryData.length === 0)) && (
                                <tr>
                                    <td colSpan="12" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                                        데이터가 없습니다.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}