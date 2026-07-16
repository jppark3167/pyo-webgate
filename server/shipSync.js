// shipSync.js — 구글 스프레드시트(뷰어 공개 또는 Apps Script 웹앱)에서 출하의뢰 데이터를 자동으로 가져와 파싱
// TSV 컬럼 순서: 납기일 / 거래처명 / 품명 / 품목번호 / 수량 / 비고 / (선택) 배송방법힌트("퀵"|"택배")
// 7번째 컬럼은 거래처명이 없는 출하_애니원 같은 탭(출하타입 컬럼)을 통합할 때만 채워 보낸다.
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

// TSV 텍스트 → 출하의뢰 데이터 배열
function parseShipText(text) {
    const rows = splitExportedTsv(text.trim());
    return rows.map(cols => {
        const c = cols.map(x => str(x));
        const row = {
            납기일자: normDate(c[0]),
            거래처명: c[1] || "",
            품목명: c[2] || "",
            품목번호: c[3] || "",
            수량: num(c[4]),
            비고: c[5] || "",
        };
        const hint = c[6] || "";
        if (hint === "퀵" || hint === "택배") row._배송방법힌트 = hint;   // 출하_애니원 등 출하타입 컬럼에서 넘어온 힌트
        return row;
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

// src/utils.js의 KNOWN_RECIPIENTS / normName / findKnownRecipient를 서버(CommonJS)에서도 쓰기 위해 그대로 이식
const KNOWN_RECIPIENTS = [
    { name: "애니원", address: "서울특별시 용산구 효창원로69나길 13 101호(효창동, 성부빌딩)", phone: "02-2138-6291" },
    { name: "티에스에스", address: "서울시 용산구 효창원로 64길 21 창미빌딩 1~2층 (효창동 5-427)", phone: "02-718-6291" },
    { name: "세이프", address: "경기도 구리시 동구릉로 427 1층 (사노동)", phone: "1522-7759" },
    { name: "티컴퍼니", address: "강원 횡성군 중앙로 13 2층 티컴퍼니", phone: "033-343-7761" },
];
const normName = s => str(s).replace(/\(주\)|\(㈜\)|㈜|주식회사/g, "").replace(/\s+/g, "");
function findKnownRecipient(name) {
    const n = normName(name);
    if (!n) return null;
    return KNOWN_RECIPIENTS.find(r => {
        const rn = normName(r.name);
        return n.includes(rn) || rn.includes(n);
    }) || null;
}

// 저장 식별자: src/utils.js quickKeyOf와 동일 규칙 (출하의뢰번호가 없는 시트 동기화 데이터는 항상 조합 키)
const quickKeyOf = row => `${str(row.거래처명)}_${str(row.품목번호)}_${str(row.납기일자)}`;

// _배송방법힌트가 있는 행(예: 출하_애니원의 출하타입="퀵") → 퀵 관리(quickData) 초기값 { key: value }
// 애니원처럼 주소록에 등록된 거래처는 주소/연락처도 함께 채운다 (사람이 "퀵으로 지정"을 눌렀을 때와 동일한 값 형태).
function buildQuickSeeds(parsedRows) {
    const seeds = {};
    parsedRows.forEach(row => {
        if (!row._배송방법힌트) return;
        const known = findKnownRecipient(row.거래처명);
        seeds[quickKeyOf(row)] = {
            method: row._배송방법힌트,
            address: known ? known.address : "",
            phone: known ? known.phone : "",
            boxCount: 0,
            상태: "창고대기",
            거래처명: row.거래처명 || "",
            품목명: row.품목명 || "",
            품목번호: row.품목번호 || "",
            규격: "",
            수량: row.수량 ?? "",
            납기일자: row.납기일자 || "",
            담당자: "",
            출하의뢰번호: "",
        };
    });
    return seeds;
}

module.exports = { parseShipText, fetchAndParseShipSheet, buildQuickSeeds };
