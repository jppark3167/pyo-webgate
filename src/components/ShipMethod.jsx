// ShipMethod.jsx: 출하방법 칩(표시) + 선택기(퀵/택배/경동/해제) — DashView·ShipCard 공용
import { SHIP_METHODS, SHIP_STAGES } from "../utils";

export function MethodChip({ method, size = "sm" }) {
    const m = SHIP_METHODS.find(x => x.key === method);
    if (!m) return null;
    return (
        <span style={{
            background: m.bg, color: m.color, borderRadius: 4,
            padding: size === "sm" ? "2px 7px" : "3px 9px",
            fontSize: size === "sm" ? "0.7rem" : "0.75rem", fontWeight: 700, whiteSpace: "nowrap",
        }}>{m.key}</span>
    );
}

// 클릭할 때마다 다음 출하방법으로 순환하는 칩 (미지정 → 퀵 → 택배 → 경동 → 직납 → 미지정)
// onCycle() — 다음 방법으로 전환. 미지정 상태는 점선 "＋지정" 칩으로 표시
export function MethodCycleChip({ method, onCycle, size = "sm" }) {
    const m = SHIP_METHODS.find(x => x.key === method);
    const handle = (e) => { e.stopPropagation(); onCycle(); };
    const pad = size === "sm" ? "2px 7px" : "3px 9px";
    const fs = size === "sm" ? "0.7rem" : "0.75rem";
    if (!m) {
        return (
            <button onClick={handle} title="클릭하여 출하방법 지정 (누를 때마다 순환)"
                style={{ background: "#f8fafc", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 4, padding: pad, fontSize: fs, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                ＋ 지정
            </button>
        );
    }
    return (
        <button onClick={handle} title="클릭하여 다음 출하방법으로 변경"
            style={{ background: m.bg, color: m.color, border: "none", borderRadius: 4, padding: pad, fontSize: fs, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>
            {m.key}<span style={{ opacity: 0.55, fontSize: "0.85em" }}>↻</span>
        </button>
    );
}

// 클릭할 때마다 다음 출하상태로 순환하는 칩 (창고대기 → 출고중 → 포장완료 → 출하대기 → 출하완료 → 창고대기)
// 출하방법과 달리 미지정 상태가 없으므로 항상 색이 채워진 칩으로 표시
export function StageCycleChip({ stage, onCycle, size = "sm" }) {
    const s = SHIP_STAGES.find(x => x.key === stage) || SHIP_STAGES[0];
    const handle = (e) => { e.stopPropagation(); onCycle(); };
    const pad = size === "sm" ? "2px 7px" : "3px 9px";
    const fs = size === "sm" ? "0.7rem" : "0.75rem";
    return (
        <button onClick={handle} title="클릭하여 다음 출하상태로 변경"
            style={{ background: s.bg, color: s.color, border: "none", borderRadius: 4, padding: pad, fontSize: fs, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>
            {s.key}<span style={{ opacity: 0.55, fontSize: "0.85em" }}>↻</span>
        </button>
    );
}
