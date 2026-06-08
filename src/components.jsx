import React from "react";

// ==========================================
// 1. 공통 인라인 스타일 정의
// ==========================================
const tabStyle = {
    flex: 1, minWidth: "100px", background: "none", border: "none",
    padding: "10px 4px", fontSize: "13px", fontWeight: "600",
    color: "#475569", cursor: "pointer", borderRadius: "6px", transition: "all 0.15s ease"
};

const activeTabStyle = {
    ...tabStyle, background: "#1e3a5f", color: "#fff"
};

const tableStyle = {
    width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "700px"
};

const theadTrStyle = {
    background: "#f8fafc", borderBottom: "2px solid #e2e8f0"
};

const thStyle = {
    padding: "10px 12px", fontWeight: "600", color: "#475569",
    textAlign: "center", whiteSpace: "nowrap"
};

const tbodyTrStyle = {
    borderBottom: "1px solid #f1f5f9"
};

const tdStyle = {
    padding: "12px", color: "#334155", textAlign: "center",
    verticalAlign: "middle",
    whiteSpace: "nowrap" // ✨ 납기일자 등 모든 데이터의 줄바꿈 방지
};

// ==========================================
// 2. 상태 표시 배지 렌더링 헬퍼 함수
// ==========================================
function renderStatusBadge(status) {
    switch (status) {
        case "ok":
            return <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>재고충족</span>;
        case "shortage":
            return <span style={{ background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>재고부족</span>;
        case "neg":
            return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>마이너스</span>;
        default:
            return <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>미등록</span>;
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
        <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#334155", margin: 0 }}>📂 데이터 입력 및 설정</h2>
                <button onClick={handleResetData} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    데이터 전체 초기화
                </button>
            </div>

            {/* 데이터 업로드 설정 영역 (기존 로직 유지) */}
            <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>출하의뢰 텍스트 붙여넣기 (엑셀 복사)</p>
                <textarea
                    value={shipText}
                    onChange={(e) => setShipText(e.target.value)}
                    placeholder="여기에 엑셀 데이터를 붙여넣으세요..."
                    style={{ width: "100%", height: "120px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "8px", fontFamily: "monospace", fontSize: "12px", boxSizing: "border-box" }}
                />
                <button onClick={handleShipParse} style={{ background: "#1e3a5f", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>데이터 파싱하기</button>
                {parseMsg && <p style={{ fontSize: "12px", color: "#b91c1c", marginTop: "8px", fontWeight: "600" }}>{parseMsg}</p>}
            </div>
        </div>
    );
}

// ==========================================
// 4. DASH VIEW (메인 관리 화면 및 탭)
// ==========================================
export function DashView({
    mainTab, setMainTab, prodStats, filterStatus, setFilterStatus, search, setSearch,
    sortDesc, setSortDesc, sortedShipDom, sortedShipOvs, sortedProd,
    filteredNegInv, negInvList, dailySummaryData = []
}) {

    // 현재 활성화된 탭에 따라 렌더링할 데이터 결정
    const activeData = mainTab === "ship_dom" ? sortedShipDom : (mainTab === "ship_ovs" ? sortedShipOvs : sortedProd);

    return (
        <div style={{ padding: "16px" }}>
            {/* 탭 메뉴 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", background: "#fff", padding: "8px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <button style={mainTab === "ship_dom" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_dom")}>🚚 국내 출하의뢰</button>
                <button style={mainTab === "ship_ovs" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_ovs")}>✈️ 해외 출하의뢰</button>
                <button style={mainTab === "prod" ? activeTabStyle : tabStyle} onClick={() => setMainTab("prod")}>📋 생산계획 전체</button>
                <button style={mainTab === "summary" ? activeTabStyle : tabStyle} onClick={() => setMainTab("summary")}>📅 날짜별 요약</button>
                <button style={mainTab === "neg" ? activeTabStyle : tabStyle} onClick={() => setMainTab("neg")}>⚠️ 마이너스 재고 ({negInvList.length})</button>
            </div>

            {/* 검색 및 필터 */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", background: "#fff", padding: "12px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <input
                    type="text"
                    placeholder="검색어 입력 (고객, 모델, 품번 등)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", flex: 1, minWidth: "200px" }}
                />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                    <option value="all">전체 상태</option>
                    <option value="ok">재고충족</option>
                    <option value="shortage">재고부족</option>
                    <option value="neg">마이너스</option>
                </select>
                <button onClick={() => setSortDesc(!sortDesc)} style={{ padding: "8px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}>
                    날짜 {sortDesc ? "내림차순 ▽" : "오름차순 △"}
                </button>
            </div>

            {/* 데이터 테이블 */}
            <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflowX: "auto" }}>
                <table style={tableStyle}>
                    <thead style={theadTrStyle}>
                        <tr>
                            {mainTab.includes("ship") && (
                                <>
                                    <th style={thStyle}>납기일자</th>
                                    <th style={thStyle}>의뢰처명</th>
                                    <th style={thStyle}>품목명 / 규격</th>
                                    <th style={thStyle}>의뢰수량</th>
                                    <th style={thStyle}>현재고</th>
                                    <th style={thStyle}>상태</th>
                                    <th style={thStyle}>의뢰번호</th>
                                    <th style={thStyle}>담당</th>
                                </>
                            )}
                            {mainTab === "prod" && (
                                <>
                                    <th style={thStyle}>생산계획일자</th>
                                    <th style={thStyle}>출하일자</th>
                                    <th style={thStyle}>고객명</th>
                                    <th style={thStyle}>모델명</th>
                                    <th style={thStyle}>제품코드</th>
                                    <th style={thStyle}>계획수량</th>
                                    <th style={thStyle}>현재고</th>
                                    <th style={thStyle}>상태</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {(mainTab.includes("ship") || mainTab === "prod") && activeData.map((item, idx) => (
                            <tr key={idx} style={tbodyTrStyle}>
                                {mainTab.includes("ship") && (
                                    <>
                                        <td style={tdStyle}>{item.납기일자}</td>
                                        <td style={tdStyle}>{item.거래처명}</td>

                                        {/* 품목명/규격은 내용이 길 수 있으므로 줄바꿈 허용 (whiteSpace: normal) */}
                                        <td style={{ ...tdStyle, textAlign: "left", whiteSpace: "normal" }}>
                                            <div style={{ fontWeight: "600" }}>{item.품목명}</div>
                                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{item.규격} ({item.품목번호})</div>
                                        </td>

                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.수량}</td>

                                        {/* ✨ 생산계획 연동 '가용 재고(ATP)' 동적 렌더링 로직 적용 */}
                                        <td style={tdStyle}>
                                            {item._incomingProd > 0 ? (
                                                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                                                    {item._projectedInvQty} (+{item._incomingProd})
                                                </span>
                                            ) : (
                                                <span>{item._projectedInvQty ?? item._currentInvQty ?? (item._inv?.재고수량 ?? 0)}</span>
                                            )}
                                        </td>

                                        <td style={tdStyle}>{renderStatusBadge(item._status)}</td>
                                        <td style={{ ...tdStyle, color: "#64748b", fontSize: "12px" }}>{item.출하의뢰번호}</td>
                                        <td style={tdStyle}>{item.담당자}</td>
                                    </>
                                )}
                                {mainTab === "prod" && (
                                    <>
                                        <td style={{ ...tdStyle, fontWeight: "600", color: "#0ea5e9" }}>{item.생산계획일자}</td>
                                        <td style={tdStyle}>{item.출하일자 || "-"}</td>
                                        <td style={tdStyle}>{item.고객명}</td>
                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.모델명}</td>
                                        <td style={{ ...tdStyle, color: "#64748b", fontSize: "12px" }}>{item.제품코드}</td>
                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.수량 || item.계획수량}</td>
                                        <td style={tdStyle}>{item._inv?.재고수량 ?? 0}</td>
                                        <td style={tdStyle}>{renderStatusBadge(item._status)}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {activeData.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
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