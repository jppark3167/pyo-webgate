// StatusBoard.jsx: 출하 업무 — 출하 상태 (오늘 납기 출하의뢰 전체의 진행상태 확인/변경, 완료 건은 아래로 분리)
import { useState } from "react";
import { quickKeyOf, buildQuickValue, toDateStr, normDate, SHIP_STAGES, SHIP_STAGE_DONE, nextShipStage } from "../../utils";
import { StageCycleChip } from "../ShipMethod";
import { inputStyle } from "./styles";
import { Empty } from "./shared";

// ── 출하 상태 카드 (출하의뢰 한 건 — 진행상태만 확인/변경) ──────
function StatusCard({ row, saved, onSave }) {
    const qkey = quickKeyOf(row);
    const stage = saved?.상태 || SHIP_STAGES[0].key;
    const isDone = stage === SHIP_STAGE_DONE;
    const cycleStage = () => onSave(qkey, buildQuickValue(row, {
        method: saved?.method || "", address: saved?.address || "", boxCount: saved?.boxCount || 0, phone: saved?.phone || "",
        상태: nextShipStage(stage),
    }));
    return (
        <div style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,.04)", opacity: isDone ? 0.6 : 1,
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
        }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#334155", wordBreak: "keep-all" }}>{row.거래처명 || "-"}</div>
                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2, wordBreak: "break-all" }}>
                    {row.품목명}{row.규격 ? ` · ${row.규격}` : ""}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2, wordBreak: "break-all" }}>
                    납기 {row.납기일자 || "-"} · 수량 {row.수량 ?? "-"}{row.출하의뢰번호 ? ` · ${row.출하의뢰번호}` : ""}
                </div>
            </div>
            <div style={{ flexShrink: 0 }}>
                <StageCycleChip stage={stage} onCycle={cycleStage} size="md" />
            </div>
        </div>
    );
}

export function StatusBoard({ ships, quick, onSave }) {
    const [search, setSearch] = useState("");
    const todayStr = toDateStr(new Date());
    const todaysShips = ships.filter(r => normDate(r.납기일자) === todayStr);
    const q = search.trim().toLowerCase();
    const filtered = q
        ? todaysShips.filter(r =>
            (r.거래처명 || "").toLowerCase().includes(q) ||
            (r.품목명 || "").toLowerCase().includes(q) ||
            (r.출하의뢰번호 || "").toLowerCase().includes(q))
        : todaysShips;

    const active = filtered.filter(row => (quick[quickKeyOf(row)]?.상태 || SHIP_STAGES[0].key) !== SHIP_STAGE_DONE);
    const done = filtered.filter(row => (quick[quickKeyOf(row)]?.상태 || SHIP_STAGES[0].key) === SHIP_STAGE_DONE);

    return (
        <>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>🚦 출하 상태</div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                오늘({todayStr}) 납기 출하의뢰 전체의 진행 상태입니다.
            </div>
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="거래처 · 품목 · 출하의뢰번호 검색"
                style={{ ...inputStyle, width: "100%", padding: "9px 12px", marginBottom: 12 }} />
            {filtered.length === 0
                ? <Empty text={
                    ships.length === 0 ? "출하의뢰 데이터가 없습니다. 먼저 출하의뢰를 업로드하세요."
                        : todaysShips.length === 0 ? "오늘 납기인 출하의뢰가 없습니다."
                            : "검색 결과가 없습니다."
                } />
                : <>
                    {active.length === 0 && done.length > 0 && <Empty text="진행 중인 출하가 없습니다." />}
                    {active.map((row, i) => {
                        const qkey = quickKeyOf(row);
                        return <StatusCard key={`${qkey}_${i}`} row={row} saved={quick[qkey]} onSave={onSave} />;
                    })}
                    {done.length > 0 && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px" }}>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>✓ 완료 {done.length}건</span>
                                <span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                            </div>
                            {done.map((row, i) => {
                                const qkey = quickKeyOf(row);
                                return <StatusCard key={`${qkey}_${i}`} row={row} saved={quick[qkey]} onSave={onSave} />;
                            })}
                        </>
                    )}
                </>}
        </>
    );
}
