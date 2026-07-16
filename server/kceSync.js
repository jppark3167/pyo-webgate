// kceSync.js — 구글 스프레드시트(뷰어 공개)에서 KCE 입고일정을 자동으로 가져와 파싱
// src/utils.js의 parseTSV / parseKceSchedule 로직을 서버(CommonJS)에서도 쓰기 위해 그대로 이식한 것.
// 프론트엔드 수동 붙여넣기(App.jsx handleKceParse)와 동일한 컬럼 규칙을 따른다:
// 품번 / 수량 / 발주일 / 입고예정일(메모) / 미입고수 / 담당자

const str = v => (v === null || v === undefined) ? "" : String(v).trim();
const num = v => {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
};

function toDateStr(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// "M/D" + 연도 추론 → "YYYY-MM-DD" (오늘 기준 6개월 이상 과거면 내년으로 간주)
function resolveMD(month, day, today) {
    const y = today.getFullYear();
    let d = new Date(y, month - 1, day);
    const sixAgo = new Date(today);
    sixAgo.setMonth(sixAgo.getMonth() - 6);
    if (d < sixAgo) d = new Date(y + 1, month - 1, day);
    return toDateStr(d);
}

// KCE 입고예정일 메모를 입고 일정 [{date, qty}]로 파싱 (src/utils.js와 동일 규칙)
function parseKceSchedule(memo, unreceived, today) {
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

// 탭 구분 텍스트 파싱 (따옴표로 묶인 셀 안의 줄바꿈/탭 보존) — src/utils.js와 동일
// ⚠ 이 함수는 "클립보드 복사→붙여넣기" 텍스트(App.jsx handleKceParse)에만 사용한다.
// 구글 시트 /export?format=tsv 응답은 CSV식 따옴표 이스케이프를 쓰지 않아서(그냥 원시 텍스트를
// 탭/개행으로만 구분), 메모 셀에 우연히 낱개 " 문자가 섞여 있으면 이 파서가 그걸 "따옴표로 묶인
// 셀의 시작"으로 오인해 그 뒤 수백 행을 통째로 한 필드에 삼켜버린다. 그래서 export 텍스트는
// splitExportedTsv()로 따로 파싱한다.
function parseTSV(text) {
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

// 구글 시트 export(TSV) 전용 파서 — 따옴표 이스케이프 없이 줄바꿈/탭으로만 분리.
// (주의: 셀 안에 실제 줄바꿈이 들어있는 경우까지는 처리하지 못하지만, 현재 시트 구조상 발생하지 않음)
function splitExportedTsv(text) {
    return text.split(/\r\n|\n|\r/)
        .map(line => line.split("\t"))
        .filter(r => r.some(cell => str(cell) !== ""));
}

// 구글 시트 공유/편집 링크 → TSV 내보내기 URL로 변환 (이미 export URL이면 그대로 사용)
// 비공개 시트는 Apps Script 웹앱 URL(script.google.com)을 그대로 써서 TSV를 반환받을 수도 있다.
function toExportUrl(sheetUrl) {
    if (/\/export\?/.test(sheetUrl)) return sheetUrl;
    if (/^https:\/\/script\.google\.com\//.test(sheetUrl)) return sheetUrl;
    const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) throw new Error("올바른 구글 시트 링크가 아닙니다.");
    const gidMatch = sheetUrl.match(/[?#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=tsv&gid=${gid}`;
}

// TSV 텍스트 → KCE 데이터 배열 (컬럼: 품번/수량/발주일/입고예정일/미입고수/담당자/KCE현황메모)
// 미입고수(E열)가 0이면 전량 입고 완료된 것이므로 제외하고, "발주취소"로 메모된 건도 제외한다.
function parseKceText(text) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = splitExportedTsv(text.trim());
    return rows.map(cols => {
        const c = cols.map(x => str(x));
        const 입고예정일 = c[3] || "";
        const 미입고수 = num(c[4]);
        return {
            품번: c[0],
            발주수량: num(c[1]),
            발주일: c[2] || "",
            입고예정일,
            미입고수,
            담당자: c[5] || "",
            비고: c[6] || "",
            _schedule: parseKceSchedule(입고예정일, 미입고수, today),
        };
    }).filter(item => item.품번 && item.미입고수 > 0 && !item.비고.includes("발주취소"));
}

// 구글 시트 링크에서 TSV를 받아와 파싱까지 완료
async function fetchAndParseKceSheet(sheetUrl) {
    const exportUrl = toExportUrl(sheetUrl);
    const res = await fetch(exportUrl, { redirect: "follow" });
    if (!res.ok) throw new Error(`시트 요청 실패 (${res.status}) — 링크 공개 범위를 확인하세요.`);
    const text = await res.text();
    // 비공개 시트는 종종 로그인 HTML 페이지를 200으로 반환하므로 형태로 감지
    if (/^\s*<!DOCTYPE html/i.test(text)) {
        throw new Error("시트 내용을 가져오지 못했습니다 — '링크가 있는 모든 사용자(뷰어)' 공개 설정을 확인하세요.");
    }
    return parseKceText(text);
}

module.exports = { parseTSV, splitExportedTsv, parseKceSchedule, parseKceText, toExportUrl, fetchAndParseKceSheet };
