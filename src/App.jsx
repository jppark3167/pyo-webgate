import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

// ── 모바일 반응형을 위한 내부 CSS ──────────────────────────
const globalCss = `
  /* 좌우 스와이프는 가능하되 스크롤바는 숨김 처리 */
  .swipe-menu { overflow-x: auto; -webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none; }
  .swipe-menu::-webkit-scrollbar { display: none; }
  
  /* 모바일 화면 (가로 640px 이하) 맞춤 스타일 */
  @media (max-width: 640px) {
    .header-title { font-size: 14px !important; }
    .header-btn { font-size: 11px !important; padding: 5px 10px !important; }
    .page-container { padding: 12px 10px !important; }
    .stat-btn { font-size: 11px !important; padding: 6px 10px !important; }
    .tab-btn { font-size: 12px !important; padding: 10px 10px !important; }
    .table-th, .table-td { font-size: 11px !important; padding: 6px 8px !important; }
  }
`;

// ── 유틸리티 함수 ──────────────────────────────────────────
const fmtD = s => s?.length >= 10 ? s.slice(5) : (s || "-");
const fmtN = n => (typeof n === "number") ? n.toLocaleString("ko-KR") : (n ?? "-");
const str = v => (v === null || v === undefined) ? "" : String(v).trim();
const num = v => {
  if (v === null || v === undefined || v === "") return 0;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

function fmtXlDate(v) {
  if (!v && v !== 0) return "";
  if (typeof v === "string") return v.slice(0, 10).replace(/\./g, "-");
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

// 향상된 유연한 엑셀 파싱 로직
function parseExcelDynamic(rawArray, keyIdentifiers) {
  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < Math.min(30, rawArray.length); i++) {
    if (!rawArray[i]) continue;
    const rowStr = rawArray[i].join("").replace(/\s/g, "");

    const isHeader = keyIdentifiers.every(k => {
      if (Array.isArray(k)) {
        return k.some(subKey => rowStr.includes(subKey));
      }
      return rowStr.includes(k);
    });

    if (isHeader) {
      headerIdx = i;
      headers = rawArray[i].map(h => str(h).replace(/\n|\r/g, ""));
      break;
    }
  }

  if (headerIdx === -1) return [];

  const data = [];
  for (let i = headerIdx + 1; i < rawArray.length; i++) {
    const row = rawArray[i];
    if (!row || row.length === 0 || !row.some(c => c)) continue;

    const firstCell = str(row[0]).toUpperCase();
    if (firstCell.includes("TOTAL") || firstCell.includes("합계") || firstCell.includes("총계")) continue;

    const obj = {};
    headers.forEach((colName, idx) => { if (colName) obj[colName] = row[idx]; });
    data.push(obj);
  }
  return data;
}

function findInv(invData, prodCode, modelName) {
  if (!prodCode && !modelName) return null;
  const cCode = str(prodCode).toUpperCase();
  const cModel = str(modelName).toUpperCase();
  let hit = invData.find(r => str(r.품번).toUpperCase() === cCode);
  if (hit) return hit;
  const base = cCode.replace(/-\d+T\d+[\/\w]*$/, "").replace(/\(P2P\)/, "").trim();
  if (base.length > 5) {
    hit = invData.find(r => r.품번?.toUpperCase().startsWith(base) || r.품명?.toUpperCase().startsWith(base));
    if (hit) return hit;
  }
  if (cModel.length > 3) {
    hit = invData.find(r => r.품명?.toUpperCase().includes(cModel) || r.품번?.toUpperCase().includes(cModel));
    if (hit) return hit;
  }
  return null;
}

function shipStatus(invQty, needed) {
  if (invQty === null || invQty === undefined) return "unknown";
  if (invQty < 0) return "neg";
  if (invQty >= needed) return "ok";
  return "shortage";
}

const STATUS = {
  ok: { bg: "#dcfce7", bdr: "#86efac", txt: "#166534", label: "출하가능" },
  shortage: { bg: "#fee2e2", bdr: "#fca5a5", txt: "#991b1b", label: "재고부족" },
  neg: { bg: "#fff1f2", bdr: "#fda4af", txt: "#9f1239", label: "마이너스" },
  unknown: { bg: "#fef9c3", bdr: "#fde047", txt: "#713f12", label: "미확인" },
};

const TH = { background: "#f8fafc", padding: "8px 10px", fontSize: 12, color: "#475569", fontWeight: 700, textAlign: "left", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const TD = { padding: "8px 10px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", whiteSpace: "nowrap" };

const ShipBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.unknown;
  return <span style={{ background: s.bg, color: s.txt, border: `1px solid ${s.bdr}`, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
};

function DropZone({ label, icon, accept, onFile, loaded, fileName }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const handle = f => { if (f) onFile(f); };
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => ref.current.click()}
      style={{
        border: `2px dashed ${drag ? "#3b82f6" : loaded ? "#4ade80" : "#cbd5e1"}`, borderRadius: 12, padding: "22px 16px",
        textAlign: "center", cursor: "pointer", background: drag ? "#eff6ff" : loaded ? "#f0fdf4" : "#f8fafc", transition: "all .2s",
        wordBreak: "keep-all"
      }}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => handle(e.target.files[0])} />
      <div style={{ fontSize: 28, marginBottom: 6 }}>{loaded ? "✅" : icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: loaded ? "#166534" : "#334155" }}>{label}</div>
      <div style={{ fontSize: 11, color: loaded ? "#64748b" : "#94a3b8", marginTop: 3, wordBreak: "break-all" }}>{fileName || "터치하여 파일 선택"}</div>
    </div>
  );
}

// 초기 데이터 로드 (Local Storage)
const loadData = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) { return []; }
};

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

  // 데이터 변경 시 Local Storage 저장
  useEffect(() => {
    localStorage.setItem('wg_prod', JSON.stringify(prodData));
    localStorage.setItem('wg_inv', JSON.stringify(invData));
    localStorage.setItem('wg_ship', JSON.stringify(shipData));
    localStorage.setItem('wg_prodFile', prodFile);
    localStorage.setItem('wg_invFile', invFile);
  }, [prodData, invData, shipData, prodFile, invFile]);

  // 데이터 전체 초기화
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
          ["생산", "계획", "출하"],
          ["모델", "품명", "제품코드", "품번"],
          ["수량", "계획수량"]
        ]);

        const mapped = parsed.map(r => ({
          생산계획일자: fmtXlDate(r["생산계획일자"] || r["생산일"] || r["계획일"]),
          출하일자: fmtXlDate(r["출하일자"] || r["출하일"] || r["납기일"]),
          고객명: str(r["고객명"] || r["고객"] || r["거래처"]),
          제조지시서번호: str(r["제조지시서번호"] || r["지시서번호"] || r["지시번호"]),
          수량: num(r["수량"] || r["계획수량"]),
          모델명: str(r["모델명"] || r["모델"] || r["품명"]),
          제품코드: str(r["제품코드"] || r["품번"] || r["품목코드"]),
          규격: str(r["규격"] || r["스펙"] || r["SPEC"]),
          비고: str(r["비고"] || r["NOTE"])
        })).filter(r => r.고객명 && r.수량 > 0);

        if (mapped.length > 0) { setProdData(mapped); setParseMsg(`✅ 생산계획 ${mapped.length}건 로드 완료`); }
        else { setParseMsg("⚠️ 생산계획 데이터를 찾을 수 없습니다."); }
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
          ["품번", "품목코드", "품목번호", "제품코드", "ITEM_CODE"],
          ["재고수량", "현재고", "수량", "재고", "실재고"]
        ]);

        const mapped = parsed.map(r => ({
          품번: str(r["품번"] || r["품목코드"] || r["품목번호"] || r["제품코드"] || r["ITEM_CODE"]),
          품명: str(r["품명"] || r["품목명"] || r["ITEM_NAME"] || r["제품명"]),
          규격: str(r["규격"] || r["SPEC"] || r["스펙"]),
          재고수량: num(r["재고수량"] || r["현재고"] || r["수량"] || r["재고"] || r["실재고"]),
          품목분류1: str(r["품목분류1"] || r["품목분류"] || r["분류"])
        })).filter(r => r.품번);

        if (mapped.length > 0) { setInvData(mapped); setParseMsg(`✅ 재고현황 ${mapped.length}품목 로드 완료`); }
        else { setParseMsg("⚠️ 재고현황 데이터를 찾을 수 없습니다."); }
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
    const inv = findInv(invData, r.제품코드, r.모델명);
    return { ...r, _inv: inv, _status: shipStatus(inv?.재고수량 ?? null, r.수량) };
  }), [prodData, invData]);

  const shipEnriched = useMemo(() => shipData.map(r => {
    const inv = findInv(invData, r.품목번호 || r.품목명, r.품목명);
    return { ...r, _inv: inv, _status: shipStatus(inv?.재고수량 ?? null, r.수량) };
  }), [shipData, invData]);

  const prodStats = useMemo(() => {
    const c = { ok: 0, shortage: 0, neg: 0, unknown: 0 };
    const activeData = mainTab === 'ship' ? shipEnriched : prodEnriched;
    activeData.forEach(r => c[r._status]++);
    return c;
  }, [prodEnriched, shipEnriched, mainTab]);

  const filteredProd = useMemo(() => {
    const q = search.toLowerCase();
    return prodEnriched.filter(r => {
      const mQ = !q || r.고객명?.toLowerCase().includes(q) || r.모델명?.toLowerCase().includes(q) || r.제품코드?.toLowerCase().includes(q);
      const mD = !filterDate || r.출하일자 === filterDate;
      const mS = filterStatus === "all" || r._status === filterStatus;
      return mQ && mD && mS;
    });
  }, [prodEnriched, search, filterDate, filterStatus]);

  const filteredShip = useMemo(() => {
    const q = search.toLowerCase();
    return shipEnriched.filter(r => {
      const mQ = !q || r.거래처명?.toLowerCase().includes(q) || r.품목명?.toLowerCase().includes(q) || r.품목번호?.toLowerCase().includes(q);
      const mD = !filterDate || r.납기일자 === filterDate;
      const mS = filterStatus === "all" || r._status === filterStatus;
      return mQ && mD && mS;
    });
  }, [shipEnriched, search, filterDate, filterStatus]);

  const negInvList = useMemo(() => invData.filter(r => r.재고수량 < 0), [invData]);

  const InputView = () => (
    <div className="page-container" style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="header-btn" onClick={() => setView("dash")} style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← 대시보드로</button>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>데이터 입력</h2>
        </div>
        <button className="header-btn" onClick={handleResetData} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>🗑️ 전체 초기화</button>
      </div>

      {parseMsg && (
        <div style={{ background: parseMsg.startsWith("✅") ? "#f0fdf4" : parseMsg.startsWith("⚠️") ? "#fefce8" : "#fef2f2", border: `1px solid ${parseMsg.startsWith("✅") ? "#bbf7d0" : parseMsg.startsWith("⚠️") ? "#fde68a" : "#fecaca"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: parseMsg.startsWith("✅") ? "#166534" : parseMsg.startsWith("⚠️") ? "#713f12" : "#991b1b", wordBreak: "keep-all" }}>
          {parseMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📋 생산계획 파일</div>
          <DropZone label="생산계획 업로드" icon="📋" accept=".xlsx,.xls,.csv" onFile={handleProdFile} loaded={prodData.length > 0} fileName={prodFile} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🏭 재고현황 파일</div>
          <DropZone label="재고현황 업로드" icon="🏭" accept=".xlsx,.xls,.csv" onFile={handleInvFile} loaded={invData.length > 0} fileName={invFile} />
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🚚 출하의뢰현황 (ERP 텍스트 붙여넣기)</div>
        <textarea
          value={shipText} onChange={e => setShipText(e.target.value)}
          placeholder="ERP 복사 텍스트 붙여넣기"
          style={{ width: "100%", boxSizing: "border-box", height: 120, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px", fontSize: 11, fontFamily: "monospace", outline: "none", resize: "vertical" }}
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={handleShipParse} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, width: "100%" }}>파싱 적용</button>
        </div>
      </div>
    </div>
  );

  const DashView = () => (
    <>
      <div className="swipe-menu" style={{ display: "flex", gap: 8, padding: "10px 18px", background: "#fff", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
        {[
          { key: "all", label: "전체", cnt: mainTab === 'ship' ? shipEnriched.length : prodEnriched.length, color: "#475569" },
          { key: "ok", label: "✅ 출하가능", cnt: prodStats.ok, color: "#166534" },
          { key: "shortage", label: "❌ 재고부족", cnt: prodStats.shortage, color: "#991b1b" },
          { key: "unknown", label: "⚠️ 미확인", cnt: prodStats.unknown, color: "#713f12" }
        ].map(s => (
          // 💡 버튼 내 텍스트와 숫자 수직 중앙 정렬 (display: flex, alignItems: center)
          <button key={s.key} className="stat-btn" onClick={() => { setFilterStatus(s.key); }} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, background: filterStatus === s.key ? STATUS[s.key]?.bg || "#f1f5f9" : "#f8fafc", border: `1.5px solid ${filterStatus === s.key ? s.color + "55" : "#e2e8f0"}`, borderRadius: 8, padding: "6px 13px", cursor: "pointer", fontSize: 12, fontWeight: filterStatus === s.key ? 700 : 400, color: filterStatus === s.key ? s.color : "#64748b" }}>
            {s.label} <strong style={{ lineHeight: 1 }}>{s.cnt}</strong>
          </button>
        ))}
      </div>

      <div className="swipe-menu" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 18px", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
        {[
          { key: "ship", label: "🚚 출하의뢰", extra: shipEnriched.filter(r => r._status !== "ok").length },
          { key: "prod", label: "📋 생산계획" },
          { key: "inv", label: "⚠️ 마이너스재고", extra: negInvList.length }
        ].map(t => (
          // 💡 탭 버튼 내 텍스트와 뱃지 수직 중앙 정렬 (display: flex, alignItems: center)
          <button key={t.key} className="tab-btn" onClick={() => setMainTab(t.key)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 6px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: 13, borderBottom: mainTab === t.key ? "2.5px solid #3b82f6" : "2.5px solid transparent", color: mainTab === t.key ? "#1d4ed8" : "#94a3b8" }}>
            {t.label}
            {t.extra > 0 && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: t.key === "inv" ? "#ef4444" : "#f59e0b", color: "#fff", borderRadius: 10, padding: "2px 7px", fontSize: 10, fontWeight: 700, lineHeight: 1, minHeight: "18px" }}>{t.extra}</span>}
          </button>
        ))}
      </div>

      <div className="page-container" style={{ padding: "14px 16px" }}>

        {/* 1. 출하의뢰 탭 */}
        {mainTab === "ship" && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div className="swipe-menu">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead><tr>{["상태", "납기일자", "거래처명", "품목명", "수량", "현재고", "담당자", "진행상태"].map(h => <th key={h} className="table-th" style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredShip.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                      <td className="table-td" style={TD}><ShipBadge status={r._status} /></td>
                      <td className="table-td" style={{ ...TD, fontWeight: 700, color: "#0369a1" }}>{fmtD(r.납기일자)}</td>
                      <td className="table-td" style={{ ...TD, fontWeight: 600 }}>{r.거래처명}</td>
                      <td className="table-td" style={TD}>
                        <div>{r.품목명}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.품목번호}</div>
                      </td>
                      <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtN(r.수량)}</td>
                      <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{r._inv ? fmtN(r._inv.재고수량) : "—"}</td>
                      <td className="table-td" style={TD}>{r.담당자}</td>
                      <td className="table-td" style={TD}>
                        <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, fontSize: 11, color: "#475569" }}>{r.상태}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredShip.length === 0 && <tr><td colSpan="8" style={{ ...TD, textAlign: "center", padding: "30px", color: "#94a3b8" }}>출하의뢰 데이터가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. 생산계획 탭 (💡 상태 열 제거 완료) */}
        {mainTab === "prod" && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div className="swipe-menu">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "550px" }}>
                <thead><tr>{["출하일", "고객명", "모델명", "수량", "현재고", "비고"].map(h => <th key={h} className="table-th" style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredProd.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                      <td className="table-td" style={{ ...TD, fontWeight: 700, color: "#1d4ed8" }}>{fmtD(r.출하일자)}</td>
                      <td className="table-td" style={{ ...TD, fontWeight: 600 }}>{r.고객명}</td>
                      <td className="table-td" style={TD}>{r.모델명}</td>
                      <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtN(r.수량)}</td>
                      <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{r._inv ? fmtN(r._inv.재고수량) : "—"}</td>
                      <td className="table-td" style={{ ...TD, whiteSpace: "normal", wordBreak: "keep-all", minWidth: "100px", fontSize: 11 }}>{r.비고}</td>
                    </tr>
                  ))}
                  {filteredProd.length === 0 && <tr><td colSpan="6" style={{ ...TD, textAlign: "center", padding: "30px", color: "#94a3b8" }}>데이터가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. 마이너스 재고 탭 */}
        {mainTab === "inv" && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div className="swipe-menu">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                <thead><tr>{["상태", "품번", "품명", "규격", "재고수량"].map(h => <th key={h} className="table-th" style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {negInvList.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
                      <td className="table-td" style={TD}><ShipBadge status="neg" /></td>
                      <td className="table-td" style={{ ...TD, fontWeight: 700 }}>{r.품번}</td>
                      <td className="table-td" style={TD}>{r.품명}</td>
                      <td className="table-td" style={{ ...TD, color: "#64748b", fontSize: 11 }}>{r.규격}</td>
                      <td className="table-td" style={{ ...TD, textAlign: "right", fontWeight: 700, color: "#ef4444" }}>{fmtN(r.재고수량)}</td>
                    </tr>
                  ))}
                  {negInvList.length === 0 && <tr><td colSpan="5" style={{ ...TD, textAlign: "center", padding: "30px", color: "#166534", fontWeight: 700 }}>🎉 마이너스 재고가 없습니다!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );

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
        {view === "input" ? <InputView /> : <DashView />}
      </div>
    </>
  );
}