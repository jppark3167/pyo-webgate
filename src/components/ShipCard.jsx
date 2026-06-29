import { fmtD } from "../utils";
import { renderStatusBadge } from "./StatusBadge";

const statusColors = {
    ok: { bg: "#f0fdf4", border: "#86efac" },
    shortage: { bg: "#fffbeb", border: "#fcd34d" },
    neg: { bg: "#fff1f2", border: "#fca5a5" },
    skip: { bg: "#f8fafc", border: "#e2e8f0" },
};

export function ShipCard({ item }) {
    const { bg, border } = statusColors[item._status] || statusColors.skip;

    return (
        <div style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: "10px", padding: "0.875rem",
            marginBottom: "0.625rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>📅 {item.납기일자 || "-"}</span>
                {renderStatusBadge(item._status)}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.375rem" }}>
                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1e3a5f" }}>{item.거래처명}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem", whiteSpace: "nowrap" }}>{item.담당자}</span>
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>{item.품목명}</div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>{item.품목번호}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.375rem", background: "rgba(255,255,255,0.7)", borderRadius: "6px", padding: "0.5rem" }}>
                <GridCell label="수량" value={item.수량} />
                <GridCell label="현재고" value={item._currentInvQty ?? "-"} />
                <GridCell label="생산예정" value={item._incomingProd > 0 ? `+${item._incomingProd}` : "-"}
                    labelColor="#2563eb" valueColor={item._incomingProd > 0 ? "#2563eb" : "#94a3b8"}
                    sub={item._incomingProd > 0 && item._prodDates?.length > 0 ? item._prodDates.map(d => fmtD(d)).join(", ") : null}
                    late={item._projectedInvQty < 0 && item._incomingProdLate > 0 ? `⏰+${item._incomingProdLate}` : null} />
                <GridCell label="KCE입고" value={item._kceIncoming > 0 ? `+${item._kceIncoming}` : "-"}
                    labelColor="#1e40af" valueColor={item._kceIncoming > 0 ? "#1e40af" : "#94a3b8"}
                    sub={item._kceIncoming > 0 && item._kceDates?.length > 0 ? item._kceDates.map(d => fmtD(d)).join(", ") : null}
                    late={item._projectedInvQty < 0 && item._kceIncomingLate > 0 ? `⏰+${item._kceIncomingLate}` : null} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.75rem" }}>
                    <span style={{ color: "#94a3b8" }}>예상재고 </span>
                    <span style={{ fontWeight: "700", color: item._projectedInvQty < 0 ? "#ef4444" : "#334155" }}>
                        {item._projectedInvQty ?? "-"}
                    </span>
                </div>
                {item._note && <span style={{ fontSize: "0.7rem", color: item._noteType === "dup" ? "#dc2626" : "#d97706", fontWeight: "700" }}>{item._note}</span>}
            </div>
        </div>
    );
}

function GridCell({ label, value, labelColor = "#94a3b8", valueColor = "#1e3a5f", sub, late }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: labelColor, marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: valueColor }}>{value}</div>
            {sub && <div style={{ fontSize: "0.6rem", color: "#60a5fa" }}>{sub}</div>}
            {late && <div style={{ fontSize: "0.6rem", color: "#ea580c", fontWeight: "600" }}>{late}</div>}
        </div>
    );
}
