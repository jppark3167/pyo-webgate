import React from "react";

// ==========================================
// 1. 공통 인라인 스타일 정의
// ==========================================
const tabStyle = { flex: 1, minWidth: "90px", background: "none", border: "none", padding: "10px 4px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer", borderRadius: "6px", transition: "all 0.15s ease" };
const activeTabStyle = { ...tabStyle, background: "#1e3a5f", color: "#fff" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "800px" };
const theadTrStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const thStyle = { padding: "10px 12px", fontWeight: "600", color: "#475569", textAlign: "center", whiteSpace: "nowrap" };
const tbodyTrStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px", color: "#334155", textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap" };

// ==========================================
// 2. 상태 배지 렌더링 헬퍼 함수
// ==========================================
export function renderStatusBadge(status) {
    switch (status) {
        case "completed": return <span style={{ background: "#e2e8f0", color: "#475569", border: "1px solid #cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>전산완료</span>;
        case "ok": return <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>출하가능</span>;
        case "shortage": return <span style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>재고부족</span>;
        case "neg": return <span style={{ background: "#fff1f2", color: "#9f1239", border: "1px solid #fda4af", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>마이너스</span>;
        default: return <span style={{ background: "#fef9c3", color: "#713f12", border: "1px solid #fde047", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>미등록</span>;
    }
}

// ✨ 새로운 단가 검증 상태 뱃지
export function renderPriceBadge(pStatus) {
    switch (pStatus) {
        case "match": return <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>단가 o</span>;
        case "mismatch": return <span style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>단가 x</span>;
        default: return <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>확인필요</span>;
    }
}

// ==========================================
// 3. INPUT VIEW (기존과 동일)
// ==========================================
export function InputView({ setView, handleResetData, parseMsg, handleProdFile, prodData, prodFile, handleInvFile, invData, invFile, handlePriceFile, priceData, priceFile, shipText, setShipText, handleShipParse }) {
    return (
        <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#334155", margin: 0 }}>📂 데이터 입력 및 설정</h2>
                <button onClick={handleResetData} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>전체 초기화</button>
            </div>
            {parseMsg && <div style={{ marginBottom: "16px", padding: "10px", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>💡 {parseMsg}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155" }}>1️⃣ 생산계획 & 재고 파일 업로드</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}><span style={{ fontSize: "13px" }}>생산계획 파일:</span><input type="file" accept=".xls,.xlsx" onChange={handleProdFile} style={{ fontSize: "12px" }} /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "13px" }}>현재고 파일:</span><input type="file" accept=".xls,.xlsx" onChange={handleInvFile} style={{ fontSize: "12px" }} /></div>
                </div>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155" }}>2️⃣ 단가표 파일 업로드 (Excel)</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "13px" }}>판가표 파일:</span><input type="file" accept=".xls,.xlsx" onChange={handlePriceFile} style={{ fontSize: "12px" }} /></div>
                    {priceFile && <div style={{ marginTop: "8px", fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>현재 적용됨: {priceFile} (총 {priceData?.length || 0}품목 연동 중)</div>}
                </div>
                <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155" }}>3️⃣ 출하/의뢰 데이터 붙여넣기</h3>
                    <textarea value={shipText} onChange={(e) => setShipText(e.target.value)} placeholder="엑셀에서 긁어온 데이터를 여기에 붙여넣으세요..." style={{ width: "100%", height: "150px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", resize: "none", boxSizing: "border-box" }} />
                    <button onClick={handleShipParse} style={{ marginTop: "10px", width: "100%", background: "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>출하 데이터 등록</button>
                </div>
            </div>
            <button onClick={() => setView("dash")} style={{ marginTop: "20px", width: "100%", background: "#1e3a5f", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>대시보드로 돌아가기 ➡️</button>
        </div>
    );
}

// ==========================================
// 4. DASH VIEW (5개 탭 구조 및 단가 상태 인라인 통합)
// ==========================================
export function DashView({ mainTab, setMainTab, search, setSearch, prodEnriched, shipEnriched, dailySummaryData, invData }) {

    // 수출/해외출하 필터 헬퍼 (구분이나 의뢰처명 등에 '해외', '수출' 키워드가 있으면 분리)
    const isExport = (item) => {
        const text = ((item.구분 || "") + " " + (item.의뢰처명 || "")).trim().toLowerCase();
        return text.includes("해외") || text.includes("수출") || text.includes("export");
    };

    // 공통 출하 테이블 렌더링 함수
    const renderShipTable = (dataFiltered) => (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <table style={tableStyle}>
                <thead style={theadTrStyle}>
                    <tr>
                        <th style={thStyle}>재고 상태</th>
                        <th style={thStyle}>단가 상태</th>
                        <th style={thStyle}>납기/출하일</th>
                        <th style={thStyle}>의뢰처명</th>
                        <th style={thStyle}>품번(모델명)</th>
                        <th style={thStyle}>출하단가</th>
                        <th style={thStyle}>의뢰수량</th>
                        <th style={thStyle}>현재고</th>
                    </tr>
                </thead>
                <tbody>
                    {dataFiltered.map((item, idx) => (
                        <tr key={idx} style={tbodyTrStyle}>
                            <td style={tdStyle}>{renderStatusBadge(item.status)}</td>
                            <td style={tdStyle}>{renderPriceBadge(item.pStatus)}</td>
                            <td style={tdStyle}>{item.출하일자 || item.납기일자 || "-"}</td>
                            <td style={tdStyle}>{item.의뢰처명 || item.거래처명 || "-"}</td>
                            <td style={tdStyle} style={{ fontWeight: "bold" }}>{item.품번}</td>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: "600" }}>{item.currentPrice ? item.currentPrice.toLocaleString() : "0"}원</div>
                                {item.pStatus === "mismatch" && (
                                    <div style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px" }}>
                                        (단가표: {item.stdPrice > 0 ? item.stdPrice.toLocaleString() : "0"}원)
                                    </div>
                                )}
                            </td>
                            <td style={tdStyle}>{item.수량}</td>
                            <td style={tdStyle} style={{ color: item.invQty < 0 ? "#dc2626" : "#334155", fontWeight: "bold" }}>{item.invQty}</td>
                        </tr>
                    ))}
                    {dataFiltered.length === 0 && <tr><td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>데이터가 없습니다.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* 5가지 메뉴 탭 구조 */}
            <div style={{ display: "flex", gap: "8px", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", overflowX: "auto", marginBottom: "16px" }} className="swipe-menu">
                <button style={mainTab === "ship_dom" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_dom")}>국내출하</button>
                <button style={mainTab === "ship_exp" ? activeTabStyle : tabStyle} onClick={() => setMainTab("ship_exp")}>해외출하</button>
                <button style={mainTab === "prod_plan" ? activeTabStyle : tabStyle} onClick={() => setMainTab("prod_plan")}>생산계획</button>
                <button style={mainTab === "daily_summary" ? activeTabStyle : tabStyle} onClick={() => setMainTab("daily_summary")}>날짜별 요약</button>
                <button style={mainTab === "inv_search" ? activeTabStyle : tabStyle} onClick={() => setMainTab("inv_search")}>재고검색</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
                <input type="text" placeholder="검색어 입력 (모델명, 의뢰처 등)" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", maxWidth: "300px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
            </div>

            {/* 1. 국내출하 / 2. 해외출하 렌더링 (단가 확인 내장됨) */}
            {mainTab === "ship_dom" && renderShipTable(shipEnriched.filter(item => !isExport(item)).filter(item => item.품번.includes(search) || (item.의뢰처명 || "").includes(search)))}
            {mainTab === "ship_exp" && renderShipTable(shipEnriched.filter(item => isExport(item)).filter(item => item.품번.includes(search) || (item.의뢰처명 || "").includes(search)))}

            {/* 3. 생산계획 렌더링 */}
            {mainTab === "prod_plan" && (
                <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <table style={tableStyle}>
                        <thead style={theadTrStyle}>
                            <tr><th style={thStyle}>생산일자</th><th style={thStyle}>품번(모델명)</th><th style={thStyle}>계획수량</th><th style={thStyle}>비고</th></tr>
                        </thead>
                        <tbody>
                            {prodEnriched.filter(item => item.품번.includes(search)).map((item, idx) => (
                                <tr key={idx} style={tbodyTrStyle}>
                                    <td style={tdStyle}>{item.생산계획일자 || item.일자 || "-"}</td>
                                    <td style={tdStyle} style={{ fontWeight: "bold" }}>{item.품번}</td>
                                    <td style={tdStyle}>{item.수량}</td>
                                    <td style={tdStyle}>{item.비고 || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 4. 날짜별 요약 렌더링 */}
            {mainTab === "daily_summary" && (
                <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <table style={tableStyle}>
                        <thead style={theadTrStyle}>
                            <tr><th style={thStyle}>일자</th><th style={thStyle}>출하 (건수)</th><th style={thStyle}>출하 (수량합계)</th><th style={thStyle}>생산계획 (건수)</th><th style={thStyle}>생산계획 (수량합계)</th></tr>
                        </thead>
                        <tbody>
                            {dailySummaryData.filter(item => item.일자.includes(search)).map((item, idx) => (
                                <tr key={idx} style={tbodyTrStyle}>
                                    <td style={tdStyle} style={{ fontWeight: "bold" }}>{item.일자}</td>
                                    <td style={tdStyle}>{item.출하건수} 건</td>
                                    <td style={tdStyle} style={{ color: "#2563eb", fontWeight: "bold" }}>{item.출하수량.toLocaleString()} 개</td>
                                    <td style={tdStyle}>{item.생산건수} 건</td>
                                    <td style={tdStyle} style={{ color: "#166534", fontWeight: "bold" }}>{item.생산수량.toLocaleString()} 개</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 5. 재고검색 렌더링 */}
            {mainTab === "inv_search" && (
                <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <table style={tableStyle}>
                        <thead style={theadTrStyle}>
                            <tr><th style={thStyle}>품번(모델명)</th><th style={thStyle}>현재고</th><th style={thStyle}>분류 / 비고</th></tr>
                        </thead>
                        <tbody>
                            {invData.filter(item => {
                                const code = item.품번 || item.모델명 || "";
                                return code.toLowerCase().includes(search.toLowerCase());
                            }).map((item, idx) => (
                                <tr key={idx} style={tbodyTrStyle}>
                                    <td style={tdStyle} style={{ fontWeight: "bold" }}>{item.품번 || item.모델명}</td>
                                    <td style={tdStyle} style={{ color: item.현재고 < 0 ? "#dc2626" : "#334155", fontWeight: "bold" }}>{item.현재고 || item.재고 || item.수량 || 0}</td>
                                    <td style={tdStyle}>{item.분류 || item.비고 || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}