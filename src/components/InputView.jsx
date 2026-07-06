export function InputView({
    handleResetData, parseMsg,
    handleProdFile, prodData, prodFile,
    handleInvFile, invData, invFile,
    shipText, setShipText, handleShipParse,
    kceText, setKceText, handleKceParse, kceData,
    kceSheetUrl, setKceSheetUrl, handleKceSync, kceSyncing, kceLastSync
}) {
    return (
        <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#334155", margin: 0 }}>📂 데이터 입력 및 설정</h2>
                <button onClick={handleResetData} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}>
                    데이터 전체 초기화
                </button>
            </div>

            <Card title="🏭 생산 데이터 업로드 (Excel)">
                <input type="file" accept=".xlsx, .xls" onChange={(e) => { if (e.target.files[0]) handleProdFile(e.target.files[0]); }} />
                {prodFile && <Status text={`✅ ${prodFile} (총 ${prodData?.length || 0}건)`} />}
            </Card>

            <Card title="📦 재고 데이터 업로드 (Excel)">
                <input type="file" accept=".xlsx, .xls" onChange={(e) => { if (e.target.files[0]) handleInvFile(e.target.files[0]); }} />
                {invFile && <Status text={`✅ ${invFile} (총 ${invData?.length || 0}건)`} />}
            </Card>

            <Card title="🚚 출하 의뢰 텍스트 붙여넣기">
                <TextArea value={shipText} onChange={setShipText} placeholder="ERP에서 복사한 출하 의뢰 텍스트를 붙여넣으세요..." />
                <SubmitButton onClick={handleShipParse} label="데이터 파싱 및 출하 목록 적용" />
                {parseMsg && <p style={{ fontSize: "0.8125rem", color: parseMsg.includes("✅") ? "#166534" : "#b91c1c", marginTop: "0.75rem", fontWeight: "600" }}>{parseMsg}</p>}
            </Card>

            <Card title="🔗 KCE 입고일정 — 구글 시트 자동 동기화">
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 0, marginBottom: "0.75rem" }}>
                    "링크가 있는 모든 사용자(뷰어)"로 공개된 구글 시트 링크를 등록하면 1시간마다 자동으로 최신 데이터를 가져옵니다. 필요할 때 아래 버튼으로 즉시 동기화할 수도 있습니다.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        value={kceSheetUrl}
                        onChange={e => setKceSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..."
                        style={{ flex: "1 1 260px", padding: "0.6rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8125rem", boxSizing: "border-box", fontFamily: "inherit" }} />
                    <button
                        onClick={() => handleKceSync()}
                        disabled={kceSyncing || !kceSheetUrl?.trim()}
                        style={{
                            background: kceSyncing ? "#94a3b8" : "#0f766e", color: "#fff", border: "none", borderRadius: "6px",
                            padding: "0.6rem 1rem", fontSize: "0.8125rem", fontWeight: "600",
                            cursor: kceSyncing || !kceSheetUrl?.trim() ? "default" : "pointer", whiteSpace: "nowrap",
                        }}>
                        {kceSyncing ? "동기화 중..." : "🔄 지금 동기화"}
                    </button>
                </div>
                {kceLastSync && (
                    <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem", marginBottom: 0 }}>
                        마지막 동기화: {new Date(kceLastSync).toLocaleString("ko-KR")}
                    </p>
                )}
                {kceData?.length > 0 && (
                    <Status text={`✅ KCE ${kceData.length}건 (${[...new Set(kceData.map(d => d.품번))].length}개 품번)`} />
                )}
            </Card>

            <Card title="📥 KCE 입고일정 수동 붙여넣기" last>
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 0, marginBottom: "0.75rem" }}>
                    구글 시트 연동 대신 직접 붙여넣을 수도 있습니다. 품번 / 수량 / 발주일 / 입고예정일 / 미입고수 / 담당자 순서로 붙여넣으세요.<br />
                    입고예정일은 "136대 6/2 / 64대 7/3"처럼 여러 날짜를 적어도 자동 분리되며, 납기일보다 늦게 들어오는 물량은 가용재고로 잡지 않습니다.
                </p>
                <TextArea value={kceText} onChange={setKceText} placeholder="KCE 입고일정 데이터를 붙여넣으세요..." />
                <SubmitButton onClick={handleKceParse} label="KCE 입고일정 적용" color="#0f766e" />
            </Card>
        </div>
    );
}

function Card({ title, children, last }) {
    return (
        <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: last ? 0 : "1rem" }}>
            <h3 style={{ fontSize: "0.9375rem", marginTop: 0, marginBottom: "0.75rem", color: "#1e3a5f" }}>{title}</h3>
            {children}
        </div>
    );
}

function TextArea({ value, onChange, placeholder }) {
    return (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            style={{ width: "100%", height: "120px", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8125rem", boxSizing: "border-box", fontFamily: "inherit" }} />
    );
}

function SubmitButton({ onClick, label, color = "#1e3a5f" }) {
    return (
        <button onClick={onClick} style={{ background: color, color: "#fff", border: "none", borderRadius: "6px", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer", marginTop: "0.75rem", width: "100%" }}>
            {label}
        </button>
    );
}

function Status({ text }) {
    return <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.5rem", fontWeight: "600" }}>{text}</p>;
}
