//utils.js: 유틸리티 함수 및 상수 정의

// ── 모바일 반응형 CSS ──────────────────────────
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

// ── 유틸리티 함수 ──────────────────────────────────────────
export const fmtD = s => s?.length >= 10 ? s.slice(5) : (s || "-");
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

// 오직 '품번(Item Code)'으로만 엄격하게 1:1 매칭
export function findInv(invData, itemCode) {
    if (!itemCode) return null;
    const cCode = str(itemCode).toUpperCase();
    return invData.find(r => str(r.품번).toUpperCase() === cCode) || null;
}

