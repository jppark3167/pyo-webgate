// App.jsx: 메인 애플리케이션 컴포넌트
import { useState, useMemo, useCallback, useEffect } from "react";
// 💡 XLSX는 excelParser.js 내부에서 직접 다루므로 여기선 임포트하지 않아 빌드 에러를 방지합니다.
import { globalCss, loadData, str, findInv } from "./utils";
import { InputView, DashView } from "./components";
// 💡 excelParser에서 제공하는 파싱 실행 함수 임포트
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

  // 로컬 스토리지 데이터 동기화
  useEffect(() => {
    localStorage.setItem('wg_prod', JSON.stringify(prodData));
    localStorage.setItem('wg_inv', JSON.stringify(invData));
    localStorage.setItem('wg_ship', JSON.stringify(shipData));
    localStorage.setItem('wg_prodFile', prodFile);
    localStorage.setItem('wg_invFile', invFile);
  }, [prodData, invData, shipData, prodFile, invFile]);

  // 모든 데이터 초기화 핸들러
  const handleResetData = () => {
    if (window.confirm("모든 데이터를 초기화하시겠습니까?")) {
      setProdData([]);
      setInvData([]);
      setShipData([]);
      setProdFile("");
      setInvFile("");
      setShipText("");
      setParseMsg("✅ 모든 데이터가 초기화되었습니다.");
    }
  };

  // 💡 excelParser의 콜백 구조(file, onSuccess, onError)에 맞게 연동 완료
  const handleProdFile = useCallback(file => {
    setProdFile(file.name);
    setParseMsg("생산계획 파일을 분석 중입니다...");

    processProdFile(
      file,
      (parsedData) => { // onSuccess 콜백
        setProdData(parsedData);
        setParseMsg(`✅ 생산계획 파일 분석 완료 (${parsedData.length}건)`);
      },
      (errorMsg) => { // onError 콜백
        setParseMsg(errorMsg);
      }
    );
  }, []);

  // 💡 중복 선언 오류 해결 및 콜백 구조에 맞게 연동 완료
  const handleInvFile = useCallback(file => {
    setInvFile(file.name);
    setParseMsg("재고현황 파일을 분석 중입니다...");

    processInvFile(
      file,
      (parsedData) => { // onSuccess 콜백
        setInvData(parsedData);
        setParseMsg(`✅ 재고현황 파일 분석 완료 (${parsedData.length}건)`);
      },
      (errorMsg) => { // onError 콜백
        setParseMsg(errorMsg);
      }
    );
  }, []);

  // 💡 탭 분리형(TSV) 출하의뢰 복사 텍스트 분석 로직 완벽 적용
  // 💡 탭 분리형(TSV) 출하의뢰 텍스트 파싱 (뒤에서부터 매핑하여 밀림 완벽 방지)
  const handleShipParse = () => {
    if (!shipText.trim()) {
      setParseMsg("⚠️ 출하의뢰 텍스트를 입력하세요");
      return;
    }

    try {
      const rows = shipText.trim().split("\n");
      const parsedData = rows.map((row) => {
        // 각 줄을 탭으로 나누고 앞뒤 공백을 자릅니다.
        const cols = row.split("\t").map(c => c.trim());
        const len = cols.length;

        // 💡 핵심: 앞쪽 빈 칸들 때문에 배열 길이가 달라져도, 
        // 뒤에서부터(len - x) 역추적하면 정확한 데이터를 100% 잡아냅니다!
        return {
          작성일자: cols[0], // 왼쪽 끝은 고정
          납기일자: cols[1],
          출하의뢰번호: cols[len - 10],
          거래처명: cols[len - 9],
          품목명: cols[len - 8],
          품목번호: cols[len - 7], // 재고 대조용 '품번' (D-03-01_24676738_UHN-NVR1600-TTA 등)
          규격: cols[len - 6],     // 규격/사양 (No HDD, 국내향, 16채널 TTA 등)
          수량: parseFloat(cols[len - 5]?.replace(/,/g, "")) || 0,
          단가: parseFloat(cols[len - 4]?.replace(/,/g, "")) || 0,
          금액: parseFloat(cols[len - 3]?.replace(/,/g, "")) || 0,
          담당자: cols[len - 2],   // 이우제, 최명균 등 (해외/국내 자동 분류!)
          상태: cols[len - 1]      // 오른쪽 끝은 고정
        };
      }).filter(item => item.품목번호 && item.품목번호 !== ""); // 빈 데이터 필터링

      setShipData(parsedData);
      setParseMsg(`✅ ${parsedData.length}건의 출하의뢰 데이터가 성공적으로 입력되었습니다.`);
      setShipText("");
      setView("dash");
    } catch (error) {
      console.error(error);
      setParseMsg("❌ 파싱 중 오류가 발생했습니다. 데이터 형식을 다시 확인해주세요.");
    }
  };

  // 제품코드별 생산계획 수량 합계 맵 (출하의뢰 품목번호 매칭용)
  const prodQtyMap = useMemo(() => {
    const map = {};
    prodData.forEach(item => {
      const code = str(item.제품코드).toUpperCase();
      if (!code) return;
      map[code] = (map[code] || 0) + (item.수량 || 0);
    });
    return map;
  }, [prodData]);

  // 1. 납기일자 기준 정렬 + 현재고/생산예정/예상재고 매칭 + 상태 판정
  const shipEnriched = useMemo(() => {
    return [...shipData]
      .map(r => {
        const inv = findInv(invData, r.품목번호);
        const currentInv = inv ? inv.재고수량 : 0;                          // 현재고: 재고 데이터, 없으면 0
        const incomingProd = prodQtyMap[str(r.품목번호).toUpperCase()] || 0; // 생산예정: 생산계획 데이터, 없으면 0
        const projected = currentInv + incomingProd;                       // 예상재고 = 현재고 + 생산예정

        // 상태 판정: 완료 건은 이미 재고에 반영된 것으로 보고 예상재고 값 자체로 판단,
        // 그 외(작성 등)는 (의뢰수량 - 예상재고) 기준으로 판단
        const diff = str(r.상태) === "완료"
          ? projected
          : r.수량 - projected;
        const computedStatus = diff < 0 ? "shortage" : "ok"; // > 0(또는 0) 이상없음 / < 0 재고부족

        return {
          ...r,
          _currentInvQty: currentInv,
          _incomingProd: incomingProd,
          _projectedInvQty: projected,
          _projectedDisplay: `${currentInv} + ${incomingProd}`, // "현재고 + 생산예정" 형식 표기
          _status: computedStatus,
        };
      })
      .sort((a, b) => str(a.납기일자).localeCompare(str(b.납기일자)));
  }, [shipData, invData, prodQtyMap]);


  // 해외/국내 담당자별 출하의뢰 데이터 분리
  const shipOvsEnriched = useMemo(() => shipEnriched.filter(r => ["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);
  const shipDomEnriched = useMemo(() => shipEnriched.filter(r => !["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);

  // 생산 데이터 재고 매칭 및 상태 고정
  const prodEnriched = useMemo(() => prodData.map(r => {
    const inv = findInv(invData, r.제품코드);
    return { ...r, _inv: inv, _status: "prod_planned" }; // '생산예정'으로 상태 고정
  }), [prodData, invData]);

  // 탭 상태 및 변경에 따른 실시간 통계 생성
  const prodStats = useMemo(() => {
    const c = { ok: 0, shortage: 0, neg: 0, unknown: 0, prod_planned: 0 };
    const activeData = mainTab === 'ship_dom' ? shipDomEnriched : (mainTab === 'ship_ovs' ? shipOvsEnriched : prodEnriched);
    activeData.forEach(r => {
      if (r._status && c[r._status] !== undefined) c[r._status]++;
    });
    return c;
  }, [prodEnriched, shipDomEnriched, shipOvsEnriched, mainTab]);

  // 출하 통합 검색 필터 로직
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

  // 생산 통합 검색 필터 로직
  const filteredProd = useMemo(() => {
    const q = search.toLowerCase();
    return prodEnriched.filter(r =>
      (!q || r.고객명?.toLowerCase().includes(q) || r.모델명?.toLowerCase().includes(q) || r.제품코드?.toLowerCase().includes(q)) &&
      (!filterDate || r.출하일자 === filterDate) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [prodEnriched, search, filterDate, filterStatus]);

  // 마이너스 재고 필터링 리스트
  const negInvList = useMemo(() => invData.filter(r => r.재고수량 < 0), [invData]);
  const filteredNegInv = useMemo(() => negInvList.filter(r =>
    !search || r.품번?.toLowerCase().includes(search.toLowerCase()) || r.품명?.toLowerCase().includes(search.toLowerCase())
  ), [negInvList, search]);

  // 그리드 날짜별 데이터 정렬 헬퍼
  const sortShipData = (data) => {
    return [...data].sort((a, b) => {
      const vA = a.납기일자;
      const vB = b.납기일자;
      if (!vA && !vB) return 0;
      if (!vA) return 1;
      if (!vB) return -1;
      return sortDesc ? vB.localeCompare(vA) : vA.localeCompare(vB);
    });
  };

  const sortedShipDom = useMemo(() => sortShipData(filteredShipDom), [filteredShipDom, sortDesc]);
  const sortedShipOvs = useMemo(() => sortShipData(filteredShipOvs), [filteredShipOvs, sortDesc]);

  const sortedProd = useMemo(() => {
    return [...filteredProd].sort((a, b) => {
      const vA = a.출하일자;
      const vB = b.출하일자;
      if (!vA && !vB) return 0;
      if (!vA) return 1;
      if (!vB) return -1;
      return sortDesc ? vB.localeCompare(vA) : vA.localeCompare(vB);
    });
  }, [filteredProd, sortDesc]);

  // 날짜별(납기일자) 출하 종합 요약 맵 생성
  const dailySummaryData = useMemo(() => {
    const summaryMap = {};
    shipEnriched.forEach(item => {
      const date = item.납기일자 || "날짜미정";
      if (!summaryMap[date]) {
        summaryMap[date] = { 납기일자: date, 건수: 0, 총수량: 0 };
      }
      summaryMap[date].건수 += 1;
      summaryMap[date].총수량 += item.수량;
    });
    return Object.values(summaryMap).sort((a, b) => {
      if (a.납기일자 === "날짜미정") return 1;
      if (b.납기일자 === "날짜미정") return -1;
      return new Date(a.납기일자) - new Date(b.납기일자);
    });
  }, [shipEnriched]);

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ fontFamily: "'Pretendard','Malgun Gothic',sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>

        {/* 상단 통합 내비게이션 바 */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏭</span>
            <div className="header-title" style={{ fontWeight: 700, fontSize: 15 }}>출하 일정관리</div>
          </div>
          <button
            className="header-btn"
            onClick={() => {
              setView(view === "input" ? "dash" : "input");
              setParseMsg(null);
            }}
            style={{ background: "#ffffff22", color: "#fff", border: "1px solid #ffffff44", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            {view === "input" ? "← 대시보드" : "📂 업로드 설정"}
          </button>
        </div>

        {/* 렌더링 컨테이너 화면 뷰포트 분기 */}
        <div className="page-container" style={{ padding: "16px" }}>
          {view === "input" ? (
            <InputView
              setView={setView}
              handleResetData={handleResetData}
              parseMsg={parseMsg}
              handleProdFile={handleProdFile}
              prodData={prodData}
              prodFile={prodFile}
              handleInvFile={handleInvFile}
              invData={invData}
              invFile={invFile}
              shipText={shipText}
              setShipText={setShipText}
              handleShipParse={handleShipParse}
            />
          ) : (
            <DashView
              mainTab={mainTab}
              setMainTab={setMainTab}
              prodStats={prodStats}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              search={search}
              setSearch={setSearch}
              sortDesc={sortDesc}
              setSortDesc={setSortDesc}
              sortedShipDom={sortedShipDom}
              sortedShipOvs={sortedShipOvs}
              sortedProd={sortedProd}
              filteredNegInv={filteredNegInv}
              negInvList={negInvList}
              dailySummaryData={dailySummaryData}
              allShipData={shipEnriched}
            />
          )}
        </div>
      </div>
    </>
  );
}