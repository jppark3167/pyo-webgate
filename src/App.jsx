//App.jsx: 메인 애플리케이션 컴포넌트
import { useState, useMemo, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { globalCss, loadData, parseExcelDynamic, fmtXlDate, str, num, findInv, shipStatus } from "./utils";
import { InputView, DashView } from "./components";
import { processProdFile, processInvFile } from "./excelParser";

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
    setParseMsg("생산계획 파일을 분석 중입니다...");

    processProdFile(
      file,
      (data) => {
        setProdData(data);
        setParseMsg(`✅ 생산계획 ${data.length}건이 성공적으로 로드되었습니다.`);
      },
      (errorMsg) => {
        setParseMsg(errorMsg);
      }
    );
  }, []);

  const handleInvFile = useCallback(file => {
    setInvFile(file.name);
    setParseMsg("재고현황 파일을 분석 중입니다...");

    processInvFile(
      file,
      (mapped) => {
        setInvData(mapped);
        setParseMsg(`✅ 재고현황 ${mapped.length}품목 로드 완료`);
      },
      (errorMsg) => {
        setParseMsg(errorMsg);
      }
    );
  }, []);

  const handleInvFile = useCallback(file => {
    setInvFile(file.name);
    setParseMsg("재고 파일을 분석 중입니다...");

    // 재고 데이터에서 반드시 찾아야 할 헤더 키워드 
    const requiredKeys = ["품번", "재고수량"];

    processExcelFile(
      file,
      requiredKeys,
      (data) => {
        setInvData(data);
        setParseMsg(`✅ 재고 파일 업로드 완료 (${data.length}건)`);
      },
      (errorMsg) => {
        setParseMsg(errorMsg);
      }
    );
  }, []);

  const handleShipParse = () => {
    if (!shipText.trim()) {
      setParseMsg("⚠️ 출하의뢰 텍스트를 입력하세요");
      return; // 
    }

    try {
      // 1. 전체 텍스트를 줄바꿈(\n) 기준으로 분리하여 배열로 만듭니다.
      const rows = shipText.trim().split("\n");

      // 2. 각 줄을 탭(\t) 기준으로 다시 분리하여 객체로 매핑합니다.
      const parsedData = rows.map((row) => {
        const cols = row.split("\t");

        // 샘플 데이터 기준 컬럼 인덱스 매핑
        return {
          작성일자: cols[0]?.trim(),
          납기일자: cols[1]?.trim(),
          출하번호: cols[4]?.trim(),
          거래처명: cols[5]?.trim(),
          모델명: cols[6]?.trim(),
          품목번호: cols[7]?.trim(), // 재고 매칭 시 핵심 키
          품목명: cols[8]?.trim(),
          수량: parseFloat(cols[9]?.replace(/,/g, "")) || 0, // 숫자 변환
          단가: parseFloat(cols[10]?.replace(/,/g, "")) || 0,
          금액: parseFloat(cols[11]?.replace(/,/g, "")) || 0,
          담당자: cols[12]?.trim(), // 해외/국내 담당자 분류 키
          상태: cols[13]?.trim()
        };
      }).filter(item => item.품목번호); // 품목번호가 없는 빈 줄이나 쓰레기값 필터링

      // 3. 파싱된 데이터를 상태에 업데이트합니다.
      setShipData(parsedData);
      setParseMsg(`✅ ${parsedData.length}건의 출하의뢰 데이터가 성공적으로 입력되었습니다.`);
      setShipText(""); // 입력 완료 후 텍스트 에어리어 초기화
      setView("dash"); // 입력 완료 후 자동으로 대시보드 화면으로 이동 (선택사항)

    } catch (error) {
      console.error(error);
      setParseMsg("❌ 파싱 중 오류가 발생했습니다. 데이터 형식을 다시 확인해주세요.");
    }
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

      const baseInv = invData.find(r => str(r.품번).toUpperCase() === code);
      const currentInvQty = baseInv ? Number(baseInv.재고수량) : null;

      if (runningInvMap[code] === undefined) runningInvMap[code] = 0;

      let addedProdQtyThisStep = 0;
      if (prodMap[code]) {
        if (prodIdxTracker[code] === undefined) prodIdxTracker[code] = 0;

        while (prodIdxTracker[code] < prodMap[code].length) {
          const pItem = prodMap[code][prodIdxTracker[code]];
          if (pItem.date <= shipDate) {
            runningInvMap[code] += pItem.qty;
            addedProdQtyThisStep += pItem.qty;
            prodIdxTracker[code]++;
          } else {
            break;
          }
        }
      }

      // 💡 핵심 로직: 상태가 '완료'가 아닌 경우에만 예상 재고에서 수량을 뺌!
      // (이미 완료된 건은 전산 현재고에 차감이 반영되어 있으므로 이중으로 빼지 않음)
      if (ship.상태 !== "완료") {
        runningInvMap[code] -= reqQty;
      }

      const projectedInvQty = runningInvMap[code];

      let status = projectedInvQty >= 0 ? "ok" : "shortage";
      if (currentInvQty === null) status = "unknown";

      // 💡 상태가 '완료'인 건은 뱃지 상태를 강제로 'completed'로 덮어씌움
      if (ship.상태 === "완료") status = "completed";

      return {
        ...ship,
        _currentInvQty: currentInvQty,
        _incomingProd: addedProdQtyThisStep,
        // 💡 완료된 건은 다음 예상재고 흐름에 혼선을 주지 않도록 표기를 "-" 로 처리
        _projectedInvQty: ship.상태 === "완료" ? "-" : projectedInvQty,
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