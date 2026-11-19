import { useState } from "react";
import { read, utils } from "xlsx/xlsx.mjs";
import templateUrl from "../../assets/kyungdong-address-book.xlsx?url";
import { createKyungdongAddressBook, MAX_SHIPMENTS } from "../../kyungdongAddressBook";
import { toDateStr } from "../../utils";
import { btn, inputStyle } from "./styles";

const input = { ...inputStyle, fontSize: "0.9rem", padding: "9px 10px", width: "100%" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 205px), 1fr))", gap: 12 };
const labelStyle = { display: "grid", gap: 5, fontSize: "0.82rem", fontWeight: 600, color: "#334155" };
const panel = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 12 };
const fields = [
    { name: "recipient", label: "받는분" },
    { name: "phone", label: "전화번호", type: "tel" },
    { name: "quantity", label: "수량", type: "number" },
];

function ShipmentInput({ label, value, onChange, type = "text", required = true, disabled = false }) {
    return (
        <label style={labelStyle}>
            {label}
            <input style={disabled ? { ...input, background: "#f1f5f9" } : input} type={type} disabled={disabled}
                required={required && !disabled} value={value ?? ""} onChange={event => onChange(event.target.value)}
                min={type === "number" ? 1 : undefined} step={type === "number" ? 1 : undefined} />
        </label>
    );
}

export function KyungdongAddressBook({ rows, setRows }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);
    const currentPreview = preview?.source === rows ? preview : null;

    function update(id, name, value) {
        setError("");
        setRows(current => current.map(row => row.id === id ? { ...row, [name]: value } : row));
    }

    async function download(event) {
        event.preventDefault();
        const showPreview = event.nativeEvent.submitter?.value === "preview";
        setBusy(true);
        setError("");
        try {
            const date = toDateStr(new Date());
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error("엑셀 양식을 불러올 수 없습니다.");
            const bytes = createKyungdongAddressBook(new Uint8Array(await response.arrayBuffer()), rows, date);
            if (showPreview) {
                const workbook = read(bytes, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const cells = utils.sheet_to_json(sheet, { header: 1, range: "A1:P11", defval: "", raw: false });
                setPreview({ source: rows, date, cells });
                return;
            }
            const url = URL.createObjectURL(new Blob([bytes], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }));
            const link = document.createElement("a");
            link.href = url;
            link.download = `경동화물 발송 주소록 ${date}.xlsx`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "엑셀 파일 생성에 실패했습니다.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={download} style={{ maxWidth: 1000 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "#1e293b" }}>경동화물 발송 주소록</h2>
            <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "0.85rem" }}>
                발송 건을 작성한 뒤 기존 경동화물 양식으로 다운로드합니다.
            </p>
            {rows.map((row, index) => (
                <section key={row.id} style={panel} aria-label={`발송 ${index + 1}건`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <strong style={{ color: "#1e293b" }}>발송 {index + 1}</strong>
                        {rows.length > 1 && (
                            <button type="button" style={btn("#fef2f2", "#991b1b")} disabled={busy}
                                aria-label={`발송 ${index + 1} 삭제`}
                                onClick={() => { setRows(current => current.filter(item => item.id !== row.id)); setError(""); }}>
                                삭제
                            </button>
                        )}
                    </div>
                    <div style={grid}>
                        <label style={labelStyle}>
                            배송구분
                            <select required style={input} value={row.method ?? ""} onChange={event => update(row.id, "method", event.target.value)}>
                                <option value="">선택</option>
                                <option value="택배">택배</option>
                                <option value="화물">화물</option>
                            </select>
                        </label>
                        <ShipmentInput label={row.method === "화물" ? "배송영업소" : "도착영업소"}
                            disabled={row.method !== "화물"} value={row.method === "화물" ? row.branch : ""}
                            onChange={value => update(row.id, "branch", value)} />
                        {fields.map(({ name, label, type }) => (
                            <ShipmentInput key={name} label={label} type={type} value={row[name]} onChange={value => update(row.id, name, value)} />
                        ))}
                        <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                            품목명
                            <textarea style={{ ...input, resize: "vertical" }} rows={3} required
                                placeholder="품목이 여러 개면 한 줄에 하나씩 입력하세요."
                                value={row.item ?? ""} onChange={event => update(row.id, "item", event.target.value)} />
                        </label>
                        {row.method === "택배" && (
                            <>
                                <ShipmentInput label="주소" value={row.address} onChange={value => update(row.id, "address", value)} />
                                <ShipmentInput label="상세주소 (선택)" required={false} value={row.addressDetail}
                                    onChange={value => update(row.id, "addressDetail", value)} />
                            </>
                        )}
                    </div>
                </section>
            ))}
            {error && <p role="alert" style={{ color: "#991b1b", fontSize: "0.85rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" style={btn("#e2e8f0", "#1e293b")} disabled={busy || rows.length >= MAX_SHIPMENTS}
                    onClick={() => setRows(current => [...current, { id: Math.max(...current.map(row => row.id)) + 1 }])}>
                    발송 건 추가
                </button>
                <button type="submit" style={btn("#0f766e", "#fff")} disabled={busy}>
                    {busy ? "엑셀 생성 중…" : "엑셀 다운로드"}
                </button>
                <button type="submit" name="action" value="preview" style={btn("#e0f2fe", "#075985")} disabled={busy}>
                    출력 시트 미리보기
                </button>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{rows.length} / {MAX_SHIPMENTS}건</span>
            </div>
            {currentPreview && (
                <section style={{ ...panel, marginTop: 20 }} aria-label="출력 시트 미리보기">
                    <h3 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#1e293b" }}>
                        출력 시트 미리보기 · {currentPreview.date}
                    </h3>
                    <div tabIndex={0} role="region" aria-label="발송 주소록 출력 표" style={{ overflowX: "auto" }}>
                        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1600, fontSize: "0.78rem" }}>
                            <thead>
                                <tr>
                                    {currentPreview.cells[0].map((value, index) => (
                                        <th key={index} scope="col" style={{ border: "1px solid #cbd5e1", padding: 8, background: "#e2e8f0", whiteSpace: "pre-wrap" }}>
                                            {value}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentPreview.cells.slice(1).map((cells, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {cells.map((value, columnIndex) => (
                                            <td key={columnIndex} style={{ border: "1px solid #cbd5e1", padding: 8, whiteSpace: "pre-wrap", overflowWrap: "anywhere", verticalAlign: "top", background: rowIndex % 2 ? "#f8fafc" : "#fff" }}>
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </form>
    );
}
