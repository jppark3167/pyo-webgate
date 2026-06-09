import React from "react";

// ==========================================
// 1. 공통 인라인 스타일 정의 (한눈에 보기 최적화)
// ==========================================
const tabStyle = {
    flex: 1,
    minWidth: "6rem",
    background: "none",
    border: "none",
    padding: "0.5rem 0.25rem",
    fontSize: "0.8125rem", // 약 13px (탭은 클릭하기 좋게 유지)
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
    fontSize: "0.75rem" // 약 12px로 축소하여 한 화면에 많은 데이터 수용
    // 💡 minWidth: "max-content" 삭제 -> 테이블이 화면 너비(100%)에 맞춰지도록 변경
};

const theadTrStyle = {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
};

const thStyle = {
    padding: "0.4rem 0.25rem", // 여백 대폭 축소
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    wordBreak: "keep-all" // 💡 한글 단어 단위로 자연스럽게 줄바꿈 허용 (whiteSpace: nowrap 삭제)
};

const tbodyTrStyle = {
    borderBottom: "1px solid #f1f5f9"
};

const tdStyle = {
    padding: "0.4rem 0.25rem", // 여백 대폭 축소
    color: "#334155",
    textAlign: "center",
    verticalAlign: "middle",
    wordBreak: "break-word" // 💡 긴 영어/숫자(품번 등)가 셀을 뚫고 나가지 않게 줄바꿈 허용
};

// ==========================================
// 2. 상태 표시 배지 렌더링 헬퍼 함수
// ==========================================
function renderStatusBadge(status) {
    switch (status) {
        case "ok":
            return <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>재고충족</span>;
        case "shortage":
            return <span style={{ background: "#fef3c7", color: "#b45309", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>재고부족</span>;
        case "neg":
            return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>마이너스</span>;
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
    sortDesc, setSortDesc, sortedShipDom, sortedShipOvs, sortedProd,
    filteredNegInv, negInvList, dailySummaryData = []
}) {

    let activeData = [];
    if (mainTab === "ship_dom") activeData = sortedShipDom;
    else if (mainTab === "ship_ovs") activeData = sortedShipOvs;
    else if (mainTab === "prod") activeData = sortedProd;
    else if (mainTab === "neg") activeData = filteredNegInv;

    return (
        <div style={{ padding: "0.5rem" }}>
            {/* 탭 메뉴 */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap", background: "#fff", padding: "0.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <button style={mainTab === "ship_dom" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_dom")}>🚚 국내 출하의뢰</button>
                <button style={mainTab === "ship_ovs" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_ovs")}>✈️ 해외 출하의뢰</button>
                <button style={mainTab === "prod" ? activeTabStyle : tabStyle} onClick={() => setMainTab("prod")}>📋 생산계획 전체</button>
                <button style={mainTab === "summary" ? activeTabStyle : tabStyle} onClick={() => setMainTab("summary")}>📅 날짜별 요약</button>
                <button style={mainTab === "neg" ? activeTabStyle : tabStyle} onClick={() => setMainTab("neg")}>⚠️ 마이너스 ({negInvList.length})</button>
            </div>

            {/* 검색 및 필터 */}
            {mainTab !== "summary" && (
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap", background: "#fff", padding: "0.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <input
                        type="text"
                        placeholder="검색어 입력 (고객, 모델, 품번 등)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px", flex: 1, minWidth: "150px" }}
                    />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="all">전체 상태</option>
                        <option value="ok">재고충족</option>
                        <option value="shortage">재고부족</option>
                        <option value="neg">마이너스</option>
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
                                    <th style={thStyle}>납기일자</th>
                                    <th style={thStyle}>의뢰처명</th>
                                    <th style={{ ...thStyle, width: "25%" }}>품목명 / 규격</th> {/* 넓은 공간 할당 */}
                                    <th style={thStyle}>의뢰수량</th>
                                    <th style={thStyle}>현재고</th>
                                    <th style={thStyle}>생산예정</th>
                                    <th style={thStyle}>예상재고</th>
                                    <th style={thStyle}>상태</th>
                                    <th style={thStyle}>의뢰번호</th>
                                    <th style={thStyle}>담당</th>
                                </>
                            )}
                            {mainTab === "prod" && (
                                <>
                                    <th style={thStyle}>계획일자</th>
                                    <th style={thStyle}>출하일자</th>
                                    <th style={thStyle}>고객명</th>
                                    <th style={{ ...thStyle, width: "25%" }}>모델명</th>
                                    <th style={thStyle}>제품코드</th>
                                    <th style={thStyle}>계획수량</th>
                                    <th style={thStyle}>현재고</th>
                                    <th style={thStyle}>상태</th>
                                </>
                            )}
                            {mainTab === "neg" && (
                                <>
                                    <th style={thStyle}>품번</th>
                                    <th style={{ ...thStyle, width: "40%" }}>품명</th>
                                    <th style={thStyle}>창고위치</th>
                                    <th style={thStyle}>재고수량</th>
                                </>
                            )}
                            {mainTab === "summary" && (
                                <>
                                    <th style={thStyle}>생산계획일자</th>
                                    <th style={thStyle}>계획 건수</th>
                                    <th style={thStyle}>총 생산수량</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {mainTab !== "summary" && activeData.map((item, idx) => (
                            <tr key={idx} style={tbodyTrStyle}>
                                {mainTab.includes("ship") && (
                                    <>
                                        <td style={tdStyle}>{item.납기일자}</td>
                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.거래처명}</td>
                                        <td style={{ ...tdStyle, textAlign: "left" }}>
                                            <div style={{ fontWeight: "600" }}>{item.품목명}</div>
                                            <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: "2px" }}>{item.규격} <br />({item.품목번호})</div>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.수량}</td>
                                        <td style={tdStyle}>{item._currentInvQty ?? "-"}</td>
                                        <td style={{ ...tdStyle, color: item._incomingProd > 0 ? "#2563eb" : "#94a3b8" }}>
                                            {item._incomingProd > 0 ? `+${item._incomingProd}` : "-"}
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: "700", color: item._projectedInvQty < 0 ? "#ef4444" : "#334155" }}>
                                            {item._projectedInvQty ?? "-"}
                                        </td>
                                        <td style={tdStyle}>{renderStatusBadge(item._status)}</td>
                                        <td style={{ ...tdStyle, color: "#64748b", fontSize: "0.6875rem" }}>{item.출하의뢰번호}</td>
                                        <td style={tdStyle}>{item.담당자}</td>
                                    </>
                                )}
                                {mainTab === "prod" && (
                                    <>
                                        <td style={{ ...tdStyle, fontWeight: "600", color: "#0ea5e9" }}>{item.생산계획일자}</td>
                                        <td style={tdStyle}>{item.출하일자 || "-"}</td>
                                        <td style={tdStyle}>{item.고객명}</td>
                                        <td style={{ ...tdStyle, fontWeight: "600", textAlign: "left" }}>{item.모델명}</td>
                                        <td style={{ ...tdStyle, color: "#64748b", fontSize: "0.6875rem" }}>{item.제품코드}</td>
                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.수량 || item.계획수량}</td>
                                        <td style={tdStyle}>{item._inv?.재고수량 ?? 0}</td>
                                        <td style={tdStyle}>{renderStatusBadge(item._status)}</td>
                                    </>
                                )}
                                {mainTab === "neg" && (
                                    <>
                                        <td style={{ ...tdStyle, fontWeight: "600" }}>{item.품번}</td>
                                        <td style={{ ...tdStyle, textAlign: "left" }}>{item.품명}</td>
                                        <td style={tdStyle}>{item.창고 || "-"}</td>
                                        <td style={{ ...tdStyle, fontWeight: "700", color: "#ef4444" }}>{item.재고수량}</td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {mainTab === "summary" && dailySummaryData.map((item, idx) => (
                            <tr key={idx} style={tbodyTrStyle}>
                                <td style={{ ...tdStyle, fontWeight: "600", color: "#0ea5e9" }}>{item.생산계획일자}</td>
                                <td style={tdStyle}>{item.건수}건</td>
                                <td style={{ ...tdStyle, fontWeight: "700" }}>{item.총수량?.toLocaleString()}</td>
                            </tr>
                        ))}

                        {((mainTab !== "summary" && activeData.length === 0) || (mainTab === "summary" && dailySummaryData.length === 0)) && (
                            <tr>
                                <td colSpan="10" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
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