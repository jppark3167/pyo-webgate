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
    getData: () => req("GET", "/api/data"),
    saveShip: (shipData) => req("POST", "/api/ship", { shipData }),
    saveProd: (prodData, fileName) => req("POST", "/api/prod", { prodData, fileName }),
    saveInv: (invData, fileName) => req("POST", "/api/inv", { invData, fileName }),
    saveKce: (kceData) => req("POST", "/api/kce", { kceData }),
    saveMemo: (key, value) => req("PATCH", "/api/memos", { key, value }),
    resetAll: () => req("DELETE", "/api/data"),
};
