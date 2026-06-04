// ── 모바일 반응형을 위한 내부 CSS ──────────────────────────
export const globalCss = `
  .swipe-menu { overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none; }
  .swipe-menu::-webkit-scrollbar { display: none; }
  @media (max-width: 640px) {
    .header-title { font-size: 14px !important; }
    .header-btn { font-size: 11px !important; padding: 5px 10px !important; }
    .page-container { padding: 12px 10px !important; }
    .stat-btn { font-size: 11px !important; padding: 6px 10px !important; }
    .tab-btn { font-size: 12px !important; padding: 10px 10px !important; }
    .table-th, .table-td { font-size: 11px !important; padding: 6px 8px !important; }
  }
`;

// ── 유틸리티 함수 및 상수 ──────────────────────────────────
export const fmtD = s => s?.length >= 10 ? s.slice(5) : (s || "-");
export const fmtN = n => (typeof n === "number") ? n.toLocaleString("ko-KR") : (n ?? "-");
export const str = v => (v === null || v === undefined) ? "" : String(v).trim();
export const num = v => {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
};

export function fmtXlDate(v) {
    if (!v && v !== 0) return "";
    if (typeof v === "string") return v.slice(0, 10).replace(/\./g, "-");
    if (typeof v === "number") {
        const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
        return d.toISOString().slice(0, 10);
    }
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
}

export function parseExcelDynamic(rawArray, keyIdentifiers) {
    let headerIdx = -1;
    let headers = [];
    for (let i = 0; i < Math.min(30, rawArray.length); i++) {
        if (!rawArray[i]) continue;
        const rowStr = rawArray[i].join("").replace(/\s/g, "");
        if (keyIdentifiers.every(k => Array.isArray(k) ? k.some(subKey => rowStr.includes(subKey)) : rowStr.includes(k))) {
            headerIdx = i;
            headers = rawArray[i].map(h => str(h).replace(/\n|\r/g, ""));
            break;
        }
    }
    if (headerIdx === -1) return [];

    const data = [];
    for (let i = headerIdx + 1; i < rawArray.length; i++) {
        const row = rawArray[i];
        if (!row || row.length === 0 || !row.some(c => c)) continue;
        const firstCell = str(row[0]).toUpperCase();
        if (firstCell.includes("TOTAL") || firstCell.includes("합계") || firstCell.includes("총계")) continue;
        const obj = {};
        headers.forEach((colName, idx) => { if (colName) obj[colName] = row[idx]; });
        data.push(obj);
    }
    return data;
}

export function findInv(invData, itemCode) {
    if (!itemCode) return null;
    const cCode = str(itemCode).toUpperCase();
    return invData.find(r => str(r.품번).toUpperCase() === cCode) || null;
}

export function shipStatus(invQty, needed) {
    if (invQty === null || invQty === undefined) return "unknown";
    if (invQty < 0) return "neg";
    if (invQty >= needed) return "ok";
    return "shortage";
}

export const STATUS = {
    ok: { bg: "#dcfce7", bdr: "#86efac", txt: "#166534", label: "출하가능" },
    shortage: { bg: "#fee2e2", bdr: "#fca5a5", txt: "#991b1b", label: "재고부족" },
    neg: { bg: "#fff1f2", bdr: "#fda4af", txt: "#9f1239", label: "마이너스" },
    unknown: { bg: "#fef9c3", bdr: "#fde047", txt: "#713f12", label: "미확인" },
};

export const TH = { background: "#f8fafc", padding: "8px 10px", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
export const TD = { padding: "8px 10px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", whiteSpace: "nowrap" };

export const loadData = (key) => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
};