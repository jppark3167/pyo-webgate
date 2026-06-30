// HelperView.jsx: 출하 도우미 — 퀵 배송 출하의뢰 지정 + 주소/연락처/박스수 입력 및 거래처별 배송 라벨 조회
import { useState } from "react";
import { quickKeyOf, buildQuickValue, toDateStr, findKnownRecipient } from "../utils";
import { MethodChip } from "./ShipMethod";

// 보내는 사람 (고정값)
const SENDER = {
    lines: ["경기도 군포시 금정동 689-6", "한림벤처타운6층"],
    company: "(주)웹게이트",
    tel: "031-428-9302",
    mobile: "010-4367-3167",
};

const inputStyle = { fontSize: "0.8rem", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btn = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" });

// ── 퀵 지정 카드 (출하의뢰 한 건) ──────────────────
function QuickCard({ qkey, row, saved, onSave }) {
    const isQuick = saved?.method === "퀵";
    const known = findKnownRecipient(row.거래처명);   // 주소록에 있으면 자동 입력
    const [addr, setAddr] = useState(saved?.address || known?.address || "");
    const [phone, setPhone] = useState(saved?.phone || known?.phone || "");
    const [box, setBox] = useState(saved?.boxCount ? String(saved.boxCount) : "");

    // 도우미에서의 지정은 항상 출하방법 = "퀵"
    const commit = () => onSave(qkey, buildQuickValue(row, { method: "퀵", address: addr, boxCount: box, phone }));
    const release = () => onSave(qkey, null);
    const onEnter = e => { if (e.key === "Enter") e.currentTarget.blur(); };

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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {!isQuick && saved?.method && <MethodChip method={saved.method} />}
                    {isQuick
                        ? <button style={btn("#fee2e2", "#b91c1c")} onClick={release}>퀵 해제</button>
                        : <button style={btn("#4472C4", "#fff")} onClick={commit}>퀵 지정</button>}
                </div>
            </div>

            {isQuick && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input value={addr} onChange={e => setAddr(e.target.value)} onBlur={commit} onKeyDown={onEnter}
                        placeholder="배송 주소" style={{ ...inputStyle, flex: "1 1 220px", minWidth: 0 }} />
                    <input value={phone} onChange={e => setPhone(e.target.value)} onBlur={commit} onKeyDown={onEnter}
                        placeholder="연락처" style={{ ...inputStyle, flex: "0 1 150px", minWidth: 0 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input value={box} onChange={e => setBox(e.target.value.replace(/[^0-9]/g, ""))} onBlur={commit} onKeyDown={onEnter}
                            placeholder="0" inputMode="numeric" style={{ ...inputStyle, width: 64, textAlign: "right" }} />
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>박스</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── 거래처별 배송 라벨 (송장 형식) ─────────────────
const boxedLabel = { display: "inline-block", border: "1.5px solid #111", padding: "4px 12px", fontWeight: 700, fontSize: 15 };
const itemCell = { border: "1px solid #111", padding: "5px 10px", fontSize: 15, whiteSpace: "nowrap" };

function QuickLabel({ name, items }) {
    const labelId = "qlabel-" + name.replace(/[^a-zA-Z0-9가-힣]/g, "");
    const known = findKnownRecipient(name);   // 입력값이 없으면 주소록으로 보완
    const address = items.find(i => i.address)?.address || known?.address || "";
    const phone = items.find(i => i.phone)?.phone || known?.phone || "";
    const totalBox = items.reduce((s, i) => s + (Number(i.boxCount) || 0), 0);
    const method = items[0]?.method || "퀵";
    const today = toDateStr(new Date());

    const print = () => {
        const el = document.getElementById(labelId);
        if (!el) return;
        const w = window.open("", "_blank", "width=960,height=680");
        if (!w) return;
        w.document.write(`<html><head><title>배송 라벨 - ${name}</title></head><body style="margin:0;padding:16px;font-family:'Malgun Gothic',sans-serif;">${el.outerHTML}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 200);
    };

    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontWeight: 700, color: "#334155" }}>
                    {name} <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.8rem" }}>· {items.length}건 · {totalBox} Box</span>
                </div>
                <button style={btn("#1e3a5f", "#fff")} onClick={print}>🖨 인쇄</button>
            </div>

            <div style={{ overflowX: "auto" }}>
                <div id={labelId} style={{
                    border: "1.5px solid #111", background: "#fff", color: "#111",
                    width: 720, minHeight: 460, padding: 24, boxSizing: "border-box",
                    fontFamily: "'Malgun Gothic',sans-serif",
                    display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr",
                    columnGap: 24, rowGap: 28,
                }}>
                    {/* 보내는 사람 (1행 좌) */}
                    <div>
                        <span style={boxedLabel}>보내는 사람</span>
                        <span style={{ marginLeft: 14, fontSize: 13, fontWeight: 700 }}>{today}</span>
                        <div style={{ fontSize: 18, marginTop: 8 }}>{SENDER.lines[0]}</div>
                        <div style={{ fontSize: 18 }}>{SENDER.lines[1]}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{SENDER.company}</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{SENDER.tel}</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>{SENDER.mobile}</div>
                    </div>

                    {/* 품목 표 (1행 우) */}
                    <div style={{ justifySelf: "end" }}>
                        <table style={{ borderCollapse: "collapse" }}>
                            <tbody>
                                {items.map((it, i) => (
                                    <tr key={i}>
                                        <td style={{ ...itemCell, textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                                        <td style={{ ...itemCell, whiteSpace: "normal", minWidth: 170, maxWidth: 240, wordBreak: "break-all" }}>{it.품목명 || "-"}</td>
                                        <td style={{ ...itemCell, textAlign: "center", fontWeight: 700 }}>{it.수량 ?? "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 출하방법 + 박스수 (2행 좌, 세로 중앙) */}
                    <div style={{ alignSelf: "center", textAlign: "center" }}>
                        <div style={{ fontSize: 38, fontWeight: 700 }}>{method}</div>
                        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 18 }}>{totalBox} Box</div>
                    </div>

                    {/* 받는 사람 (2행 우, 하단 정렬) */}
                    <div style={{ alignSelf: "end" }}>
                        <span style={boxedLabel}>받는사람</span>
                        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 10, wordBreak: "keep-all" }}>{address || "(주소 미입력)"}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{name}</div>
                        {phone && <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{phone}</div>}
                    </div>
                </div>
            </div>
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

    const quickEntries = Object.entries(quick).filter(([, v]) => v?.method === "퀵");

    // 거래처명으로 그룹화 (배송 라벨 단위)
    const groups = {};
    quickEntries.forEach(([, v]) => {
        const name = v.거래처명 || "(거래처 미지정)";
        (groups[name] ||= []).push(v);
    });
    const groupList = Object.entries(groups);

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
                {tabBtn("list", `퀵 조회 (${groupList.length})`)}
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
                groupList.length === 0
                    ? <Empty text="퀵으로 지정된 출하의뢰가 없습니다." />
                    : groupList.map(([name, items]) => (
                        <QuickLabel key={name} name={name} items={items} />
                    ))
            )}
        </div>
    );
}
