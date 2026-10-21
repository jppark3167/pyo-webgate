import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyKce, kceSupplyMap } from '../src/kce.js';
const today = '2026-10-21';
test('미정과 지연은 확정 공급에서 제외한다', () => {
    const a = classifyKce({ 발주수량: 100, 미입고수: 100, _schedule: [{ date: '2026-10-19', qty: 60 }] }, today);
    assert.deepEqual(a, { arrivals: [], delayed: 60, undated: 40, remaining: 100, note: '' });
});
test('분할 입고 중 입고된 수량을 차감한다', () => {
    const a = classifyKce({ 발주수량: 100, 미입고수: 40, _schedule: [{ date: '2026-10-16', qty: 60 }] }, today);
    assert.equal(a.delayed, 0); assert.equal(a.undated, 40);
});
test('미입고 잔량을 초과하지 않으며 오늘 입고는 공급에 포함한다', () => {
    const a = classifyKce({ 발주수량: 100, 미입고수: 40, _schedule: [{ date: today, qty: 100 }] }, today);
    assert.deepEqual(a.arrivals, [{ date: today, qty: 40 }]);
});
test('같은 품목의 행별 입고 이력을 배분한 후 합산한다', () => {
    const a = kceSupplyMap([{ 품번: 'A', 발주수량: 100, 미입고수: 40, _schedule: [] }, { 품번: 'A', 발주수량: 10, 미입고수: 10, _schedule: [{ date: '2026-10-19', qty: 10 }] }], today);
    assert.equal(a.A.undated, 40); assert.equal(a.A.delayed, 10); assert.equal(a.A.arrivals.length, 0);
});
