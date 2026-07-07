// HelperView.jsx: 출하 업무 — 하위 기능(퀵 관리/출하 상태/일마감/재고 검색) 분기 셸
import { useState } from "react";
import { ModeSelect } from "./helper/ModeSelect";
import { QuickBoard } from "./helper/QuickBoard";
import { StatusBoard } from "./helper/StatusBoard";
import { CloseoutBoard } from "./helper/CloseoutBoard";
import { InvSearch } from "./helper/InvSearch";

export function HelperView({ ships = [], quick = {}, onSave, invItems = [] }) {
    const [mode, setMode] = useState("home");

    // ── 홈: 하위 기능 분기 카드 ──────────────
    if (mode === "home") {
        // "퀵 관리" 카드 배지에 표시할 개수 — 퀵으로 지정된 항목의 거래처 그룹 수 (QuickBoard의 배송 라벨 그룹과 동일 기준)
        const quickGroupNames = new Set();
        Object.values(quick).forEach(v => {
            if (v?.method === "퀵") quickGroupNames.add(v.거래처명 || "(거래처 미지정)");
        });

        return (
            <div style={{ textAlign: "left" }}>
                <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>출하 업무</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 2 }}>작업을 선택하세요</div>
                </div>
                <ModeSelect onSelect={setMode} quickCount={quickGroupNames.size} />
            </div>
        );
    }

    return (
        <div style={{ textAlign: "left" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => setMode("home")} style={{
                    background: "#fff", color: "#475569", border: "1px solid #cbd5e1",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
                }}>← 뒤로</button>
            </div>

            {mode === "quick" && <QuickBoard ships={ships} quick={quick} onSave={onSave} />}
            {mode === "status" && <StatusBoard ships={ships} quick={quick} onSave={onSave} />}
            {mode === "closeout" && <CloseoutBoard />}
            {mode === "inv" && <InvSearch invItems={invItems} />}
        </div>
    );
}
