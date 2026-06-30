// ShipMethod.jsx: 출하방법 칩(표시) + 선택기(퀵/택배/경동/해제) — DashView·ShipCard 공용
import { SHIP_METHODS } from "../utils";

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

// onPick(method) — method가 null이면 지정 해제
export function MethodPicker({ onPick }) {
    const btn = (bg, color, label, key) => (
        <button
            key={label}
            onClick={(e) => { e.stopPropagation(); onPick(key); }}
            style={{ background: bg, color, border: "none", borderRadius: 4, padding: "3px 8px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >{label}</button>
    );
    return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
            {SHIP_METHODS.map(m => btn(m.bg, m.color, m.key, m.key))}
            {btn("#f1f5f9", "#64748b", "해제", null)}
        </div>
    );
}
