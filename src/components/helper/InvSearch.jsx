// InvSearch.jsx: 출하 업무 — 재고 검색 (품번/품명으로 현재고·입고예정·예상재고 조회)
import { useState } from "react";
import { renderStatusBadge } from "../StatusBadge";
import { useIsMobile } from "../useIsMobile";
import { tableStyle, theadTrStyle, theadStyle, thStyle, tbodyTrStyle, tdStyle } from "../styles";
import { inputStyle } from "./styles";
import { Empty } from "./shared";

// ── 재고 검색 결과 카드 (모바일) ────────────────────
function InvCard({ r }) {
    const incoming = (qty) => qty > 0
        ? <span style={{ fontWeight: 700, color: "#0284c7" }}>+{qty}</span>
        : <span style={{ color: "#94a3b8" }}>-</span>;
    return (
        <div style={{ textAlign: "left", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.75rem 0.9rem", marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", wordBreak: "break-all" }}>{r.품번 || "-"}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2, wordBreak: "break-all" }}>
                        {r.품명 || "-"}{r.규격 ? ` · ${r.규격}` : ""}
                    </div>
                </div>
                <div style={{ flexShrink: 0 }}>{renderStatusBadge(r._status)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, background: "#f8fafc", borderRadius: 6, padding: "0.5rem" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>현재고</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{r._currentInvQty}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>생산예정</div>
                    <div style={{ fontSize: "0.85rem" }}>{incoming(r._incomingProd)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>KCE입고</div>
                    <div style={{ fontSize: "0.85rem" }}>{incoming(r._kceIncoming)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>미출하대기</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{r._pendingDemand > 0 ? r._pendingDemand : <span style={{ color: "#94a3b8" }}>-</span>}</div>
                </div>
            </div>
            <div style={{ marginTop: 6, fontSize: "0.8rem" }}>
                <span style={{ color: "#94a3b8" }}>예상재고 </span>
                <span style={{ fontWeight: 700, color: r._projectedInvQty < 0 ? "#b45309" : "#334155" }}>{r._projectedInvQty}</span>
            </div>
        </div>
    );
}

export function InvSearch({ invItems }) {
    const isMobile = useIsMobile();
    const [q, setQ] = useState("");
    const query = q.trim().toLowerCase();
    const filtered = query
        ? invItems.filter(r => (r.품번 || "").toLowerCase().includes(query) || (r.품명 || "").toLowerCase().includes(query))
        : invItems;

    const incomingCell = (qty) => qty > 0
        ? <span style={{ fontWeight: 700, color: "#0284c7" }}>+{qty}</span>
        : <span style={{ color: "#94a3b8" }}>-</span>;

    return (
        <>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>📦 재고 검색</div>
            <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="품번 · 품명 검색"
                style={{ ...inputStyle, width: "100%", padding: "9px 12px", marginBottom: 12 }} />
            {invItems.length === 0
                ? <Empty text="재고 데이터가 없습니다. 먼저 재고 파일을 업로드하세요." />
                : filtered.length === 0
                    ? <Empty text="검색 결과가 없습니다." />
                    : isMobile ? (
                        <div>
                            {filtered.map((r, i) => <InvCard key={r.품번 + i} r={r} />)}
                        </div>
                    ) : (
                        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflowX: "auto" }}>
                            <table style={tableStyle}>
                                <thead style={theadStyle}>
                                    <tr style={theadTrStyle}>
                                        <th style={{ ...thStyle, textAlign: "left", paddingLeft: "0.6rem" }}>품번</th>
                                        <th style={{ ...thStyle, textAlign: "left" }}>품명 · 규격</th>
                                        <th style={thStyle}>현재고</th>
                                        <th style={thStyle}>생산예정</th>
                                        <th style={thStyle}>KCE 입고</th>
                                        <th style={thStyle}>미출하 대기</th>
                                        <th style={thStyle}>예상재고</th>
                                        <th style={thStyle}>상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r, i) => (
                                        <tr key={r.품번 + i} style={tbodyTrStyle}>
                                            <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "0.6rem", fontWeight: 700 }}>{r.품번 || "-"}</td>
                                            <td style={{ ...tdStyle, textAlign: "left", wordBreak: "break-all" }}>
                                                {r.품명 || "-"}{r.규격 ? ` · ${r.규격}` : ""}
                                            </td>
                                            <td style={tdStyle}>{r._currentInvQty}</td>
                                            <td style={tdStyle}>{incomingCell(r._incomingProd)}</td>
                                            <td style={tdStyle}>{incomingCell(r._kceIncoming)}</td>
                                            <td style={tdStyle}>{r._pendingDemand > 0 ? r._pendingDemand : <span style={{ color: "#94a3b8" }}>-</span>}</td>
                                            <td style={{ ...tdStyle, fontWeight: 700, color: r._projectedInvQty < 0 ? "#b45309" : "#334155" }}>{r._projectedInvQty}</td>
                                            <td style={tdStyle}>{renderStatusBadge(r._status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
        </>
    );
}
