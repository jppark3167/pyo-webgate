// shipSync.js — 구글 스프레드시트(뷰어 공개)에서 출하의뢰 데이터를 자동으로 가져와 파싱
// 시트 컬럼 순서: 납기일 / 거래처명 / 품명 / 품목번호 / 수량 / 비고
// kceSync.js의 export URL 변환·TSV 분리 로직을 그대로 재사용한다.

const { splitExportedTsv, toExportUrl } = require("./kceSync");

const str = v => (v === null || v === undefined) ? "" : String(v).trim();
const num = v => {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
};

// 다양한 날짜 표기를 "YYYY-MM-DD"로 정규화 (src/utils.js normDate와 동일 규칙)
function normDate(s) {
    if (!s) return "";
    const t = String(s).trim();
    let m = t.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = t.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return t.slice(0, 10);
}

// TSV 텍스트 → 출하의뢰 데이터 배열 (컬럼: 납기일/거래처명/품명/품목번호/수량/비고)
function parseShipText(text) {
    const rows = splitExportedTsv(text.trim());
    return rows.map(cols => {
        const c = cols.map(x => str(x));
        return {
            납기일자: normDate(c[0]),
            거래처명: c[1] || "",
            품목명: c[2] || "",
            품목번호: c[3] || "",
            수량: num(c[4]),
            비고: c[5] || "",
        };
    }).filter(item => item.품목번호 && item.품목번호 !== "품목번호" && item.거래처명 !== "거래처명");
}

// 구글 시트 링크에서 TSV를 받아와 파싱까지 완료
async function fetchAndParseShipSheet(sheetUrl) {
    const exportUrl = toExportUrl(sheetUrl);
    const res = await fetch(exportUrl, { redirect: "follow" });
    if (!res.ok) throw new Error(`시트 요청 실패 (${res.status}) — 링크 공개 범위를 확인하세요.`);
    const text = await res.text();
    if (/^\s*<!DOCTYPE html/i.test(text)) {
        throw new Error("시트 내용을 가져오지 못했습니다 — '링크가 있는 모든 사용자(뷰어)' 공개 설정을 확인하세요.");
    }
    return parseShipText(text);
}

module.exports = { parseShipText, fetchAndParseShipSheet };
