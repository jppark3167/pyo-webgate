import React, { useState } from "react";
import { fmtD, quickKeyOf, buildQuickValue, findKnownRecipient } from "../utils";
import { renderStatusBadge } from "./StatusBadge";
import { MethodChip, MethodPicker } from "./ShipMethod";
import { ShipCard } from "./ShipCard";
import { useIsMobile } from "./useIsMobile";
import { tabStyle, activeTabStyle, tableStyle, theadTrStyle, theadStyle, thStyle, tbodyTrStyle, tdStyle } from "./styles";

export function DashView({
    mainTab, setMainTab, filterStatus, setFilterStatus, search, setSearch,
    shipSort, onShipSort, sortedShipDom, sortedShipOvs, sortedProd, prodSummaryData = [],
    dailySummaryData = [], allShipData = [], apiSaveMemo = null, initialMemos = null,
    quick = {}, onSaveQuick = null
}) {
    const isMobile = useIsMobile();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedProdDate, setSelectedProdDate] = useState(null);
    const [editingKey, setEditingKey] = useState(null);
    const [methodEditKey, setMethodEditKey] = useState(null);

    // 출하방법 지정/해제 — 기존 주소·박스수는 보존, 해제 시 항목 삭제
    const pickMethod = (item, method) => {
        const key = quickKeyOf(item);
        if (onSaveQuick) {
            if (method == null) onSaveQuick(key, null);
            else {
                const ex = quick[key] || {};
                let address = ex.address, phone = ex.phone;
                // 퀵 지정 시 주소록에 있는 거래처면 자동 입력
                if (method === "퀵" && !address) {
                    const known = findKnownRecipient(item.거래처명);
                    if (known) { address = known.address; if (!phone) phone = known.phone; }
                }
                onSaveQuick(key, buildQuickValue(item, { method, address, boxCount: ex.boxCount, phone }));
            }
        }
        setMethodEditKey(null);
    };
    const toggleMethodEdit = (item) => {
        const key = quickKeyOf(item);
        setMethodEditKey(prev => prev === key ? null : key);
    };

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

    // 정렬 가능한 헤더 셀 (클릭 시 정렬, 활성 컬럼은 ▲/▼ 표시)
    const sortTh = (label, width, align, color) => {
        const active = shipSort?.key === label;
        const arrow = active ? (shipSort.dir === "asc" ? "▲" : "▼") : "↕";
        return (
            <th onClick={() => onShipSort(label)}
                style={{
                    ...thStyle, width, cursor: "pointer", userSelect: "none",
                    ...(align === "left" ? { textAlign: "left", paddingLeft: "0.5rem" } : {}),
                    color: color || (active ? "#1e3a5f" : thStyle.color),
                }}>
                {label}<span style={{ fontSize: "0.6rem", marginLeft: "2px", color: active ? (color || "#1e3a5f") : "#cbd5e1" }}>{arrow}</span>
            </th>
        );
    };

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
                    <input type="text" placeholder="검색 (고객, 모델, 품번)" value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px", flex: 1, minWidth: "120px" }} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="all">전체</option>
                        <option value="ok">이상없음</option>
                        <option value="shortage">재고부족</option>
                    </select>
                    <select value={shipSort.key} onChange={(e) => onShipSort(e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="납기일자">납기일</option>
                        <option value="의뢰처명">의뢰처</option>
                        <option value="품목명">품목명</option>
                        <option value="수량">수량</option>
                        <option value="현재고">현재고</option>
                        <option value="생산예정">생산예정</option>
                        <option value="KCE 입고">KCE입고</option>
                        <option value="예상재고">예상재고</option>
                        <option value="상태">상태</option>
                    </select>
                    <button onClick={() => onShipSort(shipSort.key)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {shipSort.dir === "asc" ? "▲ 오름" : "▼ 내림"}
                    </button>
                </div>
            )}

            {/* 모바일: 카드 레이아웃 */}
            {isMobile && mainTab.includes("ship") && (
                <div style={{ paddingBottom: "1rem" }}>
                    {activeData.length === 0
                        ? <EmptyMessage />
                        : activeData.map((item, idx) => {
                            const key = quickKeyOf(item);
                            return (
                                <ShipCard key={idx} item={item}
                                    method={quick[key]?.method}
                                    editing={methodEditKey === key}
                                    onEdit={() => toggleMethodEdit(item)}
                                    onPick={(m) => pickMethod(item, m)} />
                            );
                        })}
                </div>
            )}

            {/* 모바일: 날짜별 요약 카드 */}
            {isMobile && mainTab === "summary" && (
                <MobileSummary data={dailySummaryData} allShipData={allShipData}
                    selectedDate={selectedDate} setSelectedDate={setSelectedDate} memos={memos} />
            )}

            {/* 모바일: 생산계획 카드 */}
            {isMobile && mainTab === "prod" && (
                <MobileProd data={prodSummaryData} sortedProd={sortedProd}
                    selectedProdDate={selectedProdDate} setSelectedProdDate={setSelectedProdDate} />
            )}

            {/* PC: 테이블 레이아웃 */}
            {!isMobile && (
                <div className="swipe-menu" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", width: "100%", overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 200px)", WebkitOverflowScrolling: "touch" }}>
                    <table style={tableStyle}>
                        <thead style={theadStyle}>
                            <tr style={theadTrStyle}>
                                {mainTab.includes("ship") && (<>
                                    {sortTh("납기일자", "6%")}
                                    {sortTh("의뢰처명", "12%")}
                                    {sortTh("품목명", "18%", "left")}
                                    {sortTh("수량", "5%")}
                                    {sortTh("현재고", "5%")}
                                    {sortTh("생산예정", "7%")}
                                    {sortTh("KCE 입고", "7%", null, "#1e40af")}
                                    {sortTh("예상재고", "8%")}
                                    {sortTh("상태", "7%")}
                                    <th style={{ ...thStyle, width: "9%" }}>의뢰번호</th>
                                    <th style={{ ...thStyle, width: "5%" }}>담당</th>
                                    <th style={{ ...thStyle, width: "9%" }}>출하방법</th>
                                    <th style={{ ...thStyle, width: "9%", textAlign: "left", paddingLeft: "0.5rem" }}>비고</th>
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
                            {mainTab.includes("ship") && activeData.map((item, idx) => {
                                const key = quickKeyOf(item);
                                return (
                                    <ShipRow key={idx} item={item}
                                        method={quick[key]?.method}
                                        editing={methodEditKey === key}
                                        onEdit={() => toggleMethodEdit(item)}
                                        onPick={(m) => pickMethod(item, m)} />
                                );
                            })}

                            {mainTab === "prod" && prodSummaryData.map((item, idx) => (
                                <ProdAccordion key={idx} item={item} sortedProd={sortedProd}
                                    selectedProdDate={selectedProdDate} setSelectedProdDate={setSelectedProdDate} />
                            ))}

                            {mainTab === "summary" && dailySummaryData.map((item, idx) => (
                                <SummaryAccordion key={idx} item={item} allShipData={allShipData}
                                    selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                                    editingKey={editingKey} setEditingKey={setEditingKey}
                                    memos={memos} saveMemo={saveMemo} />
                            ))}

                            {((mainTab.includes("ship") && activeData.length === 0) ||
                                (mainTab === "summary" && dailySummaryData.length === 0) ||
                                (mainTab === "prod" && prodSummaryData.length === 0)) && (
                                    <tr><td colSpan="13" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>데이터가 없습니다.</td></tr>
                                )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// 생산예정/KCE 입고 셀 — 납기일까지 들어오는 양(정상) 표시.
// 지연(납기일 이후 도착)은 그 건이 실제 재고부족(예상재고<0)일 때만 부족 사유로 표시.
function IncomingCell({ qty, dates, lateQty, lateDates, color, dateColor, showLate }) {
    const late = showLate && lateQty > 0;
    if (!qty && !late) return <td style={tdStyle}><span style={{ color: "#94a3b8" }}>-</span></td>;
    return (
        <td style={tdStyle}>
            {qty > 0
                ? <>
                    <div style={{ fontWeight: "700", color, whiteSpace: "nowrap" }}>+{qty}</div>
                    {dates?.length > 0 && <div style={{ fontSize: "0.6rem", color: dateColor, lineHeight: 1.2 }}>{dates.map(d => fmtD(d)).join(", ")}</div>}
                </>
                : <span style={{ color: "#cbd5e1" }}>-</span>}
            {late && (
                <div style={{ fontSize: "0.6rem", color: "#ea580c", marginTop: "2px", fontWeight: "600", lineHeight: 1.3 }}>
                    <div style={{ whiteSpace: "nowrap" }}>⏰지연 +{lateQty}</div>
                    {lateDates?.length > 0 && <div style={{ fontWeight: "400" }}>{lateDates.map(d => fmtD(d)).join(", ")}</div>}
                </div>
            )}
        </td>
    );
}

function EmptyMessage() {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>데이터가 없습니다.</div>;
}

function ShipRow({ item, method, editing, onEdit, onPick }) {
    return (
        <tr style={tbodyTrStyle} onDoubleClick={onEdit} title="더블클릭하여 출하방법 지정">
            <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.7rem", color: "#64748b" }}>{fmtD(item.납기일자)}</td>
            <td style={{ ...tdStyle, fontWeight: "600", textAlign: "left", paddingLeft: "0.5rem", wordBreak: "keep-all" }}>{item.거래처명}</td>
            <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem" }}>
                <div style={{ fontWeight: "600", wordBreak: "break-all" }}>{item.품목명}</div>
                <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px", wordBreak: "break-all" }}>{item.품목번호}</div>
            </td>
            <td style={{ ...tdStyle, fontWeight: "600", whiteSpace: "nowrap" }}>{item.수량}</td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item._currentInvQty ?? "-"}</td>
            <IncomingCell qty={item._incomingProd} dates={item._prodDates} lateQty={item._incomingProdLate} lateDates={item._prodLateDates} color="#2563eb" dateColor="#60a5fa" showLate={item._projectedInvQty < 0} />
            <IncomingCell qty={item._kceIncoming} dates={item._kceDates} lateQty={item._kceIncomingLate} lateDates={item._kceLateDates} color="#1e40af" dateColor="#3b82f6" showLate={item._projectedInvQty < 0} />
            <td style={{ ...tdStyle, fontWeight: "700", color: item._projectedInvQty < 0 ? "#ef4444" : "#334155" }}>
                <div style={{ whiteSpace: "nowrap" }}>{item._projectedInvQty ?? "-"}</div>
            </td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{renderStatusBadge(item._status)}</td>
            <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.65rem", wordBreak: "break-all" }}>{item.출하의뢰번호}</td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.담당자}</td>
            <td style={{ ...tdStyle }}>
                {editing
                    ? <MethodPicker onPick={onPick} />
                    : method
                        ? <MethodChip method={method} />
                        : <span style={{ color: "#cbd5e1", fontSize: "0.7rem" }}>-</span>}
            </td>
            <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.5rem", fontSize: "0.7rem" }}>
                {item._note && <span style={{ color: item._noteType === "dup" ? "#dc2626" : item._noteType === "esone" ? "#eab308" : "#d97706", fontWeight: "700", wordBreak: "keep-all" }}>{item._note}</span>}
                {item._prodDoneNote && <div style={{ color: "#2563eb", fontWeight: "600", whiteSpace: "nowrap", marginTop: item._note ? "2px" : 0 }}>{item._prodDoneNote}</div>}
                {!item._note && !item._prodDoneNote && <span style={{ color: "#cbd5e1" }}>-</span>}
            </td>
        </tr>
    );
}

function ProdAccordion({ item, sortedProd, selectedProdDate, setSelectedProdDate }) {
    const isOpen = selectedProdDate === item.생산계획일자;
    const detailItems = isOpen ? sortedProd.filter(r => (r.생산계획일자 || "날짜미정") === item.생산계획일자) : [];
    return (
        <React.Fragment>
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
}

function SummaryAccordion({ item, allShipData, selectedDate, setSelectedDate, editingKey, setEditingKey, memos, saveMemo }) {
    const isOpen = selectedDate === item.납기일자;
    const detailItems = isOpen
        ? allShipData.filter(r => (r.납기일자 || "날짜미정") === item.납기일자)
            .sort((a, b) => (a.거래처명 || "").localeCompare(b.거래처명 || "", "ko"))
        : [];
    return (
        <React.Fragment>
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
                                    const displayStatus = (d._noteType === "kce" && memoVal) ? "kce_scheduled" : d._status;
                                    const rowBg = (d._noteType === "kce" && memoVal) ? "#f5f3ff" : d._status === "shortage" ? "#fffbeb" : undefined;
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
                                                        style={{ width: "100%", fontSize: "0.75rem", padding: "3px 6px", border: "1px solid #93c5fd", borderRadius: "4px", outline: "none", boxSizing: "border-box" }} />
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
}

function MobileSummary({ data, allShipData, selectedDate, setSelectedDate, memos }) {
    if (data.length === 0) return <EmptyMessage />;
    return (
        <div style={{ paddingBottom: "1rem" }}>
            {data.map((item, idx) => {
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
            })}
        </div>
    );
}

function MobileProd({ data, sortedProd, selectedProdDate, setSelectedProdDate }) {
    if (data.length === 0) return <EmptyMessage />;
    return (
        <div style={{ paddingBottom: "1rem" }}>
            {data.map((item, idx) => {
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
            })}
        </div>
    );
}
