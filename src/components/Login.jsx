import { useState } from "react";
import { api } from "../api";

export function Login({ onSuccess }) {
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!pw.trim() || busy) return;
        setBusy(true); setErr("");
        try {
            await api.login(pw);
            onSuccess();
        } catch (e2) {
            setErr(e2.message === "UNAUTHORIZED" ? "비밀번호가 올바르지 않습니다." : "서버에 연결할 수 없습니다.");
            setBusy(false);
        }
    };

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Pretendard','Malgun Gothic',sans-serif", padding: "1rem" }}>
            <form onSubmit={submit} style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: "2rem", width: "100%", maxWidth: "360px", boxSizing: "border-box" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏭</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#1e3a5f" }}>출하 일정관리</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>비밀번호를 입력하세요</div>
                </div>
                <input
                    type="password"
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); setErr(""); }}
                    placeholder="비밀번호"
                    autoFocus
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9375rem", boxSizing: "border-box", outline: "none" }}
                />
                {err && <p style={{ color: "#dc2626", fontSize: "0.8125rem", margin: "0.5rem 0 0", fontWeight: 600 }}>{err}</p>}
                <button
                    type="submit"
                    disabled={busy}
                    style={{ width: "100%", marginTop: "1rem", padding: "0.75rem", background: busy ? "#94a3b8" : "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9375rem", fontWeight: 600, cursor: busy ? "default" : "pointer" }}
                >
                    {busy ? "확인 중..." : "들어가기"}
                </button>
            </form>
        </div>
    );
}
