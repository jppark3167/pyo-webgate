// server.js - 출하 일정관리 백엔드
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_DB = {
    prodData: [], invData: [], shipData: [], kceData: [],
    memos: {}, prodFile: "", invFile: "", updatedAt: null
};

function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) return { ...DEFAULT_DB };
        return { ...DEFAULT_DB, ...JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) };
    } catch { return { ...DEFAULT_DB }; }
}

function writeDB(data) {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// React 빌드 정적 파일
const BUILD_DIR = path.join(__dirname, "../dist");
if (fs.existsSync(BUILD_DIR)) app.use(express.static(BUILD_DIR));

// ── API ───────────────────────────────────────

// 전체 데이터 조회
app.get("/api/data", (req, res) => res.json(readDB()));

// 출하의뢰 저장
app.post("/api/ship", (req, res) => {
    const { shipData } = req.body;
    if (!Array.isArray(shipData)) return res.status(400).json({ error: "배열 필요" });
    const db = readDB(); db.shipData = shipData; writeDB(db);
    res.json({ ok: true, count: shipData.length });
});

// 재고현황 저장
app.post("/api/inv", (req, res) => {
    const { invData, fileName } = req.body;
    if (!Array.isArray(invData)) return res.status(400).json({ error: "배열 필요" });
    const db = readDB(); db.invData = invData; db.invFile = fileName || ""; writeDB(db);
    res.json({ ok: true, count: invData.length });
});

// 생산계획 저장
app.post("/api/prod", (req, res) => {
    const { prodData, fileName } = req.body;
    if (!Array.isArray(prodData)) return res.status(400).json({ error: "배열 필요" });
    const db = readDB(); db.prodData = prodData; db.prodFile = fileName || ""; writeDB(db);
    res.json({ ok: true, count: prodData.length });
});

// KCE 입고일정 저장
app.post("/api/kce", (req, res) => {
    const { kceData } = req.body;
    if (!Array.isArray(kceData)) return res.status(400).json({ error: "배열 필요" });
    const db = readDB(); db.kceData = kceData; writeDB(db);
    res.json({ ok: true, count: kceData.length });
});

// 메모 단건 저장/삭제
app.patch("/api/memos", (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "key 필요" });
    const db = readDB();
    if (!db.memos) db.memos = {};
    if (value === "" || value == null) delete db.memos[key];
    else db.memos[key] = value;
    writeDB(db);
    res.json({ ok: true });
});

// 전체 초기화
app.delete("/api/data", (req, res) => {
    writeDB({ ...DEFAULT_DB }); res.json({ ok: true });
});

// SPA fallback
if (fs.existsSync(BUILD_DIR)) {
    app.get("*", (req, res) => res.sendFile(path.join(BUILD_DIR, "index.html")));
}

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📁 데이터 저장: ${DB_FILE}`);
});