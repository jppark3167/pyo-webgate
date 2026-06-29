// api.js - 서버 API 통신 레이어
const BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

async function req(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
    return res.json();
}

export const api = {
    getData: () => req("GET", "/api/data"),
    saveShip: (shipData) => req("POST", "/api/ship", { shipData }),
    saveProd: (prodData, fileName) => req("POST", "/api/prod", { prodData, fileName }),
    saveInv: (invData, fileName) => req("POST", "/api/inv", { invData, fileName }),
    saveKce: (kceData) => req("POST", "/api/kce", { kceData }),
    saveMemo: (key, value) => req("PATCH", "/api/memos", { key, value }),
    resetAll: () => req("DELETE", "/api/data"),
};