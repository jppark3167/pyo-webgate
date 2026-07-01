//utils.js: 유틸리티 함수 및 상수 정의

// ── 모바일 반응형 CSS ──────────────────────────
export const globalCss = `
  .swipe-menu { overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none; }
  .swipe-menu::-webkit-scrollbar { display: none; }
  .home-card { transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
  .home-card:hover { transform: translateY(-4px); box-shadow: 0 12px 26px rgba(30,58,95,.14); }
  @media (max-width: 640px) {
    .header-title { font-size: 14px !important; }
    .header-btn { font-size: 11px !important; padding: 5px 10px !important; }
    .page-container { padding: 12px 10px !important; }
    .stat-btn { font-size: 11px !important; padding: 6px 10px !important; }
    .tab-btn { font-size: 12px !important; padding: 10px 10px !important; }
    .table-th, .table-td { font-size: 11px !important; padding: 6px 8px !important; }
    .home-card { width: 100% !important; height: 140px !important; }
  }
`;

// ── 유틸리티 함수 ──────────────────────────────────────────
export const fmtD = s => s?.length >= 10 ? s.slice(5) : (s || "-");
export const str = v => (v === null || v === undefined) ? "" : String(v).trim();
export const num = v => {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
};

// Date → "YYYY-MM-DD" (로컬 시간 기준; toISOString은 UTC라 KST에서 하루 밀릴 수 있어 사용하지 않음)
export function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function fmtXlDate(v) {
    if (!v && v !== 0) return "";
    if (typeof v === "string") return v.slice(0, 10).replace(/\./g, "-");
    if (typeof v === "number") {
        const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
        return d.toISOString().slice(0, 10);
    }
    if (v instanceof Date) return toDateStr(v);
    return String(v).slice(0, 10);
}

// 다양한 날짜 표기를 "YYYY-MM-DD"로 정규화 (- / . 구분자, YYYYMMDD 지원)
export function normDate(s) {
    if (!s && s !== 0) return "";
    if (s instanceof Date) return toDateStr(s);
    const t = String(s).trim();
    let m = t.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = t.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return t.slice(0, 10);
}

// "M/D" + 연도 추론 → "YYYY-MM-DD" (오늘 기준 6개월 이상 과거면 내년으로 간주 → 연말/연초 경계 처리)
export function resolveMD(month, day, today = new Date()) {
    const y = today.getFullYear();
    let d = new Date(y, month - 1, day);
    const sixAgo = new Date(today);
    sixAgo.setMonth(sixAgo.getMonth() - 6);
    if (d < sixAgo) d = new Date(y + 1, month - 1, day);
    return toDateStr(d);
}

// 엑셀에서 복사한 TSV 파싱 (따옴표로 묶인 셀 안의 줄바꿈/탭 보존)
export function parseTSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += c;
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === '\t') {
            row.push(field); field = "";
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field); rows.push(row); row = []; field = "";
        } else field += c;
    }
    if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(cell => str(cell) !== ""));
}

// KCE 입고예정일 메모를 입고 일정 [{date, qty}]로 파싱
// 예: "136대 6/2\n64대-7/3" → [{6/2,136},{7/3,64}],  단일 "7/3" → [{7/3, 미입고수}]
export function parseKceSchedule(memo, unreceived, today = new Date()) {
    if (!memo) return [];
    const out = [];
    const re = /(\d+)\s*대\s*-?\s*(\d{1,2})\/(\d{1,2})/g;
    let m;
    while ((m = re.exec(memo)) !== null) {
        out.push({ qty: parseInt(m[1], 10), date: resolveMD(+m[2], +m[3], today) });
    }
    if (out.length === 0) {
        const single = memo.match(/(\d{1,2})\/(\d{1,2})/);
        if (single) out.push({ qty: unreceived, date: resolveMD(+single[1], +single[2], today) });
    }
    return out;
}

// 오직 '품번(Item Code)'으로만 엄격하게 1:1 매칭
export function findInv(invData, itemCode) {
    if (!itemCode) return null;
    const cCode = str(itemCode).toUpperCase();
    return invData.find(r => str(r.품번).toUpperCase() === cCode) || null;
}

// ── 퀵/출하방법 (quickData) 공용 ───────────────────────────
// 출하방법 종류 + 칩 색상
export const SHIP_METHODS = [
    { key: "퀵", bg: "#dbeafe", color: "#1d4ed8" },
    { key: "택배", bg: "#dcfce7", color: "#15803d" },
    { key: "경동", bg: "#ede9fe", color: "#6d28d9" },
    { key: "직납", bg: "#f1f5f9", color: "#94a3b8" },   // 연하게 표시
];

// 출하방법 순환: 미지정 → 퀵 → 택배 → 경동 → 직납 → 미지정 (칩 클릭 시 다음 값)
export const nextShipMethod = (current) => {
    const cycle = [...SHIP_METHODS.map(m => m.key), null];
    const idx = cycle.indexOf(current ?? null);
    return cycle[(idx + 1) % cycle.length];
};

// 저장 식별자: 출하의뢰번호 우선, 없으면 거래처+품목번호+납기일자 (DashView 메모키와 동일 규칙)
export const quickKeyOf = (r) => str(r.출하의뢰번호) || `${str(r.거래처명)}_${str(r.품목번호)}_${str(r.납기일자)}`;

// 자주 쓰는 거래처 주소록 (하드코딩) — 거래처명 인식 시 주소/연락처 자동 입력
export const KNOWN_RECIPIENTS = [
    { name: "애니원", address: "서울특별시 용산구 효창원로69나길 13 101호(효창동, 성부빌딩)", phone: "02-2138-6291" },
    { name: "티에스에스", address: "서울시 용산구 효창원로 64길 21 창미빌딩 1~2층 (효창동 5-427)", phone: "02-718-6291" },
    { name: "세이프", address: "경기도 구리시 동구릉로 427 1층 (사노동)", phone: "1522-7759" },
];

// 거래처명 정규화: (주)/㈜/주식회사/공백 제거
const normName = (s) => str(s).replace(/\(주\)|\(㈜\)|㈜|주식회사/g, "").replace(/\s+/g, "");

// 거래처명으로 주소록 매칭 (부분 포함 허용)
export function findKnownRecipient(name) {
    const n = normName(name);
    if (!n) return null;
    return KNOWN_RECIPIENTS.find(r => {
        const rn = normName(r.name);
        return n.includes(rn) || rn.includes(n);
    }) || null;
}

// 저장 값 = 출하방법 + 주소/박스수 + 조회용 스냅샷 (출하 리스트가 바뀌어도 조회 가능하도록)
export function buildQuickValue(row, { method = "", address = "", boxCount = 0, phone = "" } = {}) {
    return {
        method,
        address: (address || "").trim(),
        phone: (phone || "").trim(),
        boxCount: Number(boxCount) || 0,
        거래처명: row.거래처명 || "",
        품목명: row.품목명 || "",
        품목번호: row.품목번호 || "",
        규격: row.규격 || "",
        수량: row.수량 ?? "",
        납기일자: row.납기일자 || "",
        담당자: row.담당자 || "",
        출하의뢰번호: row.출하의뢰번호 || "",
    };
}

