import { normDate, num, str } from "./utils.js";

// 아침 현재고에 전날까지의 출하 가능 물량은 이미 반영된 것으로 본다.
// 생산계획일과 무관하게 출하일자만 공급 가능일로 사용한다.
export function productionSchedule(items, today) {
    const map = {};
    for (const item of items) {
        const code = str(item.제품코드).toUpperCase();
        if (!code) continue;
        const date = normDate(item.출하일자);
        const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
        if (valid && date < today) continue;
        const planDate = normDate(item.생산계획일자);
        if (!valid && /^\d{4}-\d{2}-\d{2}$/.test(planDate) && planDate < today) continue;
        (map[code] ||= []).push({ date: valid ? date : "", qty: num(item.수량) });
    }
    return map;
}

export function productionSupply(arrivals, due = "") {
    const pending = arrivals.filter(a => a.date);
    return {
        inTime: pending.filter(a => !due || a.date <= due),
        late: pending.filter(a => due && a.date > due),
        undated: arrivals.filter(a => !a.date).reduce((sum, a) => sum + a.qty, 0),
    };
}
