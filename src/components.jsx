import { useRef, useState } from "react";
import { fmtD, fmtN, STATUS, TH, TD } from "./utils";

export const ShipBadge = ({ status }) => {
    const s = STATUS[status] || STATUS.unknown;
    return <span style={{ background: s.bg, color: s.txt, border: `1px solid ${s.bdr}`, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
};

export function DropZone({ label, icon, accept, onFile, loaded, fileName }) {
    const ref = useRef();
    const [drag, setDrag] = useState(false);
    const handle = f => { if (f) onFile(f); };
    return (
        <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
            onClick={() => ref.current.click()}
            style={{
                border: `2px dashed ${drag ? "#3b82f6" : loaded ? "#4ade80" : "#cbd5e1"}`, borderRadius: 12, padding: "22px 16px",
                textAlign: "center", cursor: "pointer", background: drag ? "#eff6ff" : loaded ? "#f0fdf4" : "#f8fafc", transition: "all .2s", wordBreak: "keep-all"
            }}>
            <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => handle(e.target.files[0])} />
            <div style={{ fontSize: 28, marginBottom: 6 }}>{loaded ? "✅" : icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: loaded ? "#166534" : "#334155" }}>{label}</div>
            <div style={{ fontSize: 11, color: loaded ? "#64748b" : "#94a3b8", marginTop: 3, wordBreak: "break-all" }}>{fileName || "터치하여 파일 선택"}</div>
        </div>
    );
}

export const InputView = ({
    setView, handleResetData, parseMsg, handleProdFile, prodData, prodFile,
    handleInvFile, invData, invFile, shipText, setShipText, handleShipParse
}) => (
    <div className="page-container" style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="header-btn" onClick={() => setView("dash")} style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← 대시보드로</button>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>데이터 입력</h2>
            </div>
            <button className="header-btn" onClick={handleResetData} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>🗑️ 전체 초기화</button>
        </div>

        {parseMsg && (
            <div style={{ background: parseMsg.startsWith("✅") ? "#f0fdf4" : parseMsg.startsWith("⚠️") ? "#fefce8" : "#fef2f2", border: `1px solid ${parseMsg.startsWith("✅") ? "#bbf7d0" : parseMsg.startsWith("⚠️") ? "#fde68a" : "#fecaca"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: parseMsg.startsWith("✅") ? "#166534" : parseMsg.startsWith("⚠️") ? "#713f12" : "#991b1b", wordBreak: "keep-all" }}>
                {parseMsg}
            </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📋 생산계획 파일</div>
                <DropZone label="생산계획 업로드" icon="📋" accept=".xlsx,.xls,.csv" onFile={handleProdFile} loaded={prodData.length > 0} fileName={prodFile} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🏭 재고현황 파일</div>
                <DropZone label="재고현황 업로드" icon="🏭" accept=".xlsx,.xls,.csv" onFile={handleInvFile} loaded={invData.length > 0} fileName={invFile} />
            </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🚚 출하의뢰현황 (ERP 텍스트 붙여넣기)</div>
            <textarea
                value={shipText} onChange={e => setShipText(e.target.value)}
                placeholder="ERP 복사 텍스트 붙여넣기"
                style={{ width: "100%", boxSizing: "border-box", height: 120, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px", fontSize: 11, fontFamily: "monospace", outline: "none", resize: "vertical" }}
            />
            <div style={{ marginTop: 10 }}>
                <button onClick={handleShipParse} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, width: "100%" }}>파싱 적용</button>
            </div>
        </div>
    </div>
);

export const DashView = ({
    mainTab, setMainTab, shipEnriched, prodEnriched, prodStats, filterStatus, setFilterStatus,
    search, setSearch, filteredShip, filteredProd, filteredNegInv, negInvList
}) => (
    <>
        <div className="swipe-menu" style={{ display: "flex", gap: 8, padding: "10px 18px", background: "#fff", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
            {[
                { key: "all", label: "전체", cnt: mainTab === 'ship' ? shipEnriched.length : prodEnriched.length, color: "#475569" },
                { key: "ok", label: "✅ 출하가능", cnt: prodStats.ok, color: "#166534" },
                { key: "shortage", label: "❌ 재고부족", cnt: prodStats.shortage, color: "#991b1b" },
                { key: "unknown", label: "⚠️ 미확인", cnt: prodStats.unknown, color: "#713f12" }
            ].map(s => (
                <button key={s.key} className="stat-btn" onClick={() => { setFilterStatus(s.key); }} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, background: filterStatus === s.key ? STATUS[s.key]?.bg || "#f1f5f9" : "#f8fafc", border: `1.5px solid ${filterStatus === s.key ? s.color + "55" : "#e2e8f0"}`, borderRadius: 8, padding: "6px 13px", cursor: "pointer", fontSize: 12, fontWeight: filterStatus === s.key ? 700 : 400, color: filterStatus === s.key ? s.color : "#64748b" }}>
                    {s.label} <strong style={{ lineHeight: 1 }}>{s.cnt}</strong>
                </button>
            ))}
        </div>

        <div className="swipe-menu" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 18px", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            {[
                { key: "ship", label: "🚚 출하의뢰", extra: shipEnriched.filter(r => r._status !== "ok").length },
                { key: "prod", label: "📋 생산계획" },
                { key: "inv", label: "⚠️ 마이너스재고", extra: negInvList.length }
            ].map(t => (
                <button key={t.key} className="tab-btn" onClick={() => setMainTab(t.key)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 6px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: 13, borderBottom: mainTab === t.key ? "2.5px solid #3b82f6" : "2.5px solid transparent", color: mainTab === t.key ? "#1d4ed8" : "#94a3b8" }}>
                    {t.label}
                    {t.extra > 0 && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: t.key === "inv" ? "#ef4444" : "#f59e0b", color: "#fff", borderRadius: 10, padding: "2px 7px", fontSize: 10, fontWeight: 700, lineHeight: 1, minHeight: "18px" }}>{t.extra}</span>}
                </button>
            ))}
        </div>

        <div style={{ padding: "14px 16px 0", maxWidth: "100%" }}>
            <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: 9, fontSize: 14 }}>🔍</span>
                <input
                    type="text"
                    placeholder="품번, 거래처명, 품명 등으로 필터링..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "10px 10px 10px 34px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box", fontSize: 13, color: "#334155" }}
                />
            </div>
        </div>

        <div className="page-container" style={{ padding: "14px 16px" }}>

            {mainTab === "ship" && (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div className="swipe-menu">
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                            <thead>
                                <tr>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>상태</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>납기일자</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>거래처명</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>품명</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "right" }}>수량</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "right" }}>현재고</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>담당자</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>진행상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredShip.map((r, i) => (
                                    <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}><ShipBadge status={r._status} /></td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", fontWeight: 700, color: "#0369a1" }}>{fmtD(r.납기일자)}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", fontWeight: 600 }}>{r.거래처명}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}><div>{r.품목명}</div><div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.품목번호}</div></td>
                                        <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtN(r.수량)}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700, color: r._inv ? "inherit" : "#ef4444" }}>
                                            {r._inv ? fmtN(r._inv.재고수량) : "확인필요"}
                                        </td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}>{r.담당자}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}><span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, fontSize: 11, color: "#475569" }}>{r.상태}</span></td>
                                    </tr>
                                ))}
                                {filteredShip.length === 0 && <tr><td colSpan="8" style={{ ...TD, textAlign: "center", padding: "30px", color: "#94a3b8" }}>{search ? "검색 결과가 없습니다." : "데이터가 없습니다."}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {mainTab === "prod" && (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div className="swipe-menu">
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "550px" }}>
                            <thead>
                                <tr>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>생산계획일</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>출하일</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>고객명</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "right" }}>수량</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>모델명</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>제품코드</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProd.map((r, i) => (
                                    <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}>{fmtD(r.생산계획일자)}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", fontWeight: 700, color: "#1d4ed8" }}>{fmtD(r.출하일자)}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", fontWeight: 600 }}>{r.고객명}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtN(r.수량)}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}>{r.모델명}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", color: "#64748b" }}>{r.제품코드}</td>
                                    </tr>
                                ))}
                                {filteredProd.length === 0 && <tr><td colSpan="6" style={{ ...TD, textAlign: "center", padding: "30px", color: "#94a3b8" }}>{search ? "검색 결과가 없습니다." : "데이터가 없습니다."}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {mainTab === "inv" && (
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div className="swipe-menu">
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                            <thead>
                                <tr>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>상태</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>품번</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>품명</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "left" }}>규격</th>
                                    <th className="table-th" style={{ ...TH, textAlign: "right" }}>재고수량</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNegInv.map((r, i) => (
                                    <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}><ShipBadge status="neg" /></td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", fontWeight: 700 }}>{r.품번}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left" }}>{r.품명}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "left", color: "#64748b", fontSize: 11 }}>{r.규격}</td>
                                        <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700, color: "#ef4444" }}>{fmtN(r.재고수량)}</td>
                                    </tr>
                                ))}
                                {filteredNegInv.length === 0 && <tr><td colSpan="5" style={{ ...TD, textAlign: "center", padding: "30px", color: "#166534", fontWeight: 700 }}>{search ? "검색 결과가 없습니다." : "🎉 마이너스 재고가 없습니다!"}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </>
);