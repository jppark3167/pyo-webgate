import React from "react";

// ==========================================
// 1. INPUT VIEW (파일 업로드 및 텍스트 파싱)
// ==========================================
export function InputView({
    setView,
    handleResetData,
    parseMsg,
    handleProdFile,
    prodData,
    prodFile,
    handleInvFile,
    invData,
    invFile,
    shipText,
    setShipText,
    handleShipParse,
}) {
    return (
        <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#334155", margin: 0 }}>📂 데이터 입력 및 설정</h2>
                <button
                    onClick={handleResetData}
                    style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: "6px",
                        cursor: "pointer"
                    }}
                >
                    데이터 전체 초기화
                </button>
            </div>

            {parseMsg && (
                <div
                    style={{
                        background: parseMsg.includes("❌") ? "#fef2f2" : (parseMsg.includes("⚠️") ? "#fffbeb" : "#f0fdf4"),
                        color: parseMsg.includes("❌") ? "#991b1b" : (parseMsg.includes("⚠️") ? "#92400e" : "#166534"),
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontSize: "14px",
                        fontWeight: "500",
                        border: `1px solid ${parseMsg.includes("❌") ? "#fca5a5" : (parseMsg.includes("⚠️") ? "#fde68a" : "#bbf7d0")}`
                    }}
                >
                    {parseMsg}
                </div>
            )}

            {/* 생산계획 파일 업로드 */}
            <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "6px", color: "#475569", marginTop: 0, marginBottom: "10px" }}>📈 생산계획 엑셀 파일 (.xlsx)</h3>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => e.target.files[0] && handleProdFile(e.target.files[0])}
                    style={{ display: "block", width: "100%", padding: "8px", border: "1px dashed #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
                />
                {prodFile && <p style={{ fontSize: "13px", color: "#0284c7", margin: "8px 0 0 0", fontWeight: "500" }}>📄 로드됨: {prodFile} ({prodData.length}건)</p>}
            </div>

            {/* 재고현황 파일 업로드 */}
            <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "6px", color: "#475569", marginTop: 0, marginBottom: "10px" }}>📦 현재고현황 엑셀 파일 (.xlsx)</h3>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => e.target.files[0] && handleInvFile(e.target.files[0])}
                    style={{ display: "block", width: "100%", padding: "8px", border: "1px dashed #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
                />
                {invFile && <p style={{ fontSize: "13px", color: "#0284c7", margin: "8px 0 0 0", fontWeight: "500" }}>📄 로드됨: {invFile} ({invData.length}품목)</p>}
            </div>

            {/* 출하의뢰 텍스트 붙여넣기 */}
            <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "6px", color: "#475569", marginTop: 0, marginBottom: "10px" }}>📋 출하의뢰 정보 복사/붙여넣기 (ERP 그리드 복사본)</h3>
                <textarea
                    value={shipText}
                    onChange={(e) => setShipText(e.target.value)}
                    placeholder="ERP 출하의뢰조회 화면의 행들을 복사(Ctrl+C)하여 여기에 붙여넣기(Ctrl+V) 하세요."
                    style={{ width: "100%", height: "150px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }}
                />
                <button
                    onClick={handleShipParse}
                    style={{ width: "100%", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontSize: "14px", fontWeight: "6px", marginTop: "10px", cursor: "pointer" }}
                >
                    출하의뢰 텍스트 분석 및 반영
                </button>
            </div>

            <button
                onClick={() => setView("dash")}
                style={{ width: "100%", background: "#475569", color: "#fff", border: "none", borderRadius: "6px", padding: "12px", fontSize: "14px", fontWeight: "6px", cursor: "pointer" }}
            >
                종료하고 대시보드로 돌아가기
            </button>
        </div>
    );
}


// ==========================================
// 2. DASH VIEW (메인 관리 화면 및 탭)
// ==========================================
export function DashView({
    mainTab,
    setMainTab,
    prodStats,
    filterStatus,
    setFilterStatus,
    search,
    setSearch,
    sortDesc,
    setSortDesc,
    sortedShipDom,
    sortedShipOvs,
    sortedProd,
    filteredNegInv,
    negInvList,
    dailySummaryData = [], // App.jsx로부터 넘겨받는 요약 데이터 (기본값 설정)
}) {

    // 현재 선택된 탭에 따른 데이터 개수 계산
    const currentCount =
        mainTab === "ship_dom" ? sortedShipDom.length :
            mainTab === "ship_ovs" ? sortedShipOvs.length :
                mainTab === "prod_plan" ? sortedProd.length :
                    mainTab === "daily_summary" ? dailySummaryData.length : filteredNegInv.length;

    return (
        <div style={{ padding: "16px" }}>

            {/* 상단 메인 탭 네비게이션 */}
            <div style={{ display: "flex", flexWrap: "wrap", background: "#fff", borderRadius: "8px", padding: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                <button onClick={() => setMainTab("ship_dom")} style={mainTab === "ship_dom" ? activeTabStyle : tabStyle}>
                    🚚 국내 출하의뢰
                </button>
                <button onClick={() => setMainTab("ship_ovs")} style={mainTab === "ship_ovs" ? activeTabStyle : tabStyle}>
                    ✈️ 해외 출하의뢰
                </button>
                <button onClick={() => setMainTab("prod_plan")} style={mainTab === "prod_plan" ? activeTabStyle : tabStyle}>
                    📋 생산계획 전체
                </button>
                {/* 💡 [새로 추가된 날짜별 요약 탭 버튼] */}
                <button onClick={() => setMainTab("daily_summary")} style={mainTab === "daily_summary" ? activeTabStyle : tabStyle}>
                    📅 날짜별 요약
                </button>
                <button onClick={() => setMainTab("neg_inv")} style={{ ...(mainTab === "neg_inv" ? activeTabStyle : tabStyle), color: negInvList.length > 0 ? "#ef4444" : "#475569" }}>
                    ⚠️ 마이너스 재고 ({negInvList.length})
                </button>
            </div>

            {/* 필터 및 검색창 영역 (날짜별 요약 탭이 아닐 때만 노출) */}
            {mainTab !== "daily_summary" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "12px", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            placeholder="검색어 입력 (고객, 모델, 품번 등)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", width: "220px" }}
                        />
                        {mainTab !== "neg_inv" && (
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
                            >
                                <option value="all">전체 상태 ({prodStats.ok + prodStats.shortage + prodStats.neg + prodStats.unknown}건)</option>
                                <option value="ok">🟩 재고충족 ({prodStats.ok}건)</option>
                                <option value="shortage">🟨 재고부족 ({prodStats.shortage}건)</option>
                                <option value="neg">🟥 마이너스재고 ({prodStats.neg}건)</option>
                                <option value="unknown">⬜ 재고미등록 ({prodStats.unknown}건)</option>
                            </select>
                        )}
                    </div>

                    {mainTab !== "neg_inv" && (
                        <button
                            onClick={() => setSortDesc(!sortDesc)}
                            style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontWeight: "500", color: "#334155" }}
                        >
                            날짜 {sortDesc ? "내림차순 ▽" : "오름차순 △"}
                        </button>
                    )}
                </div>
            )}

            {/* 데이터 테이블 뷰 영역 */}
            <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflowX: "auto" }}>

                {/* 1 & 2. 국내 / 해외 출하의뢰 테이블 */}
                {(mainTab === "ship_dom" || mainTab === "ship_ovs") && (
                    <table style={tableStyle}>
                        <thead>
                            <tr style={theadTrStyle}>
                                <th style={thStyle}>납기일자</th>
                                <th style={thStyle}>의뢰처명</th>
                                <th style={thStyle}>품목명 / 규격</th>
                                <th style={thStyle}>의뢰수량</th>
                                <th style={thStyle}>현재고</th>
                                <th style={thStyle}>상태</th>
                                <th style={thStyle}>의뢰번호</th>
                                <th style={thStyle}>담당</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(mainTab === "ship_dom" ? sortedShipDom : sortedShipOvs).map((r, i) => (
                                <tr key={i} style={tbodyTrStyle}>
                                    <td style={{ ...tdStyle, fontWeight: "600" }}>{r.납기일자}</td>
                                    <td style={{ ...tdStyle, textAlign: "left" }}>{r.거래처명}</td>
                                    <td style={{ ...tdStyle, textAlign: "left" }}>
                                        <div style={{ fontWeight: "600" }}>{r.품목명}</div>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{r.품목번호} / {r.규격}</div>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: "600", color: "#0f172a" }}>{r.수량.toLocaleString()}</td>
                                    <td style={tdStyle}>{r._inv ? r._inv.재고수량.toLocaleString() : "-"}</td>
                                    <td style={tdStyle}>{renderStatusBadge(r._status)}</td>
                                    <td style={{ ...tdStyle, fontSize: "11px", color: "#64748b" }}>{r.출하의뢰번호}</td>
                                    <td style={tdStyle}>{r.담당자}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 3. 생산계획 전체 테이블 */}
                {mainTab === "prod_plan" && (
                    <table style={tableStyle}>
                        <thead>
                            <tr style={theadTrStyle}>
                                <th style={thStyle}>생산계획일자</th>
                                <th style={thStyle}>출하일자</th>
                                <th style={thStyle}>고객명</th>
                                <th style={thStyle}>모델명</th>
                                <th style={thStyle}>제품코드</th>
                                <th style={thStyle}>계획수량</th>
                                <th style={thStyle}>현재고</th>
                                <th style={thStyle}>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProd.map((r, i) => (
                                <tr key={i} style={tbodyTrStyle}>
                                    <td style={{ ...tdStyle, fontWeight: "600", color: "#0284c7" }}>{r.생산계획일자}</td>
                                    <td style={tdStyle}>{r.출하일자}</td>
                                    <td style={{ ...tdStyle, textAlign: "left" }}>{r.고객명}</td>
                                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: "600" }}>{r.모델명}</td>
                                    <td style={tdStyle}>{r.제품코드}</td>
                                    <td style={{ ...tdStyle, fontWeight: "600" }}>{r.수량.toLocaleString()}</td>
                                    <td style={tdStyle}>{r._inv ? r._inv.재고수량.toLocaleString() : "-"}</td>
                                    <td style={tdStyle}>{renderStatusBadge(r._status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 💡 4. [새로 추가된 날짜별 요약 테이블] */}
                {mainTab === "daily_summary" && (
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ ...theadTrStyle, background: "#e8f0fe" }}>
                                <th style={thStyle}>생산계획 일자</th>
                                <th style={thStyle}>총 의뢰 건수</th>
                                <th style={thStyle}>총 계획/출하 수량 합계</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailySummaryData.map((r, i) => (
                                <tr key={i} style={tbodyTrStyle}>
                                    <td style={{ ...tdStyle, fontWeight: "700", fontSize: "14px", color: "#1e3a5f" }}>{r.생산계획일자}</td>
                                    <td style={{ ...tdStyle, fontSize: "14px" }}>{r.건수.toLocaleString()} 건</td>
                                    <td style={{ ...tdStyle, fontWeight: "700", fontSize: "14px", color: "#2563eb" }}>
                                        {r.총수량.toLocaleString()} 개
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 5. 마이너스 재고 테이블 */}
                {mainTab === "neg_inv" && (
                    <table style={tableStyle}>
                        <thead>
                            <tr style={theadTrStyle}>
                                <th style={thStyle}>품번 (코드)</th>
                                <th style={thStyle}>품명</th>
                                <th style={thStyle}>규격</th>
                                <th style={thStyle}>현재고수량</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNegInv.map((r, i) => (
                                <tr key={i} style={tbodyTrStyle}>
                                    <td style={{ ...tdStyle, fontWeight: "600", color: "#ef4444" }}>{r.품번}</td>
                                    <td style={{ ...tdStyle, textAlign: "left" }}>{r.품명}</td>
                                    <td style={{ ...tdStyle, textAlign: "left" }}>{r.규격}</td>
                                    <td style={{ ...tdStyle, fontWeight: "700", color: "#ef4444" }}>{r.재고수량.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 데이터가 없을 때의 공통 예외 처리 */}
                {currentCount === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                        조회된 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}


// ==========================================
// 3. 상태 표시 배지 렌더링 헬퍼 함수
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
// 4. 컴포넌트 내부 공통 인라인 스타일 정의
// ==========================================
const tabStyle = {
    flex: 1,
    minWidth: "100px",
    background: "none",
    border: "none",
    padding: "10px 4px",
    fontSize: "13px",
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
    fontSize: "13px",
    minWidth: "700px"
};

const theadTrStyle = {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
};

const thStyle = {
    padding: "10px 12px",
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    whiteSpace: "nowrap"
};

const tbodyTrStyle = {
    borderBottom: "1px solid #f1f5f9",
    hover: { background: "#f8fafc" }
};

const tdStyle = {
    padding: "12px",
    color: "#334155",
    textAlign: "center",
    verticalAlign: "middle"
};