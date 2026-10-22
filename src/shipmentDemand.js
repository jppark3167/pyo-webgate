import { str, num } from './utils.js';

// 결제 공란은 결제 정보를 제공하지 않는 출하 소스이므로 일반 수요로 처리한다.
export function isPreDeducted(row) {
    const payment = str(row.결제);
    return payment !== '' && payment !== '후결';
}

export function outstandingDemand(row) {
    if (str(row.상태) === '완료' || isPreDeducted(row)) return 0;
    return num(row.수량);
}
