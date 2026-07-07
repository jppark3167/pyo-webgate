// QuickBoard.jsx: 출하 업무 — 퀵 관리 (퀵 배송 출하의뢰 지정 + 주소/연락처/박스수 입력 + 거래처별 배송 라벨 조회/인쇄)
import { useState } from "react";
import { quickKeyOf, buildQuickValue, toDateStr, normDate, findKnownRecipient, SHIP_STAGES } from "../../utils";
import { MethodChip } from "../ShipMethod";
import { inputStyle, btn } from "./styles";
import { Empty } from "./shared";

// 보내는 사람 (고정값)
const SENDER = {
    lines: ["경기도 군포시 금정동 689-6", "한림벤처타운6층"],
    company: "(주)웹게이트",
    tel: "031-428-9302",
    mobile: "010-4367-3167",
};

// 자주 퀵으로 나가는 고정 거래처 — 버튼 한 번으로 해당 거래처 출하의뢰를 모두 퀵 지정
const QUICK_CUSTOMERS = ["애니원", "티에스에스", "세이프"];

// ── 퀵 지정 카드 (출하의뢰 한 건) ──────────────────
function QuickCard({ qkey, row, saved, onSave }) {
    const isQuick = saved?.method === "퀵";
    const known = findKnownRecipient(row.거래처명);   // 주소록에 있으면 자동 입력
    const [addr, setAddr] = useState(saved?.address || known?.address || "");
    const [phone, setPhone] = useState(saved?.phone || known?.phone || "");
    const [box, setBox] = useState(saved?.boxCount ? String(saved.boxCount) : "");
    // 출하 진행상태는 "출하 상태" 페이지에서 관리 — 여기서는 값을 지우지 않도록 그대로 유지만 함
    const stage = saved?.상태 || SHIP_STAGES[0].key;

    // 도우미에서의 지정은 항상 출하방법 = "퀵" (진행상태는 그대로 유지)
    const commit = () => onSave(qkey, buildQuickValue(row, { method: "퀵", address: addr, boxCount: box, phone, 상태: stage }));
    // 퀵 해제 — 진행상태를 이미 변경한 적이 있으면 그 기록은 보존하고 퀵 지정 정보만 지움
    const release = () => {
        if (stage !== SHIP_STAGES[0].key) {
            onSave(qkey, buildQuickValue(row, { method: "", address: "", boxCount: 0, phone: "", 상태: stage }));
        } else {
            onSave(qkey, null);
        }
    };
    const onEnter = e => { if (e.key === "Enter") e.currentTarget.blur(); };

    return (
        <div style={{
            background: "#fff",
            border: isQuick ? "1px solid #4472C4" : "1px solid #e2e8f0",
            borderLeft: isQuick ? "4px solid #4472C4" : "1px solid #e2e8f0",
            borderRadius: 8, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#334155", wordBreak: "keep-all" }}>{row.거래처명 || "-"}</div>
                    <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2, wordBreak: "break-all" }}>
                        {row.품목명}{row.규격 ? ` · ${row.규격}` : ""}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2, wordBreak: "break-all" }}>
                        납기 {row.납기일자 || "-"} · 수량 {row.수량 ?? "-"}{row.출하의뢰번호 ? ` · ${row.출하의뢰번호}` : ""}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
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

// 인쇄 페이지(A4 가로) 규격 — 화면상 라벨(px)을 여백 없이 이 크기에 맞춰 확대
const PAGE_W_MM = 297, PAGE_H_MM = 210;
const PX_TO_MM = 25.4 / 96;

function QuickLabel({ name, items, onRemove }) {
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
        // 라벨을 A4 가로 한 장에 여백 없이 꽉 차도록 비율 유지 확대
        const scale = Math.min(PAGE_W_MM / (el.offsetWidth * PX_TO_MM), PAGE_H_MM / (el.offsetHeight * PX_TO_MM));
        w.document.write(`<html><head><title>배송 라벨 - ${name}</title><style>
            @page { size: landscape; margin: 0; }
            html, body { margin: 0; padding: 0; }
            .no-print{ display: none !important; }
            .print-page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
            .print-scale { transform: scale(${scale}); }
        </style></head><body><div class="print-page"><div class="print-scale">${el.outerHTML}</div></div></body></html>`);
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
                    {/* 보내는 사람 (1행 좌, 좌측 정렬) */}
                    <div style={{ textAlign: "left" }}>
                        <span style={boxedLabel}>보내는 사람</span>
                        <span style={{ marginLeft: 14, fontSize: 13, fontWeight: 700 }}>{today}</span>
                        <div style={{ fontSize: 18, marginTop: 8 }}>{SENDER.lines[0]}</div>
                        <div style={{ fontSize: 18 }}>{SENDER.lines[1]}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{SENDER.company}</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{SENDER.tel}</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>{SENDER.mobile}</div>
                    </div>

                    {/* 품목 표 (1행 우, 받는사람과 좌측 시작점 일치) */}
                    <div style={{ justifySelf: "start" }}>
                        <table style={{ borderCollapse: "collapse" }}>
                            <tbody>
                                {items.map((it, i) => (
                                    <tr key={it._key || i}>
                                        <td style={{ ...itemCell, textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                                        <td style={{ ...itemCell, whiteSpace: "normal", minWidth: 170, maxWidth: 240, wordBreak: "break-all" }}>{it.품목명 || "-"}</td>
                                        <td style={{ ...itemCell, textAlign: "center", fontWeight: 700 }}>{it.수량 ?? "-"}</td>
                                        <td className="no-print" style={{ border: "none", padding: "0 0 0 4px", width: 20 }}>
                                            {it._manual && (
                                                <button className="no-print" onClick={() => onRemove?.(it._key)} title="수동 항목 삭제"
                                                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, fontWeight: 700, lineHeight: 1, padding: 0 }}>×</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 출하방법 + 박스수 (2행 좌, 세로 중앙) — 박스수는 공란으로 두고 수기 기입 */}
                    <div style={{ alignSelf: "center", textAlign: "center" }}>
                        <div style={{ fontSize: 38, fontWeight: 700 }}>{method}</div>
                        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 18 }}>
                            {totalBox > 0 ? `${totalBox} ` : "    "}Box
                        </div>
                    </div>

                    {/* 받는 사람 (2행 우, 하단·좌측 정렬) */}
                    <div style={{ alignSelf: "end", textAlign: "left" }}>
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

// ── 퀵 관리 (퀵 지정 탭 + 퀵 조회/라벨 인쇄 탭) ─────────────────
export function QuickBoard({ ships, quick, onSave }) {
    const [tab, setTab] = useState("assign");
    const [search, setSearch] = useState("");
    const [flash, setFlash] = useState("");
    const [manualForm, setManualForm] = useState({ name: "", product: "", qty: "" });

    // 수동 추가 항목도 기존 퀵 지정과 동일하게 quick 저장소(서버)에 저장 — 새로고침 후에도 유지됨
    const addManualItem = () => {
        const name = manualForm.name.trim();
        const product = manualForm.product.trim();
        const qty = manualForm.qty.trim();
        if (!name || !product || !qty) return;
        const key = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        onSave(key, { method: "퀵", 거래처명: name, 품목명: product, 수량: qty, _manual: true });
        setManualForm(f => ({ ...f, product: "", qty: "" }));
    };

    // 퀵 지정은 당일 납기(출하) 건만 대상으로 함
    const todayStr = toDateStr(new Date());
    const todaysShips = ships.filter(r => normDate(r.납기일자) === todayStr);

    // 특정 거래처의 출하의뢰 전부를 퀵으로 일괄 지정 (기존 주소·박스수는 보존, 없으면 주소록 자동 입력)
    const matchCustomer = (name) => todaysShips.filter(r => findKnownRecipient(r.거래처명)?.name === name);
    const assignCustomer = (name) => {
        const known = findKnownRecipient(name);
        const matches = matchCustomer(name);
        matches.forEach(row => {
            const ex = quick[quickKeyOf(row)] || {};
            onSave(quickKeyOf(row), buildQuickValue(row, {
                method: "퀵",
                address: ex.address || known?.address || "",
                phone: ex.phone || known?.phone || "",
                boxCount: ex.boxCount || 0,
            }));
        });
        setFlash(matches.length ? `${name} ${matches.length}건 퀵 지정 완료` : `${name} 출하의뢰가 없습니다`);
        setTimeout(() => setFlash(""), 2500);
    };

    const q = search.trim().toLowerCase();
    const filtered = q
        ? todaysShips.filter(r =>
            (r.거래처명 || "").toLowerCase().includes(q) ||
            (r.품목명 || "").toLowerCase().includes(q) ||
            (r.출하의뢰번호 || "").toLowerCase().includes(q))
        : todaysShips;

    const quickEntries = Object.entries(quick).filter(([, v]) => v?.method === "퀵");

    // 거래처명으로 그룹화 (배송 라벨 단위) — key를 붙여둬 수동 항목 삭제(onSave(key, null))에 사용
    const groups = {};
    quickEntries.forEach(([key, v]) => {
        const name = v.거래처명 || "(거래처 미지정)";
        (groups[name] ||= []).push({ ...v, _key: key });
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
        <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                {tabBtn("assign", "퀵 지정")}
                {tabBtn("list", `퀵 조회 (${groupList.length})`)}
                <span style={{ width: 1, height: 22, background: "#e2e8f0", margin: "0 2px" }} />
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>빠른 퀵 지정</span>
                {QUICK_CUSTOMERS.map(name => {
                    const cnt = matchCustomer(name).length;
                    return (
                        <button key={name} onClick={() => assignCustomer(name)} disabled={cnt === 0}
                            title={cnt === 0 ? "해당 거래처 출하의뢰 없음" : `${name} ${cnt}건을 모두 퀵으로 지정`}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: cnt === 0 ? "#f1f5f9" : "#e5f5fc",
                                color: cnt === 0 ? "#cbd5e1" : "#0b7bad",
                                border: "1px solid " + (cnt === 0 ? "#e2e8f0" : "#b6e3f7"),
                                borderRadius: 999, padding: "6px 12px", cursor: cnt === 0 ? "default" : "pointer",
                                fontSize: "0.78rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
                            }}>
                            ⚡ {name}{cnt > 0 && <span style={{ fontWeight: 600, opacity: 0.8 }}>· {cnt}</span>}
                        </button>
                    );
                })}
            </div>
            {flash && <div style={{ fontSize: "0.8rem", color: "#0b7bad", background: "#e5f5fc", border: "1px solid #b6e3f7", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontWeight: 600 }}>✓ {flash}</div>}

            {tab === "assign" ? (
                <>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                        오늘({todayStr}) 납기 출하의뢰만 표시됩니다.
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
                        : filtered.map((row, i) => {
                            const qkey = quickKeyOf(row);
                            return <QuickCard key={`${qkey}_${i}`} qkey={qkey} row={row} saved={quick[qkey]} onSave={onSave} />;
                        })}
                </>
            ) : (
                <>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>모델 수동 추가</span>
                        <input
                            value={manualForm.name}
                            onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
                            list="quick-group-names"
                            placeholder="거래처명"
                            style={{ ...inputStyle, flex: "1 1 140px", minWidth: 0 }} />
                        <datalist id="quick-group-names">
                            {groupList.map(([name]) => <option key={name} value={name} />)}
                        </datalist>
                        <input
                            value={manualForm.product}
                            onChange={e => setManualForm(f => ({ ...f, product: e.target.value }))}
                            placeholder="모델명"
                            style={{ ...inputStyle, flex: "1 1 160px", minWidth: 0 }} />
                        <input
                            value={manualForm.qty}
                            onChange={e => setManualForm(f => ({ ...f, qty: e.target.value.replace(/[^0-9]/g, "") }))}
                            placeholder="수량"
                            inputMode="numeric"
                            style={{ ...inputStyle, width: 70, textAlign: "right" }} />
                        <button
                            style={btn("#4472C4", "#fff")}
                            onClick={addManualItem}
                            disabled={!manualForm.name.trim() || !manualForm.product.trim() || !manualForm.qty.trim()}>
                            + 추가
                        </button>
                    </div>
                    {groupList.length === 0
                        ? <Empty text="퀵으로 지정된 출하의뢰가 없습니다." />
                        : groupList.map(([name, items]) => (
                            <QuickLabel key={name} name={name} items={items} onRemove={key => onSave(key, null)} />
                        ))}
                </>
            )}
        </>
    );
}
