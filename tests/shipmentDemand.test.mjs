import test from 'node:test';
import assert from 'node:assert/strict';
import { isPreDeducted, outstandingDemand } from '../src/shipmentDemand.js';

test('이미 차감된 선발행 건은 현재고에 더하거나 다시 빼지 않는다', () => {
    const row = { 결제: '100,000', 수량: 10 };
    assert.equal(isPreDeducted(row), true);
    assert.equal(20 - outstandingDemand(row), 20);
});
test('후결과 결제 공란은 출하 수요로 차감한다', () => {
    for (const 결제 of ['후결', ' 후결 ', '', undefined]) {
        assert.equal(outstandingDemand({ 결제, 수량: 10 }), 10);
    }
});
test('완료 건은 결제와 관계없이 다시 차감하지 않는다', () => {
    assert.equal(outstandingDemand({ 상태: '완료', 결제: '후결', 수량: 10 }), 0);
});
test('선발행과 후결 혼합 주문은 후결 수량만 누적한다', () => {
    const rows = [{ 결제: '100,000', 수량: 10 }, { 결제: '후결', 수량: 5 }];
    assert.equal(20 - rows.reduce((sum, row) => sum + outstandingDemand(row), 0), 15);
});
