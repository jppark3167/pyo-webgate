// App.jsx: 메인 애플리케이션 컴포넌트 (서버 연동 + KCE 입고일정 버전)
import { useState, useMemo, useCallback, useEffect } from "react";
import { globalCss, str, findInv } from "./utils";
import { InputView, DashView } from "./components";
import { processProdFile, processInvFile } from "./excelParser";
import { api } from "./api";

export default function App() {
  const [prodData, setProdData] = useState([]);
  const [invData, setInvData] = useState([]);
  const [shipData, setShipData] = useState([]);
  const [kceData, setKceData] = useState([]);
  const [memos, setMemos] = useState({});

  const [prodFile, setProdFile] = useState("");
  const [invFile, setInvFile] = useState("");
  const [view, setView] = useState("dash");
  const [shipText, setShipText] = useState("");
  const [kceText, setKceText] = useState("");
  const [parseMsg, setParseMsg] = useState(null);
  const [mainTab, setMainTab] = useState("ship_dom");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortDesc, setSortDesc] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── 앱 시작 시 서버에서 전체 데이터 로드 ──────
  useEffect(() => {
    api.getData()
      .then(db => {
        setProdData(db.prodData || []);
        setInvData(db.invData || []);
        setShipData(db.shipData || []);
        setKceData(db.kceData || []);
        setMemos(db.memos || {});
        setProdFile(db.prodFile || "");
        setInvFile(db.invFile || "");
      })
      .catch(() => setParseMsg("⚠️ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요."))
      .finally(() => setLoading(false));
  }, []);

  // ── 전체 초기화 ───────────────────────────────
  const handleResetData = async () => {
    if (!window.confirm("모든 데이터를 초기화하시겠습니까?")) return;
    await api.resetAll();
    setProdData([]); setInvData([]); setShipData([]); setKceData([]); setMemos({});
    setProdFile(""); setInvFile(""); setShipText(""); setKceText("");
    setParseMsg("✅ 모든 데이터가 초기화되었습니다.");
  };

  // ── 생산계획 파일 업로드 ─────────────────────
  const handleProdFile = useCallback(file => {
    setProdFile(file.name);
    setParseMsg("생산계획 파일을 분석 중입니다...");
    processProdFile(
      file,
      async (parsedData) => {
        setProdData(parsedData);
        await api.saveProd(parsedData, file.name);
        setParseMsg(`✅ 생산계획 파일 분석 완료 (${parsedData.length}건)`);
      },
      (errorMsg) => setParseMsg(errorMsg)
    );
  }, []);

  // ── 재고현황 파일 업로드 ─────────────────────
  const handleInvFile = useCallback(file => {
    setInvFile(file.name);
    setParseMsg("재고현황 파일을 분석 중입니다...");
    processInvFile(
      file,
      async (parsedData) => {
        setInvData(parsedData);
        await api.saveInv(parsedData, file.name);
        setParseMsg(`✅ 재고현황 파일 분석 완료 (${parsedData.length}건)`);
      },
      (errorMsg) => setParseMsg(errorMsg)
    );
  }, []);

  // ── 출하의뢰 텍스트 파싱 ─────────────────────
  const handleShipParse = async () => {
    if (!shipText.trim()) { setParseMsg("⚠️ 출하의뢰 텍스트를 입력하세요"); return; }
    try {
      const rows = shipText.trim().split("\n");
      const parsedData = rows.map((row) => {
        const cols = row.split("\t").map(c => c.trim());
        const len = cols.length;
        return {
          작성일자: cols[0],
          납기일자: cols[1],
          출하의뢰번호: cols[len - 10],
          거래처명: cols[len - 9],
          품목명: cols[len - 8],
          품목번호: cols[len - 7],
          규격: cols[len - 6],
          수량: parseFloat(cols[len - 5]?.replace(/,/g, "")) || 0,
          단가: parseFloat(cols[len - 4]?.replace(/,/g, "")) || 0,
          금액: parseFloat(cols[len - 3]?.replace(/,/g, "")) || 0,
          담당자: cols[len - 2],
          상태: cols[len - 1],
        };
      }).filter(item => item.품목번호 && item.품목번호 !== "");

      setShipData(parsedData);
      await api.saveShip(parsedData);
      setParseMsg(`✅ ${parsedData.length}건의 출하의뢰 데이터가 성공적으로 입력되었습니다.`);
      setShipText("");
      setView("dash");
    } catch (error) {
      console.error(error);
      setParseMsg("❌ 파싱 중 오류가 발생했습니다. 데이터 형식을 다시 확인해주세요.");
    }
  };

  // ── KCE 입고일정 텍스트 파싱 ─────────────────
  const handleKceParse = async () => {
    if (!kceText.trim()) { setParseMsg("⚠️ KCE 입고일정 텍스트를 입력하세요"); return; }
    try {
      const rows = kceText.trim().split("\n");
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const parsed = rows.map(row => {
        const cols = row.split("\t").map(c => c.trim());
        // 컬럼 순서: 품번 / 발주수량 / 발주일 / 입고예정일(메모) / 발주요청 / 담당자

        // 입고예정일: 메모 셀에서 첫 번째 날짜만 추출 (예: "136대 6/2\n64대-7/3" → "6/2")
        const memoCell = cols[3] || "";
        const dateMatch = memoCell.match(/(\d{1,2}\/\d{1,2})/);
        const 입고예정일 = dateMatch ? `2026/${dateMatch[1].padStart(4, "0")}` : "";

        return {
          품번: cols[0],
          발주수량: parseFloat(cols[1]?.replace(/,/g, "")) || 0,
          발주일: cols[2],
          입고예정일: 입고예정일,
          발주요청: parseFloat(cols[4]?.replace(/,/g, "")) || 0,
          담당자: cols[5] || "",
        };
      }).filter(item => {
        if (!item.품번) return false;
        if (item.입고예정일) {
          const d = new Date(item.입고예정일.replace(/\//g, "-"));
          if (!isNaN(d) && d < today) return false;
        }
        return item.발주요청 > 0;
      });

      setKceData(parsed);
      await api.saveKce(parsed);
      setParseMsg(`✅ KCE 입고일정 ${parsed.length}건 입력 완료`);
      setKceText("");
    } catch (e) {
      console.error(e);
      setParseMsg("❌ KCE 데이터 파싱 중 오류가 발생했습니다.");
    }
  };

  // ── 생산계획 수량 맵 (품번 기준) ──────────────
  const prodQtyMap = useMemo(() => {
    const map = {};
    prodData.forEach(item => {
      const code = str(item.제품코드).toUpperCase();
      if (!code) return;
      if (!map[code]) map[code] = { qty: 0, dates: [] };
      map[code].qty += (item.수량 || 0);
      if (item.생산계획일자 && !map[code].dates.includes(item.생산계획일자))
        map[code].dates.push(item.생산계획일자);
    });
    return map;
  }, [prodData]);

  // ── KCE 입고예정 수량 맵 (품번 기준) ──────────
  const kceQtyMap = useMemo(() => {
    const map = {};
    kceData.forEach(item => {
      const code = str(item.품번).toUpperCase();
      if (!code) return;
      if (!map[code]) map[code] = { qty: 0, dates: [] };
      map[code].qty += (item.발주요청 || 0);
      if (item.입고예정일 && !map[code].dates.includes(item.입고예정일))
        map[code].dates.push(item.입고예정일);
    });
    return map;
  }, [kceData]);

  // ── 출하의뢰 enriched (재고 판정 포함) ─────────
  const shipEnriched = useMemo(() => {
    return [...shipData]
      .map(r => {
        const isCarriage = str(r.품목명).includes("운반비") || str(r.품목명).includes("기타");
        if (isCarriage) return {
          ...r, _currentInvQty: null, _incomingProd: 0, _prodDates: [],
          _kceIncoming: 0, _kceDates: [], _projectedInvQty: null,
          _projectedDisplay: "-", _status: "skip", _note: null,
        };

        const inv = findInv(invData, r.품목번호);
        const currentInv = inv ? inv.재고수량 : 0;
        const codeUpper = str(r.품목번호).toUpperCase();
        const prodInfo = prodQtyMap[codeUpper];
        const incomingProd = prodInfo ? prodInfo.qty : 0;
        const prodDates = prodInfo ? [...prodInfo.dates].sort() : [];
        const kceInfo = kceQtyMap[codeUpper];
        const kceIncoming = kceInfo ? kceInfo.qty : 0;
        const kceDates = kceInfo ? [...kceInfo.dates].sort() : [];
        const projected = currentInv + incomingProd + kceIncoming;

        const effectiveDemand = str(r.상태) === "완료" ? 0 : r.수량;
        const computedStatus = (projected - effectiveDemand) < 0 ? "shortage" : "ok";

        // KCE 품번인데 재고도 없고 KCE 입고일정도 없을 때만 비고 표시
        const isKCE = /^(NK|KT|K)/.test(codeUpper);
        const note = (isKCE && currentInv <= 0 && kceIncoming === 0) ? "KCE입고일정 확인 필요" : null;

        return {
          ...r,
          _currentInvQty: currentInv,
          _incomingProd: incomingProd,
          _prodDates: prodDates,
          _kceIncoming: kceIncoming,
          _kceDates: kceDates,
          _projectedInvQty: projected,
          _projectedDisplay: `${currentInv} + ${incomingProd}${kceIncoming > 0 ? ` + KCE${kceIncoming}` : ""}`,
          _status: computedStatus,
          _note: note,
        };
      })
      .filter(item => item._status !== "skip")
      .sort((a, b) => str(a.납기일자).localeCompare(str(b.납기일자)));
  }, [shipData, invData, prodQtyMap, kceQtyMap]);

  // ── 국내/해외 분리 ─────────────────────────────
  const shipOvsEnriched = useMemo(() => shipEnriched.filter(r => ["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);
  const shipDomEnriched = useMemo(() => shipEnriched.filter(r => !["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);

  // ── 생산계획 enriched ──────────────────────────
  const prodEnriched = useMemo(() => prodData.map(r => ({
    ...r, _inv: findInv(invData, r.제품코드), _status: "prod_planned"
  })), [prodData, invData]);

  // ── 통계 ───────────────────────────────────────
  const prodStats = useMemo(() => {
    const c = { ok: 0, shortage: 0, neg: 0, unknown: 0, prod_planned: 0 };
    const activeData = mainTab === "ship_dom" ? shipDomEnriched : (mainTab === "ship_ovs" ? shipOvsEnriched : prodEnriched);
    activeData.forEach(r => { if (r._status && c[r._status] !== undefined) c[r._status]++; });
    return c;
  }, [prodEnriched, shipDomEnriched, shipOvsEnriched, mainTab]);

  // ── 검색/필터 ──────────────────────────────────
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

  // ── 정렬 ───────────────────────────────────────
  const sortShipData = (data) => [...data].sort((a, b) => {
    const vA = a.납기일자, vB = b.납기일자;
    if (!vA && !vB) return 0; if (!vA) return 1; if (!vB) return -1;
    return sortDesc ? vB.localeCompare(vA) : vA.localeCompare(vB);
  });

  const sortedShipDom = useMemo(() => sortShipData(filteredShipDom), [filteredShipDom, sortDesc]);
  const sortedShipOvs = useMemo(() => sortShipData(filteredShipOvs), [filteredShipOvs, sortDesc]);
  const sortedProd = useMemo(() => [...filteredProd].sort((a, b) => {
    const vA = a.생산계획일자, vB = b.생산계획일자;
    if (!vA && !vB) return 0; if (!vA) return 1; if (!vB) return -1;
    return sortDesc ? vB.localeCompare(vA) : vA.localeCompare(vB);
  }), [filteredProd, sortDesc]);

  // ── 요약 데이터 ────────────────────────────────
  const prodSummaryData = useMemo(() => {
    const map = {};
    sortedProd.forEach(item => {
      const date = item.생산계획일자 || "날짜미정";
      if (!map[date]) map[date] = { 생산계획일자: date, 건수: 0, 총수량: 0 };
      map[date].건수++; map[date].총수량 += item.수량 || 0;
    });
    return Object.values(map).sort((a, b) => {
      if (a.생산계획일자 === "날짜미정") return 1;
      if (b.생산계획일자 === "날짜미정") return -1;
      return a.생산계획일자.localeCompare(b.생산계획일자);
    });
  }, [sortedProd]);

  const dailySummaryData = useMemo(() => {
    const map = {};
    shipEnriched.forEach(item => {
      const date = item.납기일자 || "날짜미정";
      if (!map[date]) map[date] = { 납기일자: date, 건수: 0, 총수량: 0 };
      map[date].건수++; map[date].총수량 += item.수량;
    });
    return Object.values(map).sort((a, b) => {
      if (a.납기일자 === "날짜미정") return 1;
      if (b.납기일자 === "날짜미정") return -1;
      return new Date(a.납기일자) - new Date(b.납기일자);
    });
  }, [shipEnriched]);

  // ── 로딩 화면 ──────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Pretendard','Malgun Gothic',sans-serif", color: "#64748b" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏭</div>
        <div>서버에서 데이터를 불러오는 중...</div>
        {parseMsg && <div style={{ marginTop: 8, color: "#ef4444", fontSize: "0.875rem" }}>{parseMsg}</div>}
      </div>
    </div>
  );

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ fontFamily: "'Pretendard','Malgun Gothic',sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>

        {/* 상단 네비게이션 바 */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏭</span>
            <div className="header-title" style={{ fontWeight: 700, fontSize: 15 }}>출하 일정관리</div>
          </div>
          <button
            className="header-btn"
            onClick={() => { setView(view === "input" ? "dash" : "input"); setParseMsg(null); }}
            style={{ background: "#ffffff22", color: "#fff", border: "1px solid #ffffff44", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            {view === "input" ? "← 대시보드" : "📂 업로드 설정"}
          </button>
        </div>

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
              kceText={kceText}
              setKceText={setKceText}
              handleKceParse={handleKceParse}
              kceData={kceData}
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
              prodSummaryData={prodSummaryData}
              dailySummaryData={dailySummaryData}
              allShipData={shipEnriched}
              apiSaveMemo={api.saveMemo}
              initialMemos={memos}
            />
          )}
        </div>
      </div>
    </>
  );
}