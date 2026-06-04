import { useState, useMemo, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { globalCss, loadData, parseExcelDynamic, fmtXlDate, str, num, findInv, shipStatus } from "./utils";
import { InputView, DashView } from "./components";

export default function App() {
  const [prodData, setProdData] = useState(() => loadData('wg_prod'));
  const [invData, setInvData] = useState(() => loadData('wg_inv'));
  const [shipData, setShipData] = useState(() => loadData('wg_ship'));

  const [prodFile, setProdFile] = useState(localStorage.getItem('wg_prodFile') || "");
  const [invFile, setInvFile] = useState(localStorage.getItem('wg_invFile') || "");

  const [view, setView] = useState("dash");
  const [shipText, setShipText] = useState("");
  const [parseMsg, setParseMsg] = useState(null);

  const [mainTab, setMainTab] = useState("ship");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    localStorage.setItem('wg_prod', JSON.stringify(prodData));
    localStorage.setItem('wg_inv', JSON.stringify(invData));
    localStorage.setItem('wg_ship', JSON.stringify(shipData));
    localStorage.setItem('wg_prodFile', prodFile);
    localStorage.setItem('wg_invFile', invFile);
  }, [prodData, invData, shipData, prodFile, invFile]);

  const handleResetData = () => {
    if (window.confirm("모든 데이터를 초기화하시겠습니까?")) {
      setProdData([]); setInvData([]); setShipData([]);
      setProdFile(""); setInvFile(""); setShipText("");
      setParseMsg("✅ 모든 데이터가 초기화되었습니다.");
    }
  };

  const handleProdFile = useCallback(file => {
    setProdFile(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        const parsed = parseExcelDynamic(raw, [
          ["생산", "계획", "출하"], ["모델", "품명", "제품코드", "품번"], ["수량", "계획수량"]
        ]);

        const mapped = parsed.map(r => ({
          // 💡 필수 6개 항목을 위해 다양한 헤더 이름을 모두 아우르도록 수정
          생산계획일자: fmtXlDate(r["생산계획일자"] || r["생산계획일"] || r["생산일자"] || r["생산일"] || r["계획일"]),
          출하일자: fmtXlDate(r["출하일자"] || r["출하일"] || r["납기일자"] || r["납기일"]),
          고객명: str(r["고객명"] || r["고객"] || r["거래처"] || r["업체명"]),
          수량: num(r["수량"] || r["계획수량"] || r["생산수량"]),
          모델명: str(r["모델명"] || r["모델"] || r["품명"]),
          제품코드: str(r["제품코드"] || r["품번"] || r["품목코드"] || r["ITEM_CODE"]),
        })).filter(r => (r.고객명 || r.제품코드) && r.수량 > 0); // 고객명이나 제품코드가 존재하고 수량이 0보다 큰 데이터만 추출

        if (mapped.length > 0) { setProdData(mapped); setParseMsg(`✅ 생산계획 ${mapped.length}건 로드 완료`); }
        else setParseMsg("⚠️ 생산계획 데이터를 찾을 수 없습니다.");
      } catch (err) { setParseMsg("❌ 생산계획 파싱 오류: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleInvFile = useCallback(file => {
    setInvFile(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        const parsed = parseExcelDynamic(raw, [
          ["품번", "품목코드", "품목번호", "제품코드", "ITEM_CODE"], ["재고수량", "현재고", "수량", "재고", "실재고"]
        ]);

        const mapped = parsed.map(r => ({
          품번: str(r["품번"] || r["품목코드"] || r["품목번호"] || r["제품코드"] || r["ITEM_CODE"]),
          품명: str(r["품명"] || r["품목명"] || r["ITEM_NAME"] || r["제품명"]),
          규격: str(r["규격"] || r["SPEC"] || r["스펙"]),
          재고수량: num(r["재고수량"] || r["현재고"] || r["수량"] || r["재고"] || r["실재고"]),
        })).filter(r => r.품번);

        if (mapped.length > 0) { setInvData(mapped); setParseMsg(`✅ 재고현황 ${mapped.length}품목 로드 완료`); }
        else setParseMsg("⚠️ 재고현황 데이터를 찾을 수 없습니다.");
      } catch (err) { setParseMsg("❌ 재고현황 파싱 오류: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleShipParse = () => {
    if (!shipText.trim()) { setParseMsg("⚠️ 출하의뢰 텍스트를 입력하세요"); return; }
    const rows = shipText.trim().split("\n").filter(Boolean).map(line => {
      const cols = line.split("\t");
      if (cols.length < 10) return null;
      return {
        의뢰일자: str(cols[0]), 납기일자: str(cols[1]), 출하의뢰번호: str(cols[5]), 거래처명: str(cols[6]),
        품목명: str(cols[7]), 품목번호: str(cols[8]), 규격: str(cols[9]), 수량: num(cols[10]),
        담당자: str(cols[13]), 상태: str(cols[14]) || "작성",
      };
    }).filter(r => r && r.거래처명 && !["운반비", "기타"].includes(r.품목명));

    if (rows.length === 0) { setParseMsg("⚠️ 유효한 출하의뢰 데이터가 없습니다."); return; }
    setShipData(rows);
    setParseMsg(`✅ 출하의뢰 ${rows.length}건 로드 완료`);
  };

  const prodEnriched = useMemo(() => prodData.map(r => {
    const inv = findInv(invData, r.제품코드);
    return { ...r, _inv: inv, _status: shipStatus(inv?.재고수량 ?? null, r.수량) };
  }), [prodData, invData]);

  const shipEnriched = useMemo(() => shipData.map(r => {
    const inv = findInv(invData, r.품목번호);
    return { ...r, _inv: inv, _status: shipStatus(inv?.재고수량 ?? null, r.수량) };
  }), [shipData, invData]);

  const prodStats = useMemo(() => {
    const c = { ok: 0, shortage: 0, neg: 0, unknown: 0 };
    (mainTab === 'ship' ? shipEnriched : prodEnriched).forEach(r => c[r._status]++);
    return c;
  }, [prodEnriched, shipEnriched, mainTab]);

  const filteredProd = useMemo(() => {
    const q = search.toLowerCase();
    return prodEnriched.filter(r =>
      (!q || r.고객명?.toLowerCase().includes(q) || r.모델명?.toLowerCase().includes(q) || r.제품코드?.toLowerCase().includes(q)) &&
      (!filterDate || r.출하일자 === filterDate) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [prodEnriched, search, filterDate, filterStatus]);

  const filteredShip = useMemo(() => {
    const q = search.toLowerCase();
    return shipEnriched.filter(r =>
      (!q || r.거래처명?.toLowerCase().includes(q) || r.품목명?.toLowerCase().includes(q) || r.품목번호?.toLowerCase().includes(q)) &&
      (!filterDate || r.납기일자 === filterDate) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [shipEnriched, search, filterDate, filterStatus]);

  const negInvList = useMemo(() => invData.filter(r => r.재고수량 < 0), [invData]);
  const filteredNegInv = useMemo(() => negInvList.filter(r => !search || r.품번?.toLowerCase().includes(search.toLowerCase()) || r.품명?.toLowerCase().includes(search.toLowerCase())), [negInvList, search]);

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ fontFamily: "'Pretendard','Malgun Gothic',sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏭</span>
            <div><div className="header-title" style={{ fontWeight: 700, fontSize: 15 }}>출하 일정관리</div></div>
          </div>
          <button className="header-btn" onClick={() => { setView(view === "input" ? "dash" : "input"); setParseMsg(null); }} style={{ background: "#ffffff22", color: "#fff", border: "1px solid #ffffff44", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {view === "input" ? "← 대시보드" : "📂 업로드 설정"}
          </button>
        </div>

        {view === "input" ? (
          <InputView
            setView={setView} handleResetData={handleResetData} parseMsg={parseMsg}
            handleProdFile={handleProdFile} prodData={prodData} prodFile={prodFile}
            handleInvFile={handleInvFile} invData={invData} invFile={invFile}
            shipText={shipText} setShipText={setShipText} handleShipParse={handleShipParse}
          />
        ) : (
          <DashView
            mainTab={mainTab} setMainTab={setMainTab} shipEnriched={shipEnriched} prodEnriched={prodEnriched}
            prodStats={prodStats} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            search={search} setSearch={setSearch} filteredShip={filteredShip} filteredProd={filteredProd}
            filteredNegInv={filteredNegInv} negInvList={negInvList}
          />
        )}
      </div>
    </>
  );
}