// HelperView.jsx: 출하 업무 — 퀵 배송 출하의뢰 지정 + 주소/연락처/박스수 입력 및 거래처별 배송 라벨 조회 + 재고 검색 + 일마감
import { useState, useMemo } from "react";
import { quickKeyOf, buildQuickValue, toDateStr, normDate, findKnownRecipient, SHIP_STAGES, SHIP_STAGE_DONE, nextShipStage, parseTSV, str } from "../utils";
import { MethodChip, StageCycleChip } from "./ShipMethod";
import { renderStatusBadge } from "./StatusBadge";
import { useIsMobile } from "./useIsMobile";
import { tableStyle, theadTrStyle, theadStyle, thStyle, tbodyTrStyle, tdStyle } from "./styles";

// 보내는 사람 (고정값)
const SENDER = {
    lines: ["경기도 군포시 금정동 689-6", "한림벤처타운6층"],
    company: "(주)웹게이트",
    tel: "031-428-9302",
    mobile: "010-4367-3167",
};

const inputStyle = { fontSize: "0.8rem", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btn = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" });

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
                            {totalBox > 0 ? `${totalBox} ` : "    "}Box
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

function Empty({ text }) {
    return <div style={{ background: "#fff", borderRadius: 12, padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>{text}</div>;
}

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

// ── 재고 검색 (품번/품명으로 현재고·입고예정·예상재고 조회) ──────
function InvSearch({ invItems }) {
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

// ── 출하 상태 (오늘 납기 출하의뢰 전체의 진행상태 확인/변경 — 완료 건은 아래로 분리) ──
function StatusBoard({ ships, quick, onSave }) {
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

// 거래처명 앞 괄호 접두어(예: "(유통)") 제거
const stripCustomerPrefix = (name) => str(name).replace(/^\([^)]*\)\s*/, "");

// 채팅방 공유 텍스트에 표기할 출하방법 — 비고의 [태그] 내용과 무관하게 항상 "택배"로 고정
const CLOSEOUT_METHOD = "택배";

// 비고 분석 — [태그]에 "퀵"이 포함되면 이 건은 결과에서 제외(퀵은 출하 상태 페이지에서 별도 관리),
// 그 외 [태그]가 있으면 뒤의 당지명을 추출 (예: "[직송]그린전기" → "그린전기"), [태그] 자체가 없으면 dest: null
function parseCloseoutNote(note) {
    const m = str(note).match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!m) return { skip: false, dest: null };
    if (m[1].includes("퀵")) return { skip: true, dest: null };
    return { skip: false, dest: m[2].trim() };
}

// 클립보드 복사 — Clipboard API 우선, 실패 시(비보안 컨텍스트 등) execCommand로 대체
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
}

// ── 일마감 항목 (건별 채팅방 공유 텍스트 + 복사 버튼) ──────────
function CloseoutEntry({ text }) {
    const [state, setState] = useState("idle");   // idle | copied | failed
    const copy = async () => {
        const ok = await copyText(text);
        setState(ok ? "copied" : "failed");
        setTimeout(() => setState("idle"), 1500);
    };
    const label = state === "copied" ? "✓ 복사됨" : state === "failed" ? "복사 실패" : "복사";
    const colors = state === "copied" ? ["#dcfce7", "#15803d"] : state === "failed" ? ["#fee2e2", "#b91c1c"] : ["#f1f5f9", "#475569"];
    return (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,.04)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "0.82rem", color: "#334155", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{text}</pre>
            <button style={btn(colors[0], colors[1])} onClick={copy}>{label}</button>
        </div>
    );
}

// ── 일마감 (출하 내역 텍스트를 건별 채팅방 공유 양식으로 변환) ──────
// 입력 컬럼 순서: 거래처명 / 품명 / 품목번호 / 수량 / 결제 / 입금일자 / 비고 / 입력
function CloseoutBoard() {
    const [text, setText] = useState("");
    const todayStr = toDateStr(new Date());

    const entries = useMemo(() => {
        if (!text.trim()) return [];
        return parseTSV(text.trim()).map(cols => {
            const c = cols.map(x => str(x));
            const 거래처명 = stripCustomerPrefix(c[0]);
            const 품명 = c[1] || "";
            const 수량 = c[3] || "";
            if (!거래처명 || !품명) return null;
            const { skip, dest } = parseCloseoutNote(c[6]);
            if (skip) return null;
            const header = dest !== null
                ? (dest ? `${todayStr}-${CLOSEOUT_METHOD}-${거래처명}-${dest}` : `${todayStr}-${CLOSEOUT_METHOD}-${거래처명}`)
                : `${todayStr}-${거래처명}`;
            return `${header}\n${품명} (${수량})`;
        }).filter(Boolean);
    }, [text, todayStr]);

    const [copyAllState, setCopyAllState] = useState("idle");
    const copyAll = async () => {
        const ok = await copyText(entries.join("\n\n"));
        setCopyAllState(ok ? "copied" : "failed");
        setTimeout(() => setCopyAllState("idle"), 1500);
    };
    const copyAllLabel = copyAllState === "copied" ? "✓ 복사됨" : copyAllState === "failed" ? "복사 실패" : "전체 복사";

    return (
        <>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                엑셀에서 복사한 출하 내역(거래처명 · 품명 · 품목번호 · 수량 · 결제 · 입금일자 · 비고 · 입력)을 붙여넣으면 건별로 채팅방 공유용 텍스트를 만들어 줍니다.
            </div>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="엑셀에서 복사한 출하 내역을 붙여넣으세요..."
                style={{ width: "100%", height: 140, padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.8125rem", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }} />
            {entries.length === 0
                ? <Empty text="변환할 출하 내역을 위에 붙여넣으세요." />
                : <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>{entries.length}건</span>
                        <button style={btn("#1e3a5f", "#fff")} onClick={copyAll}>{copyAllLabel}</button>
                    </div>
                    {entries.map((e, i) => <CloseoutEntry key={i} text={e} />)}
                </>}
        </>
    );
}

// ── 출하 업무 내부 분기 (퀵 관리 / 출하 상태 / 일마감 / 재고 검색) ──────────────
const MODE_CARDS = [
    { key: "quick", title: "퀵 관리", desc: "퀵 지정 · 조회 · 라벨 인쇄", emoji: "⚡", accent: "#4472C4", tint: "#eef2fc" },
    { key: "status", title: "출하 상태", desc: "출하 진행 상태 확인 · 변경", emoji: "🚦", accent: "#f59e0b", tint: "#fef3c7" },
    { key: "closeout", title: "일마감", desc: "출하 내역을 채팅방 공유 양식으로 변환", emoji: "📤", accent: "#059669", tint: "#d1fae5" },
    { key: "inv", title: "재고 검색", desc: "품번 · 품명으로 예상재고 조회", emoji: "📦", accent: "#0b7bad", tint: "#e5f5fc" },
];

function ModeSelect({ onSelect, quickCount }) {
    return (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {MODE_CARDS.map(({ key, title, desc, emoji, accent, tint }) => (
                <button key={key} onClick={() => onSelect(key)} style={{
                    background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${accent}`,
                    borderRadius: 14, width: 230, height: 150, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
                    gap: 6, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,.06)", fontFamily: "inherit", textAlign: "left",
                }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>
                        {title}{key === "quick" && quickCount > 0 && <span style={{ marginLeft: 6, fontSize: "0.75rem", color: accent, fontWeight: 700 }}>· {quickCount}건</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{desc}</div>
                </button>
            ))}
        </div>
    );
}

export function HelperView({ ships = [], quick = {}, onSave, invItems = [] }) {
    const [mode, setMode] = useState("home");
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

    // ── 홈: 퀵 관리 / 재고 검색 분기 카드 ──────────────
    if (mode === "home") {
        return (
            <div style={{ textAlign: "left" }}>
                <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>출하 업무</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 2 }}>작업을 선택하세요</div>
                </div>
                <ModeSelect onSelect={setMode} quickCount={groupList.length} />
            </div>
        );
    }

    const backBtn = (
        <button onClick={() => setMode("home")} style={{
            background: "#fff", color: "#475569", border: "1px solid #cbd5e1",
            borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
        }}>← 뒤로</button>
    );

    return (
        <div style={{ textAlign: "left" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                {backBtn}
                <span style={{ width: 1, height: 22, background: "#e2e8f0", margin: "0 2px" }} />
                {mode === "quick" && <>
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
                </>}
                {mode === "inv" && <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>📦 재고 검색</span>}
                {mode === "status" && <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>🚦 출하 상태</span>}
                {mode === "closeout" && <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>📤 일마감</span>}
            </div>
            {flash && <div style={{ fontSize: "0.8rem", color: "#0b7bad", background: "#e5f5fc", border: "1px solid #b6e3f7", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontWeight: 600 }}>✓ {flash}</div>}

            {mode === "inv" ? (
                <InvSearch invItems={invItems} />
            ) : mode === "status" ? (
                <StatusBoard ships={ships} quick={quick} onSave={onSave} />
            ) : mode === "closeout" ? (
                <CloseoutBoard />
            ) : tab === "assign" ? (
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
        </div>
    );
}
