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
// 📦 재고현황 파일 파싱 로직 (개선본)
export const processInvFile = (file, onSuccess, onError) => {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const wb = XLSX.read(e.target.result, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

            if (raw.length < 2) {
                onError("⚠️ 데이터가 충분하지 않거나 양식이 잘못되었습니다.");
                return;
            }

            let headerRowIdx = -1;
            let headers = [];

            // 1. 최대 20번째 줄까지 탐색하여 실제 헤더(제목 표시줄) 찾기
            for (let i = 0; i < Math.min(20, raw.length); i++) {
                // 공백을 제거하여 비교를 쉽게 만듦
                const currentRow = raw[i].map(h => h ? String(h).replace(/\s+/g, '') : "");

                // '품번' 관련 단어와 '재고' 관련 단어가 모두 있는 줄을 헤더로 인식
                const hasItemCode = currentRow.some(h => h.includes("품번") || h.includes("품목코드") || h.includes("제품코드") || h.toUpperCase().includes("ITEM"));
                const hasQty = currentRow.some(h => h.includes("재고") || h.includes("수량") || h.includes("현재고"));

                if (hasItemCode && hasQty) {
                    headerRowIdx = i;
                    headers = currentRow;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                onError("❌ 필수 헤더(품번, 재고수량 등)를 찾을 수 없습니다. 엑셀 양식을 확인해주세요.");
                return;
            }

            // 2. 정확한 컬럼 인덱스 찾기
            const idx = {
                itemCode: headers.findIndex(h => h.includes("품번") || h.includes("품목코드") || h.includes("제품코드") || h.toUpperCase().includes("ITEM")),
                itemName: headers.findIndex(h => h.includes("품명") || h.includes("제품명") || h.toUpperCase().includes("NAME")),
                spec: headers.findIndex(h => h.includes("규격") || h.toUpperCase().includes("SPEC")),
                qty: headers.findIndex(h => h.includes("재고") || h.includes("수량") || h.includes("현재고"))
            };

            // 3. 데이터 매핑 및 필터링
            const parsedData = raw.slice(headerRowIdx + 1)
                .map(row => ({
                    품번: idx.itemCode !== -1 ? str(row[idx.itemCode]) : "",
                    품명: idx.itemName !== -1 ? str(row[idx.itemName]) : "",
                    규격: idx.spec !== -1 ? str(row[idx.spec]) : "",
                    재고수량: idx.qty !== -1 ? num(row[idx.qty]) : 0,
                }))
                .filter(item => item.품번); // 품번이 없는 빈 줄이나 쓰레기값 필터링

            // 4. 결과 반환
            if (parsedData.length > 0) {
                onSuccess(parsedData);
            } else {
                onError("⚠️ 유효한 재고현황 데이터를 찾을 수 없습니다.");
            }

        } catch (err) {
            console.error("Inv Parsing Error:", err);
            onError("❌ 재고현황 파싱 오류: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
};