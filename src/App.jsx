// App.jsx: 메인 애플리케이션 컴포넌트 (서버 연동 + KCE 입고일정 버전)
import { useState, useMemo, useCallback, useEffect } from "react";
import { globalCss, str, num, findInv, normDate, toDateStr, parseTSV, parseKceSchedule } from "./utils";
import { InputView, DashView, HomeView, HelperView } from "./components/index";
import { Login } from "./components/Login";
import { AdminGate } from "./components/AdminGate";
import { processProdFile, processInvFile } from "./excelParser";
import { api } from "./api";

// 납기일 오름차순 비교 (납기일 없는 건은 뒤로)
const byDueDate = (a, b) => {
  const da = str(a.납기일자), db = str(b.납기일자);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da.localeCompare(db);
};

// 출하의뢰 정렬: 컬럼 → {필드, 타입, 첫 클릭 기본방향}
const SHIP_SORT = {
  "납기일자": { field: "납기일자", type: "date", dir: "desc" },   // 최근순
  "의뢰처명": { field: "거래처명", type: "ko", dir: "asc" },       // 가나다
  "품목명": { field: "품목명", type: "ko", dir: "asc" },           // abc
  "수량": { field: "수량", type: "num", dir: "asc" },              // 작은순
  "현재고": { field: "_currentInvQty", type: "num", dir: "asc" },
  "생산예정": { field: "_incomingProd", type: "num", dir: "asc" },
  "KCE 입고": { field: "_kceIncoming", type: "num", dir: "asc" },
  "예상재고": { field: "_projectedInvQty", type: "num", dir: "asc" },
  "상태": { field: "_status", type: "status", dir: "asc" },        // 재고부족 먼저
  "의뢰번호": { field: "출하의뢰번호", type: "reqnum", dir: "asc" }, // YYYYMMDD+000+순번
};
const STATUS_RANK = { shortage: 0, ok: 1 };

function shipComparator(key, dir) {
  const cfg = SHIP_SORT[key] || SHIP_SORT["납기일자"];
  const sign = dir === "desc" ? -1 : 1;
  return (a, b) => {
    if (cfg.type === "date") {
      const da = normDate(a[cfg.field]), db = normDate(b[cfg.field]);
      if (!da && !db) return 0;
      if (!da) return 1;          // 날짜 없는 건 방향과 무관하게 항상 뒤로
      if (!db) return -1;
      return sign * da.localeCompare(db);
    }
    if (cfg.type === "reqnum") {
      // 숫자만 추출해 비교 (자릿수가 달라도 올바른 순번 정렬). 빈 값은 항상 뒤로
      const ra = str(a[cfg.field]).replace(/\D/g, ""), rb = str(b[cfg.field]).replace(/\D/g, "");
      if (!ra && !rb) return 0;
      if (!ra) return 1;
      if (!rb) return -1;
      if (ra.length !== rb.length) return sign * (ra.length - rb.length);
      return sign * ra.localeCompare(rb);
    }
    if (cfg.type === "num") return sign * ((Number(a[cfg.field]) || 0) - (Number(b[cfg.field]) || 0));
    if (cfg.type === "status") return sign * ((STATUS_RANK[a[cfg.field]] ?? 9) - (STATUS_RANK[b[cfg.field]] ?? 9));
    return sign * str(a[cfg.field]).localeCompare(str(b[cfg.field]), "ko");
  };
}

export default function App() {
  const [prodData, setProdData] = useState([]);
  const [invData, setInvData] = useState([]);
  const [shipData, setShipData] = useState([]);
  const [kceData, setKceData] = useState([]);
  const [memos, setMemos] = useState({});
  const [quick, setQuick] = useState({});   // 퀵 배송정보: { key: {address, boxCount, ...스냅샷} }

  const [prodFile, setProdFile] = useState("");
  const [invFile, setInvFile] = useState("");
  const [screen, setScreen] = useState("home");   // home(분기) / dashboard / helper
  const [view, setView] = useState("dash");
  const [shipText, setShipText] = useState("");
  const [kceText, setKceText] = useState("");
  const [kceSheetUrl, setKceSheetUrl] = useState("");
  const [kceLastSync, setKceLastSync] = useState("");
  const [kceSyncing, setKceSyncing] = useState(false);
  const [shipSheetUrl, setShipSheetUrl] = useState("");
  const [shipLastSync, setShipLastSync] = useState("");
  const [shipSyncing, setShipSyncing] = useState(false);
  const [parseMsg, setParseMsg] = useState(null);
  const [mainTab, setMainTab] = useState("ship_dom");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [shipSort, setShipSort] = useState({ key: "납기일자", dir: "desc" });
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(api.isLoggedIn());
  const [adminUnlocked, setAdminUnlocked] = useState(false);   // 관리자 페이지 2차 비밀번호 통과 여부 (새로고침 시 초기화)
  const [showAdminGate, setShowAdminGate] = useState(false);

  // ── 로그인 후 서버에서 전체 데이터 로드 ──────
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    api.getData()
      .then(db => {
        if (cancelled) return;
        setProdData(db.prodData || []);
        setInvData(db.invData || []);
        setShipData(db.shipData || []);
        setKceData(db.kceData || []);
        setMemos(db.memos || {});
        setQuick(db.quick || {});
        setProdFile(db.prodFile || "");
        setInvFile(db.invFile || "");
        setKceSheetUrl(db.kceSheetUrl || "");
        setKceLastSync(db.kceLastSync || "");
        setShipSheetUrl(db.shipSheetUrl || "");
        setShipLastSync(db.shipLastSync || "");
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.message === "UNAUTHORIZED") setAuthed(false);   // 토큰 만료/무효 → 로그인 화면
        else setParseMsg("⚠️ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authed]);

  // ── 전체 초기화 ───────────────────────────────
  const handleResetData = async () => {
    if (!window.confirm("모든 데이터를 초기화하시겠습니까?")) return;
    await api.resetAll();
    setProdData([]); setInvData([]); setShipData([]); setKceData([]); setMemos({}); setQuick({});
    setProdFile(""); setInvFile(""); setShipText(""); setKceText("");
    setKceSheetUrl(""); setKceLastSync("");
    setParseMsg("✅ 모든 데이터가 초기화되었습니다.");
  };

  // ── 퀵 배송정보 저장/해제 ─────────────────────
  // value가 null이면 퀵 지정 해제, 객체면 저장(upsert)
  const handleSaveQuick = useCallback(async (key, value) => {
    setQuick(prev => {
      const next = { ...prev };
      if (value == null) delete next[key]; else next[key] = value;
      return next;
    });
    try { await api.saveQuick(key, value); }
    catch { setParseMsg("⚠️ 퀵 정보 저장에 실패했습니다. 새로고침 후 다시 시도하세요."); }
  }, []);

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
      setQuick({});   // 출하의뢰 교체 시 기존 퀵 지정도 초기화 (서버와 동일)
      setParseMsg(`✅ ${parsedData.length}건의 출하의뢰 데이터가 성공적으로 입력되었습니다.`);
      setShipText("");
      setView("dash");
    } catch (error) {
      console.error(error);
      setParseMsg("❌ 파싱 중 오류가 발생했습니다. 데이터 형식을 다시 확인해주세요.");
    }
  };

  // ── 출하의뢰 — 구글 시트(뷰어 공개) 동기화 ─────────────
  // 서버가 1시간마다 자동 동기화하지만, 버튼으로도 즉시 동기화 가능
  const handleShipSync = async (urlOverride) => {
    const url = (urlOverride ?? shipSheetUrl).trim();
    if (!url) { setParseMsg("⚠️ 구글 시트 URL을 입력하세요"); return; }
    setShipSyncing(true);
    try {
      const result = await api.syncShip(url);
      setShipData(result.shipData || []);
      setShipSheetUrl(url);
      setShipLastSync(result.syncedAt || "");
      setQuick(result.quick || {});   // 서버가 초기화 + 출하타입 힌트(퀵 등) 시드까지 반영한 최신 상태
      setParseMsg(`✅ 구글 시트 동기화 완료 (${result.count}건)`);
    } catch (e) {
      console.error(e);
      setParseMsg(`❌ 구글 시트 동기화 실패: ${e.message}`);
    } finally {
      setShipSyncing(false);
    }
  };

  // ── KCE 입고일정 텍스트 파싱 ─────────────────
  // 컬럼 순서: 품번 / 수량 / 발주일 / 입고예정일(메모) / 미입고수 / 담당자
  const handleKceParse = async () => {
    if (!kceText.trim()) { setParseMsg("⚠️ KCE 입고일정 텍스트를 입력하세요"); return; }
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const rows = parseTSV(kceText.trim());

      const parsed = rows.map(cols => {
        const c = cols.map(x => str(x));
        const 입고예정일 = c[3] || "";
        const 미입고수 = num(c[4]);
        return {
          품번: c[0],
          발주수량: num(c[1]),
          발주일: c[2] || "",
          입고예정일,                                   // 원본 메모 (표시/디버그용)
          미입고수,                                     // 아직 입고되지 않은 수량 (= 공급 반영 대상)
          담당자: c[5] || "",
          _schedule: parseKceSchedule(입고예정일, 미입고수, today),  // [{date, qty}] 절대일자
        };
      }).filter(item => item.품번 && item.미입고수 > 0);

      setKceData(parsed);
      await api.saveKce(parsed);
      setParseMsg(`✅ KCE 입고일정 ${parsed.length}건 입력 완료`);
      setKceText("");
    } catch (e) {
      console.error(e);
      setParseMsg("❌ KCE 데이터 파싱 중 오류가 발생했습니다.");
    }
  };

  // ── KCE 입고일정 — 구글 시트(뷰어 공개) 동기화 ─────────────
  // 서버가 1시간마다 자동 동기화하지만, 버튼으로도 즉시 동기화 가능
  const handleKceSync = async (urlOverride) => {
    const url = (urlOverride ?? kceSheetUrl).trim();
    if (!url) { setParseMsg("⚠️ 구글 시트 URL을 입력하세요"); return; }
    setKceSyncing(true);
    try {
      const result = await api.syncKce(url);
      setKceData(result.kceData || []);
      setKceSheetUrl(url);
      setKceLastSync(result.syncedAt || "");
      setParseMsg(`✅ 구글 시트 동기화 완료 (${result.count}건)`);
    } catch (e) {
      console.error(e);
      setParseMsg(`❌ 구글 시트 동기화 실패: ${e.message}`);
    } finally {
      setKceSyncing(false);
    }
  };

  // ── 생산계획 입고 일정 맵 (품번 → [{date, qty}]) ──────────────
  // 생산계획일자를 입고 가능 시점으로 사용
  const prodQtyMap = useMemo(() => {
    const map = {};
    prodData.forEach(item => {
      const code = str(item.제품코드).toUpperCase();
      if (!code) return;
      (map[code] ||= []).push({ date: normDate(item.생산계획일자), qty: item.수량 || 0 });
    });
    return map;
  }, [prodData]);

  // ── KCE 입고예정 맵 (품번 → {arrivals: [{date, qty}], undated}) ──────────
  // arrivals = 오늘 이후(미입고) 일자 확정분, undated = 일자 미확정 미입고분(항상 가용으로 간주)
  const kceQtyMap = useMemo(() => {
    const todayStr = toDateStr(new Date());
    const map = {};
    kceData.forEach(item => {
      const code = str(item.품번).toUpperCase();
      if (!code) return;
      if (!map[code]) map[code] = { arrivals: [], unreceived: 0 };
      map[code].unreceived += (item.미입고수 ?? item.발주요청 ?? 0);
      const sched = item._schedule
        || (item.입고예정일 ? [{ date: normDate(item.입고예정일), qty: (item.미입고수 ?? item.발주요청 ?? 0) }] : []);
      sched.forEach(s => map[code].arrivals.push({ date: normDate(s.date), qty: s.qty || 0 }));
    });
    Object.values(map).forEach(e => {
      const future = e.arrivals.filter(a => a.date && a.date >= todayStr);
      const futureSum = future.reduce((s, a) => s + a.qty, 0);
      e.arrivals = future;
      e.undated = Math.max(0, e.unreceived - futureSum);
    });
    return map;
  }, [kceData]);

  // ── 출하의뢰 enriched (납기일 기준 시점별 재고 배분) ─────────
  // 핵심: 납기일보다 늦게 들어오는 생산/KCE는 그 건의 가용재고로 잡지 않는다(결함 2).
  const shipEnriched = useMemo(() => {
    const sumQty = arr => arr.reduce((s, a) => s + (a.qty || 0), 0);
    const uniqDates = arr => [...new Set(arr.map(a => a.date).filter(Boolean))].sort();
    const todayStr = toDateStr(new Date());

    // 1단계: 운반비/기타 제외 + 품목별 정적 정보(현재고·입고일정) 계산
    const rows = shipData.map(r => {
      const isSkip = str(r.품목명).includes("운반비") || str(r.품목명).includes("기타");
      if (isSkip) return { ...r, _skip: true };

      const inv = findInv(invData, r.품목번호);
      const currentInv = inv ? inv.재고수량 : 0;
      const codeUpper = str(r.품목번호).toUpperCase();
      const prodArrivals = prodQtyMap[codeUpper] || [];
      const kceInfo = kceQtyMap[codeUpper] || { arrivals: [], undated: 0 };
      const kceTotal = sumQty(kceInfo.arrivals) + kceInfo.undated;

      // KCE 품번인데 재고도 없고 KCE 입고예정도 전혀 없을 때만 비고 표시
      const isKCE = /^(NK|KT|K)/.test(codeUpper);
      const kceNote = (isKCE && currentInv <= 0 && kceTotal === 0) ? "KCE입고일정 확인 필요" : null;

      return {
        ...r, _skip: false, _codeUpper: codeUpper, _currentInvQty: currentInv,
        _prodArrivals: prodArrivals, _kceArrivals: kceInfo.arrivals, _kceUndated: kceInfo.undated,
        _kceNote: kceNote,
      };
    });

    // 2단계: 품목번호 기준 그룹화 (운반비/기타 제외)
    const groups = {};
    rows.forEach(r => {
      if (r._skip) return;
      (groups[r._codeUpper] ||= []).push(r);
    });

    // 3단계: 그룹별로 납기일 빠른 순 처리 — 각 건 시점에 "그 날까지 들어오는 공급 − 누적 수요"로 판정
    Object.values(groups).forEach(group => {
      group.sort(byDueDate);

      // 동일 품목 + 동일 납기일에 "서로 다른 출하의뢰"가 2건 이상이면 배분 우선순위를 판단할 수 없어 표시
      // (납기일 없는 건 제외 / 같은 출하의뢰번호는 한 건으로 취급 / 완료 건 제외 / 날짜는 normDate로 정규화)
      const ordersByDate = {};
      group.forEach((r, i) => {
        if (str(r.상태) === "완료") return;
        const due = normDate(r.납기일자);
        if (!due) return;
        const orderId = str(r.출하의뢰번호) || `__row${i}`;
        (ordersByDate[due] ||= new Set()).add(orderId);
      });

      const baseInv = group[0]._currentInvQty;        // 현재고(즉시 가용)
      const prodArr = group[0]._prodArrivals;          // 동일 품목이므로 입고일정 공유
      const kceArr = group[0]._kceArrivals;
      const kceUndated = group[0]._kceUndated;         // 일자 미확정분 — 항상 가용으로 간주
      let cumDemand = 0;

      group.forEach(r => {
        const due = normDate(r.납기일자);
        const inTime = a => !due || a.date <= due;     // 납기일까지 들어오면 가용
        const late = a => due && a.date > due;          // 납기일보다 늦게 들어옴

        // 오늘 이전 생산계획 = 이미 생산 완료분 → 생산예정에 합산하지 않고 비고에 "mm/dd 생산"으로 표시
        const prodDone = prodArr.filter(a => a.date && a.date < todayStr);
        const prodPending = prodArr.filter(a => !a.date || a.date >= todayStr);
        const prodInTime = prodPending.filter(inTime);
        const prodLate = prodPending.filter(late);
        const kceInTime = kceArr.filter(inTime);
        const kceLate = kceArr.filter(late);

        const prodInTimeSum = sumQty(prodInTime);
        const kceInTimeSum = sumQty(kceInTime) + kceUndated;

        // 결제란에 "후결"이 아닌 실제 정산액이 적혀 있으면 이미 결제 완료된 건 → 완료 취급(재고계산 제외).
        // 결제란이 비어있는 건(애니원 탭 등 결제 개념이 없는 소스)은 기존과 동일하게 항상 수요로 카운트.
        const isSettled = str(r.결제) !== "" && str(r.결제) !== "후결";
        const countsAsDemand = str(r.상태) !== "완료" && !isSettled;
        cumDemand += countsAsDemand ? (r.수량 || 0) : 0;
        const projected = baseInv + prodInTimeSum + kceInTimeSum - cumDemand;

        r._incomingProd = prodInTimeSum;
        r._incomingProdLate = sumQty(prodLate);
        r._prodDates = uniqDates(prodInTime);
        r._prodLateDates = uniqDates(prodLate);
        r._prodDoneNote = prodDone.length > 0
          ? uniqDates(prodDone).map(d => d.slice(5).replace("-", "/")).join(", ") + " 생산"
          : null;
        r._kceIncoming = kceInTimeSum;
        r._kceIncomingLate = sumQty(kceLate);
        r._kceDates = uniqDates(kceInTime);
        r._kceLateDates = uniqDates(kceLate);
        r._projectedInvQty = projected;

        // 상태는 항상 실제 예상재고 기준. "중복 출하 확인필요"는 재고부족이면서 중복인 건에만 표시
        const isDup = str(r.상태) !== "완료" && due && (ordersByDate[due]?.size >= 2);
        r._status = projected < 0 ? "shortage" : "ok";
        if (isDup && projected < 0) {
          // 품목명이 VBR/VDR/VRN이면 에스원 KCE 물량으로 안내 (노란색)
          const nm = str(r.품목명).toUpperCase();
          if (nm.includes("VBR") || nm.includes("VDR") || nm.includes("VRN")) {
            r._note = "에스원 KCE 물량";
            r._noteType = "esone";
          } else {
            r._note = "중복 출하 확인필요";
            r._noteType = "dup";
          }
        } else {
          r._note = r._kceNote;
          r._noteType = r._kceNote ? "kce" : null;
        }
      });
    });

    // 4단계: 운반비/기타(skip) 행 마무리 후 평탄화
    return rows
      .map(r => r._skip ? {
        ...r, _currentInvQty: null, _incomingProd: 0, _incomingProdLate: 0, _prodDates: [], _prodLateDates: [],
        _kceIncoming: 0, _kceIncomingLate: 0, _kceDates: [], _kceLateDates: [], _projectedInvQty: null,
        _status: "skip", _note: null, _noteType: null, _prodDoneNote: null,
      } : r)
      .filter(item => item._status !== "skip")
      .sort(byDueDate);
  }, [shipData, invData, prodQtyMap, kceQtyMap]);

  // ── 품목별 예상재고 (재고 검색용) ──────────────────
  // 특정 출하의뢰의 납기일에 종속되지 않는, "현재 알려진 모든 미출하 수요 + 입고예정"을 반영한 품목 단위 예상재고.
  // 대시보드의 건별 계산(그룹 내 마지막 납기일 시점 기준)과 동일한 결과가 나오도록,
  // 미출하 대기 수량 중 가장 늦은 납기일(미확정 납기 포함)을 공급 반영 시점으로 사용한다.
  const invEnriched = useMemo(() => {
    const todayStr = toDateStr(new Date());
    const sumQty = arr => arr.reduce((s, a) => s + (a.qty || 0), 0);

    const demandMap = {};
    shipData.forEach(r => {
      if (str(r.품목명).includes("운반비") || str(r.품목명).includes("기타")) return;
      if (str(r.상태) === "완료") return;
      // 결제란에 "후결"이 아닌 실제 정산액이 있으면 이미 완료된 건으로 취급해 제외 (비어있으면 기존과 동일하게 카운트)
      if (str(r.결제) !== "" && str(r.결제) !== "후결") return;
      const code = str(r.품목번호).toUpperCase();
      if (!code) return;
      const due = normDate(r.납기일자);
      const e = (demandMap[code] ||= { totalDemand: 0, maxDue: null, hasUndated: false });
      e.totalDemand += (r.수량 || 0);
      if (!due) e.hasUndated = true;
      else if (!e.maxDue || due > e.maxDue) e.maxDue = due;
    });

    return invData.map(inv => {
      const code = str(inv.품번).toUpperCase();
      const currentInv = inv.재고수량 || 0;
      const prodPending = (prodQtyMap[code] || []).filter(a => !a.date || a.date >= todayStr);
      const kceInfo = kceQtyMap[code] || { arrivals: [], undated: 0 };
      const demand = demandMap[code];
      // 미출하 대기 건이 없거나, 그중 납기 미확정 건이 있으면 입고예정 전부를 가용으로 간주
      const inTime = a => !demand || demand.hasUndated || !demand.maxDue || a.date <= demand.maxDue;

      const prodIncoming = sumQty(prodPending.filter(inTime));
      const kceIncoming = sumQty(kceInfo.arrivals.filter(inTime)) + kceInfo.undated;
      const pendingDemand = demand?.totalDemand || 0;
      const projected = currentInv + prodIncoming + kceIncoming - pendingDemand;

      return {
        품번: inv.품번, 품명: inv.품명, 규격: inv.규격,
        _currentInvQty: currentInv, _incomingProd: prodIncoming, _kceIncoming: kceIncoming,
        _pendingDemand: pendingDemand, _projectedInvQty: projected,
        _status: projected < 0 ? "shortage" : "ok",
      };
    });
  }, [invData, shipData, prodQtyMap, kceQtyMap]);

  // ── 국내/해외 분리 ─────────────────────────────
  const shipOvsEnriched = useMemo(() => shipEnriched.filter(r => ["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);
  const shipDomEnriched = useMemo(() => shipEnriched.filter(r => !["이우제", "김윤식"].includes(str(r.담당자))), [shipEnriched]);

  // ── 생산계획 enriched ──────────────────────────
  const prodEnriched = useMemo(() => prodData.map(r => ({
    ...r, _inv: findInv(invData, r.제품코드), _status: "prod_planned"
  })), [prodData, invData]);

  // ── 검색/필터 ──────────────────────────────────
  const filteredShipDom = useMemo(() => {
    const q = search.toLowerCase();
    return shipDomEnriched.filter(r =>
      (!q || r.거래처명?.toLowerCase().includes(q) || r.품목명?.toLowerCase().includes(q) || r.품목번호?.toLowerCase().includes(q)) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [shipDomEnriched, search, filterStatus]);
  const filteredShipOvs = useMemo(() => {
    const q = search.toLowerCase();
    return shipOvsEnriched.filter(r =>
      (!q || r.거래처명?.toLowerCase().includes(q) || r.품목명?.toLowerCase().includes(q) || r.품목번호?.toLowerCase().includes(q)) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [shipOvsEnriched, search, filterStatus]);
  const filteredProd = useMemo(() => {
    const q = search.toLowerCase();
    return prodEnriched.filter(r =>
      (!q || r.고객명?.toLowerCase().includes(q) || r.모델명?.toLowerCase().includes(q) || r.제품코드?.toLowerCase().includes(q)) &&
      (filterStatus === "all" || r._status === filterStatus)
    );
  }, [prodEnriched, search, filterStatus]);

  // ── 정렬 ───────────────────────────────────────
  // 헤더 클릭: 같은 컬럼이면 방향 토글, 다른 컬럼이면 그 컬럼의 기본방향으로
  const handleShipSort = useCallback((key) => {
    setShipSort(prev => prev.key === key
      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key, dir: (SHIP_SORT[key] || {}).dir || "asc" });
  }, []);

  const sortedShipDom = useMemo(() => [...filteredShipDom].sort(shipComparator(shipSort.key, shipSort.dir)), [filteredShipDom, shipSort]);
  const sortedShipOvs = useMemo(() => [...filteredShipOvs].sort(shipComparator(shipSort.key, shipSort.dir)), [filteredShipOvs, shipSort]);
  const sortedProd = useMemo(() => [...filteredProd].sort((a, b) => {
    const da = normDate(a.생산계획일자), db = normDate(b.생산계획일자);
    if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
    return da.localeCompare(db);
  }), [filteredProd]);

  // ── KCE 입고일정 정렬 (가장 빠른 입고예정일 순, 날짜 미정은 뒤로) ──
  const sortedKce = useMemo(() => {
    const earliestDate = item => {
      const dates = (item._schedule || []).map(s => s.date).filter(Boolean);
      return dates.length ? [...dates].sort()[0] : "";
    };
    return [...kceData].sort((a, b) => {
      const da = earliestDate(a), db = earliestDate(b);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return da.localeCompare(db);
    });
  }, [kceData]);

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

  // ── 로그인 화면 ────────────────────────────────
  if (!authed) return <Login onSuccess={() => { setLoading(true); setScreen("home"); setAuthed(true); }} />;

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

  // ── 분기(랜딩) 화면 ────────────────────────────
  if (screen === "home") return (
    <>
      <style>{globalCss}</style>
      <HomeView
        onSelect={(key) => { setScreen(key); setView("dash"); setParseMsg(null); }}
        onLogout={() => { api.logout(); setAuthed(false); setAdminUnlocked(false); }}
      />
    </>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="header-btn"
              onClick={() => { setScreen("home"); setParseMsg(null); }}
              style={{ background: "#ffffff22", color: "#fff", border: "1px solid #ffffff44", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              🏠 홈
            </button>
            {screen === "dashboard" && (
              <button
                className="header-btn"
                onClick={() => {
                  if (view === "input") { setView("dash"); setParseMsg(null); return; }
                  if (adminUnlocked) { setView("input"); setParseMsg(null); }
                  else setShowAdminGate(true);
                }}
                style={{ background: "#ffffff22", color: "#fff", border: "1px solid #ffffff44", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                {view === "input" ? "← 대시보드" : "🔐 관리자 페이지"}
              </button>
            )}
            <button
              className="header-btn"
              onClick={() => { api.logout(); setAuthed(false); setAdminUnlocked(false); }}
              style={{ background: "transparent", color: "#cbd5e1", border: "1px solid #ffffff33", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="page-container" style={{ padding: "16px" }}>
          {screen === "helper" ? (
            <HelperView ships={shipData} quick={quick} onSave={handleSaveQuick} invItems={invEnriched} />
          ) : view === "input" ? (
            <InputView
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
              shipData={shipData}
              shipSheetUrl={shipSheetUrl}
              setShipSheetUrl={setShipSheetUrl}
              handleShipSync={handleShipSync}
              shipSyncing={shipSyncing}
              shipLastSync={shipLastSync}
              kceText={kceText}
              setKceText={setKceText}
              handleKceParse={handleKceParse}
              kceData={kceData}
              kceSheetUrl={kceSheetUrl}
              setKceSheetUrl={setKceSheetUrl}
              handleKceSync={handleKceSync}
              kceSyncing={kceSyncing}
              kceLastSync={kceLastSync}
            />
          ) : (
            <DashView
              mainTab={mainTab}
              setMainTab={setMainTab}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              search={search}
              setSearch={setSearch}
              shipSort={shipSort}
              onShipSort={handleShipSort}
              sortedShipDom={sortedShipDom}
              sortedShipOvs={sortedShipOvs}
              sortedProd={sortedProd}
              sortedKce={sortedKce}
              prodSummaryData={prodSummaryData}
              dailySummaryData={dailySummaryData}
              allShipData={shipEnriched}
              apiSaveMemo={api.saveMemo}
              initialMemos={memos}
              quick={quick}
              onSaveQuick={handleSaveQuick}
            />
          )}
        </div>
      </div>
      {showAdminGate && (
        <AdminGate
          onSuccess={() => { setAdminUnlocked(true); setShowAdminGate(false); setView("input"); setParseMsg(null); }}
          onCancel={() => setShowAdminGate(false)}
        />
      )}
    </>
  );
}