// HelperView.jsx: 출하 도우미 — 퀵 배송 출하의뢰 지정 + 주소/박스수 입력 및 조회
import { useState } from "react";

// 저장 식별자: 출하의뢰번호 우선, 없으면 거래처+품목번호+납기일자 (DashView 메모키와 동일 규칙)
const quickKeyOf = (r) => r.출하의뢰번호 || `${r.거래처명}_${r.품목번호}_${r.납기일자}`;

// 저장 값 = 주소/박스수 + 조회용 스냅샷 (출하 리스트가 바뀌어도 조회 가능하도록)
const buildValue = (row, address, boxCount) => ({
    address: (address || "").trim(),
    boxCount: Number(boxCount) || 0,
    거래처명: row.거래처명 || "",
    품목명: row.품목명 || "",
    규격: row.규격 || "",
    수량: row.수량 ?? "",
    납기일자: row.납기일자 || "",
    담당자: row.담당자 || "",
    출하의뢰번호: row.출하의뢰번호 || "",
});

const inputStyle = { fontSize: "0.8rem", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btn = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" });

function QuickCard({ qkey, row, saved, onSave }) {
    const isQuick = !!saved;
    const [addr, setAddr] = useState(saved?.address || "");
    const [box, setBox] = useState(saved?.boxCount ? String(saved.boxCount) : "");

    const commit = () => onSave(qkey, buildValue(row, addr, box));
    const release = () => onSave(qkey, null);

    return (
        <div style={{
            background: "#fff",
            border: isQuick ? "1px solid #4472C4" : "1px solid #e2e8f0",
            borderLeft: isQuick ? "4px solid #4472C4" : "1px solid #e2e8f0",
            borderRadius: 8, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#334155" }}>{row.거래처명 || "-"}</div>
                    <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2, wordBreak: "break-all" }}>
                        {row.품목명}{row.규격 ? ` · ${row.규격}` : ""}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>
                        납기 {row.납기일자 || "-"} · 수량 {row.수량 ?? "-"}{row.출하의뢰번호 ? ` · ${row.출하의뢰번호}` : ""}
                    </div>
                </div>
                {isQuick
                    ? <button style={btn("#fee2e2", "#b91c1c")} onClick={release}>퀵 해제</button>
                    : <button style={btn("#4472C4", "#fff")} onClick={commit}>퀵 지정</button>}
            </div>

            {isQuick && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                        value={addr}
                        onChange={e => setAddr(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        placeholder="배송 주소 입력"
                        style={{ ...inputStyle, flex: "1 1 240px", minWidth: 0 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                            value={box}
                            onChange={e => setBox(e.target.value.replace(/[^0-9]/g, ""))}
                            onBlur={commit}
                            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            placeholder="0" inputMode="numeric"
                            style={{ ...inputStyle, width: 64, textAlign: "right" }} />
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>박스</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function Empty({ text }) {
    return <div style={{ background: "#fff", borderRadius: 12, padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>{text}</div>;
}

export function HelperView({ ships = [], quick = {}, onSave }) {
    const [tab, setTab] = useState("assign");
    const [search, setSearch] = useState("");

    const q = search.trim().toLowerCase();
    const filtered = q
        ? ships.filter(r =>
            (r.거래처명 || "").toLowerCase().includes(q) ||
            (r.품목명 || "").toLowerCase().includes(q) ||
            (r.출하의뢰번호 || "").toLowerCase().includes(q))
        : ships;

    const quickEntries = Object.entries(quick);

    const tabBtn = (key, label) => (
        <button onClick={() => setTab(key)} style={{
            background: tab === key ? "#1e3a5f" : "#fff", color: tab === key ? "#fff" : "#475569",
            border: "1px solid " + (tab === key ? "#1e3a5f" : "#cbd5e1"),
            borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
        }}>{label}</button>
    );

    return (
        <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {tabBtn("assign", "퀵 지정")}
                {tabBtn("list", `퀵 조회 (${quickEntries.length})`)}
            </div>

            {tab === "assign" ? (
                <>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="거래처 · 품목 · 출하의뢰번호 검색"
                        style={{ ...inputStyle, width: "100%", padding: "9px 12px", marginBottom: 12 }} />
                    {filtered.length === 0
                        ? <Empty text={ships.length === 0 ? "출하의뢰 데이터가 없습니다. 먼저 출하의뢰를 업로드하세요." : "검색 결과가 없습니다."} />
                        : filtered.map((row, i) => {
                            const qkey = quickKeyOf(row);
                            return <QuickCard key={`${qkey}_${i}`} qkey={qkey} row={row} saved={quick[qkey]} onSave={onSave} />;
                        })}
                </>
            ) : (
                quickEntries.length === 0
                    ? <Empty text="퀵으로 지정된 출하의뢰가 없습니다." />
                    : quickEntries.map(([qkey, value]) => (
                        <QuickCard key={qkey} qkey={qkey} row={value} saved={value} onSave={onSave} />
                    ))
            )}
        </div>
    );
}
