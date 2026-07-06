import { useState } from "react";
import { api } from "../api";

// 관리자 페이지(업로드 설정) 진입 전 별도 비밀번호로 한 번 더 확인하는 잠금 모달
export function AdminGate({ onSuccess, onCancel }) {
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!pw.trim() || busy) return;
        setBusy(true); setErr("");
        try {
            await api.verifyAdmin(pw);
            onSuccess();
        } catch (e2) {
            setErr(e2.message || "비밀번호가 올바르지 않습니다.");
            setBusy(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
            <form onSubmit={submit} style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 8px 28px rgba(0,0,0,0.25)", padding: "1.75rem", width: "100%", maxWidth: "320px", boxSizing: "border-box" }}>
                <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: 30, marginBottom: 6 }}>🔐</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#1e3a5f" }}>관리자 페이지</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>비밀번호를 입력하세요</div>
                </div>
                <input
                    type="password"
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); setErr(""); }}
                    placeholder="관리자 비밀번호"
                    autoFocus
                    style={{ width: "100%", padding: "0.7rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }}
                />
                {err && <p style={{ color: "#dc2626", fontSize: "0.78rem", margin: "0.5rem 0 0", fontWeight: 600 }}>{err}</p>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ flex: 1, padding: "0.7rem", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        style={{ flex: 1, padding: "0.7rem", background: busy ? "#94a3b8" : "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: busy ? "default" : "pointer" }}
                    >
                        {busy ? "확인 중..." : "확인"}
                    </button>
                </div>
            </form>
        </div>
    );
}
