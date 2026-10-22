import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as dates from '../src/dates.js';
import { classifyKce } from '../src/kce.js';
const server = createRequire(import.meta.url)('../server/dates.js');
const kceServer = createRequire(import.meta.url)('../server/kceSync.js');
const today = new Date(2026, 9, 22);

test('서버와 프론트에서 연도 포함 날짜를 동일하게 해석한다', () => {
    for (const api of [dates, server]) {
        for (const input of ['2026/10/23', '2026-10-23', '2026. 10. 23', '2026년 10월 23일']) {
            assert.equal(api.normDate(input, today), '2026-10-23');
            assert.deepEqual(api.parseKceSchedule(input, 50, today), [{ date: '2026-10-23', qty: 50 }]);
        }
    }
});
test('월일 표기는 연말연초에 가장 가까운 연도로 추론한다', () => {
    for (const api of [dates, server]) {
        assert.equal(api.resolveMD(1, 5, new Date(2026, 11, 22)), '2027-01-05');
        assert.equal(api.resolveMD(12, 28, new Date(2027, 0, 5)), '2026-12-28');
        assert.equal(api.normDate('10월 22일 (목)', today), '2026-10-22');
    }
});
test('잘못된 날짜는 이월하지 않고 거부한다', () => {
    for (const api of [dates, server]) {
        for (const text of ['10/32', '13/1', '2026/2/29']) assert.throws(() => api.parseKceSchedule(text, 50, today));
        assert.equal(api.normDate('2026-02-30'), '');
        assert.equal(api.normDate('2028-02-29'), '2028-02-29');
    }
});
test('분할 입고의 대/개 수량과 날짜를 연결한다', () => {
    for (const api of [dates, server]) {
        assert.deepEqual(api.parseKceSchedule('24개 10/23 56개 10/28', 80, today), [{date:'2026-10-23',qty:24},{date:'2026-10-28',qty:56}]);
        assert.deepEqual(api.parseKceSchedule('136대 10/23 64대-11/3', 200, today), [{date:'2026-10-23',qty:136},{date:'2026-11-03',qty:64}]);
        assert.throws(() => api.parseKceSchedule('10/23 20대 10/28 30대', 50, today));
    }
});
test('표기가 다른 납기를 정규화해 시간순으로 배분한다', () => {
    const rows = [{납기일자:'2026-10-23',수량:50},{납기일자:'2026/10/22',수량:50}].sort(dates.compareDueDates);
    let demand = 0;
    const projected = rows.map(r => (dates.normDate(r.납기일자) >= '2026-10-23' ? 100 : 0) - (demand += r.수량));
    assert.deepEqual(projected, [-50, 0]);
});
test('기존 저장 일정도 원문으로 다시 해석하고 오류는 미정으로 분리한다', () => {
    assert.equal(classifyKce({입고예정일:'2026/10/23',발주수량:50,미입고수:50,_schedule:[{date:'2028-02-10',qty:50}]},'2026-10-22').arrivals[0].date, '2026-10-23');
    const result = classifyKce({입고예정일:'10/32',발주수량:50,미입고수:50,_schedule:[{date:'2026-11-01',qty:50}]},'2026-10-22');
    assert.equal(result.undated, 50);
    assert.match(result.note, /유효하지 않은/);
});

test('완료 및 취소 건의 과거 메모는 동기화를 막지 않는다', () => {
    const text = 'A\t50\t10/1\t8/8 > 8/4\t0\t담당\t\nB\t50\t10/1\t10/32\t50\t담당\t발주 취소';
    assert.deepEqual(kceServer.parseKceText(text), []);
});

test('잘못된 날짜의 활성 입고 건은 동기화 저장 전에 오류로 반환한다', () => {
    assert.throws(() => kceServer.parseKceText('A\t50\t10/1\t2026/10/32\t50\t담당'), /유효하지 않은/);
});
