import { normDate, num, str, parseKceSchedule } from './utils.js';

// 입고된 수량은 오래된 분할 일정부터 소진된 것으로 배분한다.
// 잔량은 반드시 미입고수 이내로 제한하고 미확정/지연은 가용 공급에서 제외한다.
export function classifyKce(item, today) {
    const remaining = Math.max(0, num(item.미입고수 ?? item.발주요청));
    let received = Math.max(0, num(item.발주수량) - remaining);
    let budget = remaining;
    const arrivals = [];
    let delayed = 0;
    let source = item._schedule || [];
    let warning = '';
    if (str(item.입고예정일)) {
        try { source = parseKceSchedule(item.입고예정일, remaining, new Date(`${today}T12:00:00`)); }
        catch (error) { source = []; warning = error.message; }
    }
    const schedule = source.map(s => ({ date: normDate(s.date), qty: Math.max(0, num(s.qty)) }))
        .filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s.date)).sort((a, b) => a.date.localeCompare(b.date));
    // 단일 날짜 파서는 이미 미입고수만 일정 수량으로 반환한다.
    if (schedule.reduce((sum, s) => sum + s.qty, 0) <= remaining) received = 0;
    for (const s of schedule) {
        const consumed = Math.min(received, s.qty);
        received -= consumed;
        const qty = Math.min(budget, s.qty - consumed);
        budget -= qty;
        if (!qty) continue;
        if (s.date < today) delayed += qty;
        else arrivals.push({ date: s.date, qty });
    }
    return { arrivals, delayed, undated: budget, remaining, note: [str(item.비고), warning].filter(Boolean).join(' / ') };
}

export function kceSupplyMap(items, today) {
    const map = {};
    for (const item of items) {
        const code = str(item.품번).toUpperCase();
        if (!code) continue;
        const entry = map[code] ||= { arrivals: [], delayed: 0, undated: 0 };
        const result = classifyKce(item, today);
        entry.arrivals.push(...result.arrivals);
        entry.delayed += result.delayed;
        entry.undated += result.undated;
    }
    return map;
}
