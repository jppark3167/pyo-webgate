import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { loadData, str, num, findInv } from "./utils";

export function useAppLogic() {
  // ── 1. 데이터 상태 관리 (로컬스토리지 연동) ──
  const [prodData, setProdData] = useState(() => loadData('wg_prod'));
  const [invData, setInvData] = useState(() => loadData('wg_inv'));
  const [shipData, setShipData] = useState(() => loadData('wg_ship'));
  const [priceData, setPriceData] = useState(() => loadData('wg_price') || []);
  
  const [prodFile, setProdFile] = useState(localStorage.getItem('wg_prodFile') || "");
  const [invFile, setInvFile] = useState(localStorage.getItem('wg_invFile') || "");
  const [priceFile, setPriceFile] = useState(localStorage.getItem('wg_priceFile') || "");

  // ── 2. UI 및 필터 상태 관리 ──
  const [view, setView] = useState("dash");
  const [shipText, setShipText] = useState("");
  const [parseMsg, setParseMsg] = useState(null);
  const [mainTab, setMainTab] = useState("ship_dom");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortDesc, setSortDesc] = useState(false);

  // ── 3. 로컬스토리지 동기화 ──
  useEffect(() => {
    localStorage.setItem('wg_prod', JSON.stringify(prodData));
    localStorage.setItem('wg_inv', JSON.stringify(invData));
    localStorage.setItem('wg_ship', JSON.stringify(shipData));
    localStorage.setItem('wg_price', JSON.stringify(priceData));
    localStorage.setItem('wg_prodFile', prodFile);
    localStorage.setItem('wg_invFile', invFile);
    localStorage.setItem('wg_priceFile', priceFile);
  }, [prodData, invData, shipData, priceData, prodFile, invFile, priceFile]);

  // ── 4. 이벤트 핸들러 (파일 업로드 및 초기화) ──
  const handleProdFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProdFile(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      setProdData(data);
      setParseMsg(`생산계획 데이터 ${data.length}건 로드 완료`);
    };
    reader.readAsBinaryString(file);
  };

  const handleInvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInvFile(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      setInvData(data);
      setParseMsg(`현재고 데이터 ${data.length}건 로드 완료`);
    };
    reader.readAsBinaryString(file);
  };

  const handlePriceFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPriceFile(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      let combinedPriceRows = [];
      wb.SheetNames.forEach(sheetName => {
        if (sheetName.toLowerCase().includes("rev")) return;
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        combinedPriceRows = [...combinedPriceRows, ...data];
      });
      setPriceData(combinedPriceRows);
      setParseMsg(`단가표 파일(총 ${combinedPriceRows.length}품목) 통합 로드 완료`);
    };
    reader.readAsBinaryString(file);
  };

  const handleShipParse = () => {
    if (!shipText.trim()) return;
    const lines = shipText.trim().split("\n");
    if (lines.length === 0) return;

    const parsedRows = lines.map(line => line.split("\t"));
    let headers = parsedRows[0].map(h => h.trim());
    let dataRows = parsedRows;
    let isHeaderIncluded = headers.some(h => h.includes("품번") || h.includes("모델") || h.includes("의뢰처"));
    let finalObjects = [];

    if (isHeaderIncluded) {
      dataRows = parsedRows.slice(1);
      finalObjects = dataRows.map(row => {
        const obj = {};
        headers.forEach((h, i) => { if (row[i] !== undefined) obj[h] = row[i].trim(); });
        return obj;
      });
    } else {
      finalObjects = parsedRows.map(row => ({
        "출하일자": row[0] || "", "의뢰처명": row[1] || "", "품번": row[2] || "",
        "수량": row[3] || "0", "단가": row[4] || "0"
      }));
    }
    setShipData(finalObjects);
    setParseMsg(`출하/의뢰 데이터 ${finalObjects.length}건 반영 완료`);
    setShipText("");
  };

  const handleResetData = () => {
    if (window.confirm("모든 데이터를 초기화하시겠습니까?")) {
      setProdData([]); setInvData([]); setShipData([]); setPriceData([]);
      setProdFile(""); setInvFile(""); setPriceFile(""); setShipText("");
      setParseMsg("초기화되었습니다.");
      localStorage.clear();
    }
  };

  // ── 5. 데이터 가공 로직 (재고 및 단가 매칭) ──
  const prodEnriched = useMemo(() => prodData.map(item => ({ ...item, 수량: num(item.수량 || item['계획수량'] || 0), 품번: str(item.품번 || item.모델명) })), [prodData]);

  const shipEnriched = useMemo(() => {
    return shipData.map(item => {
      const targetCode = str(item.품번 || item.모델명);
      const qty = num(item.수량 || item['의뢰수량'] || 0);
      const invMatch = findInv(invData, targetCode);
      const invQty = invMatch ? num(invMatch.재고 || invMatch['현재고'] || invMatch['수량'] || 0) : 0;
      
      let status = "unknown";
      if (invMatch) {
        status = invQty >= qty ? "ok" : "shortage";
        if (invQty < 0) status = "neg";
      }
      const isCompleted = str(item.상태 || item.진행상태) === "완료";
      return { ...item, 품번: targetCode, 수량: qty, invQty, status: isCompleted ? "completed" : status, isCompleted };
    });
  }, [shipData, invData]);

  const priceCheckData = useMemo(() => {
    return shipData.map(item => {
      const targetCode = str(item.품번 || item.모델명 || item['품번(모델명)']);
      const currentPrice = num(item.단가 || item.공급가 || item.금액 || 0);
      if (!targetCode) return { ...item, pStatus: "unknown", stdPrice: 0, currentPrice };

      const cleanTarget = targetCode.toUpperCase().replace(/\s+/g, '');
      const priceInfo = priceData.find(r => {
        const standardModel = str(r['모델명'] || r['Model'] || r['품번'] || '').toUpperCase().replace(/\s+/g, '');
        return standardModel === cleanTarget && standardModel !== "";
      });

      let pStatus = "unknown";
      let stdPrice = 0;

      if (priceInfo) {
        const possibleKeys = ['유통', '소비자가', 'MSRP', '단가', '기본판가'];
        for (const key of possibleKeys) {
          if (priceInfo[key] !== undefined && priceInfo[key] !== "") {
            const val = num(priceInfo[key]);
            if (val > 0) { stdPrice = val; break; }
          }
        }
        if (stdPrice === 0) {
          const dynamicKey = Object.keys(priceInfo).find(k => k.includes("유통") || k.includes("소비자"));
          if (dynamicKey) stdPrice = num(priceInfo[dynamicKey]);
        }
        if (stdPrice > 0) {
          pStatus = (currentPrice === stdPrice) ? "match" : "mismatch"; 
        }
      }
      return { ...item, 품번: targetCode, stdPrice, currentPrice, pStatus, priceInfo };
    });
  }, [shipData, priceData]);

  const dailySummaryData = useMemo(() => {
    return []; 
  }, [prodEnriched]);

  // App.jsx와 components에 넘겨줄 모든 데이터와 함수를 반환합니다.
  return {
    view, setView, shipText, setShipText, parseMsg, mainTab, setMainTab,
    search, setSearch, filterDate, setFilterDate, filterStatus, setFilterStatus, sortDesc, setSortDesc,
    prodData, prodFile, invData, invFile, priceData, priceFile,
    handleProdFile, handleInvFile, handlePriceFile, handleShipParse, handleResetData,
    prodEnriched, shipEnriched, priceCheckData, dailySummaryData
  };
}