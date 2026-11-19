import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { findShipmentInv } from '../src/utils.js';
const require = createRequire(import.meta.url);
const { parseShipText } = require('../server/shipSync.js');
const inventory = [{ 품번: 'KT1080D-IR24-F3.6-NTA-AHD', 품명: 'KT1080D-IR24-F3.6', 재고수량: 10 }];

test('애니원 모델명 출하를 실제 재고 품번으로 연결한다', () => {
    const rows = parseShipText('2026-11-19\t애니원\tKT1080D-IR24-F3.6\t\t10');
    assert.equal(rows.length, 1);
    const inv = findShipmentInv(inventory, rows[0]);
    assert.equal(inv, inventory[0]);
    assert.equal(inv.재고수량 - rows[0].수량, 0);
    assert.equal(findShipmentInv(inventory, { ...rows[0], 품목번호: '' }), inv);
});

test('품번 조회를 우선하고 다른 고객이나 모호한 모델은 연결하지 않는다', () => {
    const row = { 거래처명: '애니원', 품목명: 'KT1080D-IR24-F3.6' };
    assert.equal(findShipmentInv(inventory, { ...row, 품목번호: inventory[0].품번 }), inventory[0]);
    assert.equal(findShipmentInv(inventory, { ...row, 거래처명: '다른 고객' }), null);
    assert.equal(findShipmentInv(inventory, { ...row, 품목번호: '다른품번' }), null);
    assert.equal(findShipmentInv([...inventory, { ...inventory[0], 품번: '다른품번' }], row), null);
});
