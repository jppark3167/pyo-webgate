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

  const [mainTab, setMainTab] = useState("ship_dom");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortDesc, setSortDesc] = useState(false);
  //임시 커밋용
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

        if (raw.length < 2) {
          setParseMsg("⚠️ 데이터가 충분하지 않거나 양식이 잘못되었습니다.");
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
          setParseMsg("❌ 필수 헤더(생산계획 일자, 제품코드 등)를 찾을 수 없습니다. 엑셀 양식을 확인해주세요.");
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

        setProdData(parsedData);
        setParseMsg(`✅ 생산계획 ${parsedData.length}건이 성공적으로 로드되었습니다.`);

      } catch (error) {
        console.error("Excel Parsing Error:", error);
        setParseMsg("❌ 생산계획 파일 파싱 중 오류가 발생했습니다.");
      }
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

  const shipEnriched = useMemo(() => {
    // ① 납기일자 오름차순으로 출하 데이터 정렬 (순차적 재고 차감을 위함)
    const sortedShip = [...shipData].sort((a, b) => str(a.납기일자).localeCompare(str(b.납기일자)));

    // ② 품목별 누적 재고를 관리할 Map 생성 (초기값: 엑셀에서 가져온 현재 재고)
    const runningInvMap = {};
    invData.forEach(item => {
      runningInvMap[str(item.품번).toUpperCase()] = Number(item.재고수량) || 0;
    });

    // ③ 품목별 생산 계획을 날짜순으로 정리
    const prodMap = {};
    prodData.forEach(r => {
      const code = str(r.제품코드).toUpperCase();
      if (!prodMap[code]) prodMap[code] = [];

      // 생산계획일자가 없으면 출하일자를 대체 사용
      const pDate = str(r.생산계획일자 || r.출하일자);
      const pQty = Number(r.수량 || r.계획수량) || 0;
      prodMap[code].push({ date: pDate, qty: pQty });
    });

    // 품목별로 생산 날짜가 빠른 순으로 정렬
    Object.keys(prodMap).forEach(k => prodMap[k].sort((a, b) => a.date.localeCompare(b.date)));

    // ④ 품목별 생산계획 반영 인덱스 추적기
    const prodIdxTracker = {};

    // ⑤ 출하 건별 순회하며 재고 시뮬레이션
    return sortedShip.map(ship => {
      const code = str(ship.품목번호).toUpperCase();
      const shipDate = str(ship.납기일자);
      const reqQty = Number(ship.수량) || 0;

      // 표에 보여주기 위한 순수 현재고 (변하지 않는 기준점)
      const baseInv = invData.find(r => str(r.품번).toUpperCase() === code);
      const currentInvQty = baseInv ? Number(baseInv.재고수량) : null;

      if (runningInvMap[code] === undefined) runningInvMap[code] = 0;

      // 💡 핵심 로직: 납기일(shipDate) 이전에 완료되는 생산 계획을 찾아 누적 재고에 더함
      let addedProdQtyThisStep = 0;
      if (prodMap[code]) {
        if (prodIdxTracker[code] === undefined) prodIdxTracker[code] = 0;

        while (prodIdxTracker[code] < prodMap[code].length) {
          const pItem = prodMap[code][prodIdxTracker[code]];

          // 생산일이 납기일보다 작거나 같으면 (생산 완료 후 출하 가능)
          if (pItem.date <= shipDate) {
            runningInvMap[code] += pItem.qty; // 예상재고 통에 생산량 추가
            addedProdQtyThisStep += pItem.qty; // UI 표기를 위해 이번 스텝에 추가된 양 기록
            prodIdxTracker[code]++;
          } else {
            break; // 아직 납기일이 안 된 미래의 생산계획이면 다음 출하 건 연산으로 넘김
          }
        }
      }

      // 출하 전 누적 재고에서 출하 의뢰 수량 차감 -> 최종 예상 재고
      runningInvMap[code] -= reqQty;
      const projectedInvQty = runningInvMap[code];

      // 출하 후 예상재고가 0 이상이면 재고충족, 음수면 재고부족
      let status = projectedInvQty >= 0 ? "ok" : "shortage";
      if (currentInvQty === null) status = "unknown";

      return {
        ...ship,
        _currentInvQty: currentInvQty,          // 현재고 (DB 기준)
        _incomingProd: addedProdQtyThisStep,    // ⚡ 해당 납기일에 맞춰 유효하게 투입된 생산량
        _projectedInvQty: projectedInvQty,      // ⚡ 반영 후 최종 예상재고
        _status: status
      };
    });
  }, [shipData, invData, prodData]);

  const shipOvsEnriched = useMemo(() => shipEnriched.filter(r => ["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);
  const shipDomEnriched = useMemo(() => shipEnriched.filter(r => !["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);

  const prodEnriched = useMemo(() => prodData.map(r => {
    const inv = findInv(invData, r.제품코드);
    return {
      ...r, _inv: inv, _status: "prod_planned"
      // 💡 재고부족 대신 '생산예정'으로 고정
    };
  }), [prodData, invData]);

  const prodStats = useMemo(() => {
    const c = { ok: 0, shortage: 0, neg: 0, unknown: 0 };
    const activeData = mainTab === 'ship_dom' ? shipDomEnriched : (mainTab === 'ship_ovs' ? shipOvsEnriched : prodEnriched);
    activeData.forEach(r => c[r._status]++);
    return c;
  }, [prodEnriched, shipDomEnriched, shipOvsEnriched, mainTab]);

  const filterShipData = (data) => {
    const q = search.toLowerCase();
    return data.filter(r =>
      (!q || r.거래처명?.toLowerCase().includes(q) || r.품목명?.toLowerCase().includes(q) || r.품목번호?.toLowerCase().includes(q)) &&
      (!filterDate || r.납기일자 === filterDate) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  };

  const filteredShipDom = useMemo(() => filterShipData(shipDomEnriched), [shipDomEnriched, search, filterDate, filterStatus]);
  const filteredShipOvs = useMemo(() => filterShipData(shipOvsEnriched), [shipOvsEnriched, search, filterDate, filterStatus]);

  const filteredProd = useMemo(() => {
    const q = search.toLowerCase();
    return prodEnriched.filter(r =>
      (!q || r.고객명?.toLowerCase().includes(q) || r.모델명?.toLowerCase().includes(q) || r.제품코드?.toLowerCase().includes(q)) &&
      (!filterDate || r.출하일자 === filterDate) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [prodEnriched, search, filterDate, filterStatus]);

  const negInvList = useMemo(() => invData.filter(r => r.재고수량 < 0), [invData]);
  const filteredNegInv = useMemo(() => negInvList.filter(r => !search || r.품번?.toLowerCase().includes(search.toLowerCase()) || r.품명?.toLowerCase().includes(search.toLowerCase())), [negInvList, search]);

  const sortShipData = (data) => {
    return [...data].sort((a, b) => {
      const vA = a.납기일자; const vB = b.납기일자;
      if (!vA && !vB) return 0;
      if (!vA) return 1; if (!vB) return -1;
      return sortDesc ? vB.localeCompare(vA) : vA.localeCompare(vB);
    });
  };

  const sortedShipDom = useMemo(() => sortShipData(filteredShipDom), [filteredShipDom, sortDesc]);
  const sortedShipOvs = useMemo(() => sortShipData(filteredShipOvs), [filteredShipOvs, sortDesc]);

  const sortedProd = useMemo(() => {
    return [...filteredProd].sort((a, b) => {
      const vA = a.출하일자; const vB = b.출하일자;
      if (!vA && !vB) return 0;
      if (!vA) return 1; if (!vB) return -1;
      return sortDesc ? vB.localeCompare(vA) : vA.localeCompare(vB);
    });
  }, [filteredProd, sortDesc]);

  // 💡 [추가됨] 날짜별 생산/출하 요약 데이터 생성
  const dailySummaryData = useMemo(() => {
    const summaryMap = {};
    prodEnriched.forEach(item => {
      const date = item.생산계획일자 || "날짜미정";
      if (!summaryMap[date]) {
        summaryMap[date] = { 생산계획일자: date, 건수: 0, 총수량: 0 };
      }
      summaryMap[date].건수 += 1;
      summaryMap[date].총수량 += item.수량;
    });
    return Object.values(summaryMap).sort((a, b) => {
      if (a.생산계획일자 === "날짜미정") return 1;
      if (b.생산계획일자 === "날짜미정") return -1;
      return new Date(a.생산계획일자) - new Date(b.생산계획일자);
    });
  }, [prodEnriched]);

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
            mainTab={mainTab} setMainTab={setMainTab}
            shipDomEnriched={shipDomEnriched} shipOvsEnriched={shipOvsEnriched} prodEnriched={prodEnriched}
            prodStats={prodStats} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            search={search} setSearch={setSearch} sortDesc={sortDesc} setSortDesc={setSortDesc}
            sortedShipDom={sortedShipDom} sortedShipOvs={sortedShipOvs} sortedProd={sortedProd}
            filteredNegInv={filteredNegInv} negInvList={negInvList}
            // 💡 [추가됨] DashView로 요약 데이터를 넘겨줍니다.
            dailySummaryData={dailySummaryData}
          />
        )}
      </div>
    </>
  );
}