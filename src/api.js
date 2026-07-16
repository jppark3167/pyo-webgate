// api.js - 서버 API 통신 레이어
const BASE = import.meta.env.DEV ? "http://localhost:3001" : "";
const TOKEN_KEY = "wg_token";

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req(method, path, body) {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body != null ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
        clearToken();
        throw new Error("UNAUTHORIZED");
    }
    if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
    return res.json();
}

export const api = {
    isLoggedIn: () => !!getToken(),
    login: async (password) => {
        const { token } = await req("POST", "/api/login", { password });
        setToken(token);
        return token;
    },
    logout: () => clearToken(),
    // 관리자 페이지 2차 비밀번호 확인 — req()의 401 처리(메인 로그인 토큰 삭제)와 별개로 동작해야 하므로 직접 fetch
    verifyAdmin: async (password) => {
        const token = getToken();
        let res;
        try {
            res = await fetch(`${BASE}/api/admin/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ password }),
            });
        } catch {
            throw new Error("서버에 연결할 수 없습니다.");
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "비밀번호가 올바르지 않습니다.");
        return data;
    },
    getData: () => req("GET", "/api/data"),
    saveShip: (shipData) => req("POST", "/api/ship", { shipData }),
    saveProd: (prodData, fileName) => req("POST", "/api/prod", { prodData, fileName }),
    saveInv: (invData, fileName) => req("POST", "/api/inv", { invData, fileName }),
    saveKce: (kceData) => req("POST", "/api/kce", { kceData }),
    syncKce: (sheetUrl) => req("POST", "/api/kce/sync", sheetUrl ? { sheetUrl } : {}),
    syncShip: (sheetUrl) => req("POST", "/api/ship/sync", sheetUrl ? { sheetUrl } : {}),
    saveMemo: (key, value) => req("PATCH", "/api/memos", { key, value }),
    saveQuick: (key, value) => req("PATCH", "/api/quick", { key, value }),
    resetAll: () => req("DELETE", "/api/data"),
};
