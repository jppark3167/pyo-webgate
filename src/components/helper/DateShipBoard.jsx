// DateShipBoard.jsx: 출하 업무 — 날짜별 출하 (날짜 선택 → 해당 납기일자 출하의뢰 조회, 거래처 필터 탭)
import { useState } from "react";
import { quickKeyOf, toDateStr, normDate, normName, stripCustomerPrefix, SHIP_STAGES } from "../../utils";
import { inputStyle } from "./styles";
import { Empty } from "./shared";

const COMPANY_TABS = ["전체", "애니원", "세이프", "티에스에스", "티컴퍼니", "기타"];

function matchCompany(거래처명, tab) {
    if (tab === "전체") return true;
    const n = normName(거래처명);
    if (tab === "기타") {
        return !COMPANY_TABS.slice(1, -1).some(c => {
            const cn = normName(c);
            return n.includes(cn) || cn.includes(n);
        });
    }
    const cn = normName(tab);
    return n.includes(cn) || cn.includes(n);
}

function StageChip({ stage }) {
    const s = SHIP_STAGES.find(x => x.key === stage) || SHIP_STAGES[0];
    return (
        <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: "3px 9px", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
            {s.key}
        </span>
    );
}

function ShipRow({ row, stage }) {
    return (
        <div style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,.04)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
        }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#334155", wordBreak: "keep-all" }}>{stripCustomerPrefix(row.거래처명) || "-"}</div>
                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2, wordBreak: "break-all" }}>
                    {row.품목명}{row.규격 ? ` · ${row.규격}` : ""}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2, wordBreak: "break-all" }}>
                    수량 {row.수량 ?? "-"}{row.출하의뢰번호 ? ` · ${row.출하의뢰번호}` : ""}
                </div>
                {row.비고 && <div style={{ fontSize: "0.72rem", color: "#d97706", marginTop: 2, wordBreak: "break-all" }}>{row.비고}</div>}
            </div>
            <div style={{ flexShrink: 0 }}>
                <StageChip stage={stage} />
            </div>
        </div>
    );
}

export function DateShipBoard({ ships, quick }) {
    const [date, setDate] = useState(toDateStr(new Date()));
    const [tab, setTab] = useState("전체");

    const dayShips = ships.filter(r => normDate(r.납기일자) === date);
    const filtered = dayShips.filter(r => matchCompany(r.거래처명, tab));

    return (
        <>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>📅 날짜별 출하</div>
            <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ ...inputStyle, width: "100%", padding: "9px 12px", marginBottom: 10, fontSize: "0.85rem" }} />
            <div className="swipe-menu" style={{ display: "flex", gap: 6, marginBottom: 12, paddingBottom: 2 }}>
                {COMPANY_TABS.map(c => {
                    const count = c === "전체" ? dayShips.length : dayShips.filter(r => matchCompany(r.거래처명, c)).length;
                    const active = tab === c;
                    return (
                        <button key={c} onClick={() => setTab(c)} style={{
                            flexShrink: 0, background: active ? "#1e293b" : "#fff", color: active ? "#fff" : "#475569",
                            border: `1px solid ${active ? "#1e293b" : "#cbd5e1"}`, borderRadius: 20, padding: "6px 12px",
                            fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                        }}>{c}{count > 0 ? ` ${count}` : ""}</button>
                    );
                })}
            </div>
            {filtered.length === 0
                ? <Empty text={
                    ships.length === 0 ? "출하의뢰 데이터가 없습니다. 먼저 출하의뢰를 업로드하세요."
                        : dayShips.length === 0 ? `${date} 납기인 출하의뢰가 없습니다.`
                            : "해당 거래처의 출하의뢰가 없습니다."
                } />
                : filtered.map((row, i) => {
                    const qkey = quickKeyOf(row);
                    const stage = quick[qkey]?.상태 || SHIP_STAGES[0].key;
                    return <ShipRow key={`${qkey}_${i}`} row={row} stage={stage} />;
                })}
        </>
    );
}
