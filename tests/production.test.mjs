import test from 'node:test';
import assert from 'node:assert/strict';
import { productionSchedule, productionSupply } from '../src/production.js';
import { fmtXlDate } from '../src/utils.js';

test('출하일자를 기준으로 당일 포함 공급을 배분한다', () => {
    const map = productionSchedule([
        { 제품코드: 'A', 생산계획일자: '2026-10-19', 출하일자: '2026-10-23', 수량: 20 },
        { 제품코드: 'A', 생산계획일자: '2026-10-21', 출하일자: '2026-10-21', 수량: 5 },
        { 제품코드: 'A', 출하일자: '2026-10-20', 수량: 100 },
    ], '2026-10-21');
    const result = productionSupply(map.A, '2026-10-22');
    assert.equal(result.inTime.reduce((s, a) => s + a.qty, 0), 5);
    assert.equal(result.late.reduce((s, a) => s + a.qty, 0), 20);
});

test('미정 물량은 표시용으로 보존하고 납기가 없어도 가용 공급에서 제외한다', () => {
    const map = productionSchedule([
        { 제품코드: 'A', 생산계획일자: '2026-10-23', 출하일자: '-', 수량: 35 },
        { 제품코드: 'A', 출하일자: '', 수량: 25 },
        { 제품코드: 'A', 생산계획일자: '2026-10-20', 출하일자: '', 수량: 100 },
    ], '2026-10-21');
    assert.deepEqual(productionSupply(map.A), { inTime: [], late: [], undated: 60 });
});

test('엑셀 문자열 날짜와 일정 미정을 정규화하고 잘못된 날짜는 거부한다', () => {
    assert.equal(fmtXlDate('2026. 10. 21'), '2026-10-21');
    assert.equal(fmtXlDate('2026/1/5'), '2026-01-05');
    assert.equal(fmtXlDate('-'), '');
    assert.throws(() => fmtXlDate('2026-02-30'));
});
