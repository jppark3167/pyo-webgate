import * as XLSX from "xlsx";
import { fmtXlDate, str, num, parseExcelDynamic } from "./utils";

// 🏭 생산계획 파일 파싱 로직
export const processProdFile = (file, onSuccess, onError) => {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

            if (raw.length < 2) {
                onError("⚠️ 데이터가 충분하지 않거나 양식이 잘못되었습니다.");
                return;
            }

            let headerRowIdx = -1;
            let headers = [];

            for (let i = 0; i < Math.min(20, raw.length); i++) {
                const currentRow = raw[i].map(h => h ? String(h).replace(/\s+/g, '') : "");
                if (currentRow.includes("제품코드") || currentRow.includes("생산계획일자")) {
                    headerRowIdx = i;
                    headers = currentRow;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                onError("❌ 필수 헤더(생산계획 일자, 제품코드 등)를 찾을 수 없습니다. 엑셀 양식을 확인해주세요.");
                return;
            }

            const idx = {
                planDate: headers.findIndex(h => h.includes("생산계획일자")),
                shipDate: headers.findIndex(h => h.includes("출하일자")),
                customer: headers.findIndex(h => h.includes("고객명")),
                qty: headers.findIndex(h => h.includes("수량")),
                modelName: headers.findIndex(h => h.includes("모델명")),
                prodCode: headers.findIndex(h => h.includes("제품코드"))
            };

            // 원래 있으셨던 날짜 필터링 로직 유지
            const today = new Date("2026-06-08");
            today.setHours(0, 0, 0, 0);

            const parsedData = raw.slice(headerRowIdx + 1)
                .map(row => ({
                    생산계획일자: idx.planDate !== -1 ? fmtXlDate(row[idx.planDate]) : "",
                    출하일자: idx.shipDate !== -1 ? fmtXlDate(row[idx.shipDate]) : "",
                    고객명: idx.customer !== -1 ? str(row[idx.customer]) : "",
                    수량: idx.qty !== -1 ? num(row[idx.qty]) : 0,
                    모델명: idx.modelName !== -1 ? str(row[idx.modelName]) : "",
                    제품코드: idx.prodCode !== -1 ? str(row[idx.prodCode]) : ""
                }))
                .filter(item => {
                    if (!item.제품코드) return false;
                    if (item.생산계획일자) {
                        const itemDate = new Date(item.생산계획일자);
                        if (itemDate < today) return false;
                    } else {
                        return false;
                    }
                    return true;
                });

            onSuccess(parsedData);
        } catch (error) {
            console.error("Excel Parsing Error:", error);
            onError("❌ 생산계획 파일 파싱 중 오류가 발생했습니다.");
        }
    };
    reader.readAsArrayBuffer(file);
};

// 📦 재고현황 파일 파싱 로직
export const processInvFile = (file, onSuccess, onError) => {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const wb = XLSX.read(e.target.result, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

            // 유틸리티 함수의 동적 파싱 적용
            const parsed = parseExcelDynamic(raw, [
                ["품번", "품목코드", "품목번호", "제품코드", "ITEM_CODE"],
                ["재고수량", "현재고", "수량", "재고", "실재고"]
            ]);

            const mapped = parsed.map(r => ({
                품번: str(r["품번"] || r["품목코드"] || r["품목번호"] || r["제품코드"] || r["ITEM_CODE"]),
                품명: str(r["품명"] || r["품목명"] || r["ITEM_NAME"] || r["제품명"]),
                규격: str(r["규격"] || r["SPEC"] || r["스펙"]),
                재고수량: num(r["재고수량"] || r["현재고"] || r["수량"] || r["재고"] || r["실재고"]),
            })).filter(r => r.품번);

            if (mapped.length > 0) {
                onSuccess(mapped);
            } else {
                onError("⚠️ 재고현황 데이터를 찾을 수 없습니다.");
            }
        } catch (err) {
            onError("❌ 재고현황 파싱 오류: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
};