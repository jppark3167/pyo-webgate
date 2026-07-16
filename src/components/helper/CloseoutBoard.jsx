// CloseoutBoard.jsx: 출하 업무 — 일마감 (출하 내역 텍스트를 건별 채팅방 공유 양식으로 변환)
import { useState, useMemo } from "react";
import { toDateStr, parseTSV, str, stripCustomerPrefix } from "../../utils";
import { btn } from "./styles";
import { Empty } from "./shared";

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

// 입력 컬럼 순서: 거래처명 / 품명 / 품목번호 / 수량 / 결제 / 입금일자 / 비고 / 입력
export function CloseoutBoard() {
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
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>📤 일마감</div>
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
