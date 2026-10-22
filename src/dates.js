// 날짜를 생성한 뒤 원래 연/월/일과 비교해 자동 이월(10/32 등)을 금지한다.
function calendarDate(year, month, day) {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (year < 1900 || year > 9999 || d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function resolveMD(month, day, today = new Date()) {
    // 연도 없는 날짜는 기준일과 가장 가까운 연도로 추론한다.
    const year = today.getFullYear();
    const candidates = [year - 1, year, year + 1].map(y => calendarDate(y, month, day)).filter(Boolean);
    const base = Date.UTC(year, today.getMonth(), today.getDate());
    return candidates.sort((a, b) => Math.abs(Date.parse(a) - base) - Math.abs(Date.parse(b) - base))[0] || '';
}

function normDate(value, today = new Date()) {
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? calendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate()) : '';
    const t = String(value ?? '').trim();
    let m = t.match(/^(\d{4})\s*[-/.년]\s*(\d{1,2})\s*[-/.월]\s*(\d{1,2})(?:일)?(?=$|[^\d])/);
    if (m) return calendarDate(+m[1], +m[2], +m[3]);
    m = t.match(/^(\d{4})(\d{2})(\d{2})(?=$|[^\d])/);
    if (m) return calendarDate(+m[1], +m[2], +m[3]);
    m = t.match(/^(\d{1,2})\s*[/월]\s*(\d{1,2})(?:일)?(?=$|[^\d])/);
    return m ? resolveMD(+m[1], +m[2], today) : '';
}

function compareDueDates(a, b) {
    const da = normDate(a.납기일자), db = normDate(b.납기일자);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
}

function parseKceSchedule(memo, unreceived, today = new Date()) {
    if (!memo) return [];
    const text = String(memo);
    // 명시된 연도 전체를 먼저 읽어 2026/10/23의 일부를 월/일로 읽지 않는다.
    const dateToken = /(?<!\d)(?:(\d{4})\s*[-/.년]\s*)?(\d{1,2})\s*[/월.-]\s*(\d{1,2})(?:일)?(?!\d)/g;
    const matches = [...text.matchAll(dateToken)];
    const out = [];
    let previousEnd = 0;
    for (const m of matches) {
        const date = m[1] ? calendarDate(+m[1], +m[2], +m[3]) : resolveMD(+m[2], +m[3], today);
        if (!date) throw new Error(`유효하지 않은 입고예정일: ${m[0]}`);
        const before = text.slice(previousEnd, m.index);
        const qty = before.match(/(\d[\d,]*)\s*(?:대|개)\s*-?\s*$/);
        if (qty) out.push({ date, qty: Number(qty[1].replace(/,/g, '')) });
        else if (matches.length === 1) out.push({ date, qty: Number(unreceived) || 0 });
        else throw new Error(`분할 입고 수량과 날짜를 확인하세요: ${text}`);
        previousEnd = m.index + m[0].length;
    }
    return out;
}

export { calendarDate, normDate, resolveMD, compareDueDates, parseKceSchedule };
