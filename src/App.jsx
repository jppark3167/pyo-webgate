import React from "react";
import { globalCss } from "./utils";
import { InputView, DashView } from "./components";
import { useAppLogic } from "./useAppLogic"; // 분리한 커스텀 훅 가져오기

export default function App() {
  // 복잡한 비즈니스 로직과 State는 커스텀 훅에서 모두 처리해서 가져옵니다.
  const logic = useAppLogic();

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ fontFamily: "'Pretendard','Malgun Gothic',sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* 상단 네비게이션 헤더 */}
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "18px" }}>📊 물류 제조 통합 대시보드</h1>
          <div>
            <button 
              onClick={() => logic.setView("dash")} 
              style={{ background: logic.view === "dash" ? "#2563eb" : "transparent", color: "#fff", border: "1px solid #fff", padding: "6px 12px", borderRadius: "4px", marginRight: "8px", cursor: "pointer", fontWeight: "600" }}
            >
              대시보드 보기
            </button>
            <button 
              onClick={() => logic.setView("input")} 
              style={{ background: logic.view === "input" ? "#2563eb" : "transparent", color: "#fff", border: "1px solid #fff", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
            >
              데이터 입력
            </button>
          </div>
        </div>
        
        {/* 본문 뷰 렌더링 영역 */}
        <div style={{ padding: "16px" }}>
          {logic.view === "dash" ? (
            <DashView 
              mainTab={logic.mainTab} setMainTab={logic.setMainTab}
              search={logic.search} setSearch={logic.setSearch}
              filterDate={logic.filterDate} setFilterDate={logic.setFilterDate}
              filterStatus={logic.filterStatus} setFilterStatus={logic.setFilterStatus}
              sortDesc={logic.sortDesc} setSortDesc={logic.setSortDesc}
              prodEnriched={logic.prodEnriched} 
              shipEnriched={logic.shipEnriched}
              priceCheckData={logic.priceCheckData} 
              dailySummaryData={logic.dailySummaryData}
            />
          ) : (
            <InputView 
              setView={logic.setView} 
              handleResetData={logic.handleResetData} 
              parseMsg={logic.parseMsg}
              handleProdFile={logic.handleProdFile} prodData={logic.prodData} prodFile={logic.prodFile}
              handleInvFile={logic.handleInvFile} invData={logic.invData} invFile={logic.invFile}
              handlePriceFile={logic.handlePriceFile} priceData={logic.priceData} priceFile={logic.priceFile}
              shipText={logic.shipText} setShipText={logic.setShipText} 
              handleShipParse={logic.handleShipParse}
            />
          )}
        </div>
      </div>
    </>
  );
}