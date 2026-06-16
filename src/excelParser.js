import * as XLSX from "xlsx";
import { parseExcelDynamic } from "./utils"; 

/**
 * 엑셀 파일을 읽고 파싱하는 공통 핸들러
 * @param {File} file - 업로드된 파일 객체
 * @param {Array} keyIdentifiers - 헤더를 찾기 위한 필수 컬럼명 배열 (예: ["품번", "수량"])
 * @param {Function} onSuccess - 성공 시 파싱된 데이터를 넘겨줄 콜백
 * @param {Function} onError - 실패 시 에러 메시지를 넘겨줄 콜백
 */
export const processExcelFile = (file, keyIdentifiers, onSuccess, onError) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // header: 1 옵션으로 순수 2D 배열 형태로 가져옴
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      // 유틸리티 함수를 통해 동적 파싱
      const data = parseExcelDynamic(raw, keyIdentifiers);

      if (data.length > 0) {
        onSuccess(data);
      } else {
        onError("⚠️ 형식에 맞는 데이터를 찾을 수 없습니다. (필수 컬럼 누락)");
      }
    } catch (error) {
      console.error(error);
      onError("⚠️ 엑셀 파일 파싱 중 오류가 발생했습니다.");
    }
  };

  reader.onerror = () => {
    onError("⚠️ 파일을 읽는 중 오류가 발생했습니다.");
  };

  // 파일을 ArrayBuffer 형태로 읽기 시작
  reader.readAsArrayBuffer(file);
};