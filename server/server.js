// server.js - 출하 일정관리 백엔드 (MongoDB 버전)
const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

let db;

// MongoDB 연결
async function connectDB() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("pyo-webgate");
    console.log("✅ MongoDB 연결 성공");
}

const DEFAULT_DB = {
    prodData: [], invData: [], shipData: [], kceData: [],
    memos: {}, prodFile: "", invFile: "", updatedAt: null
};

async function readDB() {
    const doc = await db.collection("appdata").findOne({ _id: "main" });
    return doc ? { ...DEFAULT_DB, ...doc } : { ...DEFAULT_DB };
}

async function writeDB(data) {
    data.updatedAt = new Date().toISOString();
    await db.collection("appdata").updateOne(
        { _id: "main" },
        { $set: data },
        { upsert: true }
    );
}

// CORS 설정
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3001",
    "https://parkjunpyo.store",
    "https://www.parkjunpyo.store",
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));

app.use(express.json({ limit: "50mb" }));

// React 빌드 정적 파일
const BUILD_DIR = path.join(__dirname, "../dist");
const fs = require("fs");
if (fs.existsSync(BUILD_DIR)) app.use(express.static(BUILD_DIR));

// ── API ───────────────────────────────────────

app.get("/api/data", async (req, res) => {
    try { res.json(await readDB()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/ship", async (req, res) => {
    try {
        const { shipData } = req.body;
        if (!Array.isArray(shipData)) return res.status(400).json({ error: "배열 필요" });
        const db2 = await readDB(); db2.shipData = shipData; await writeDB(db2);
        res.json({ ok: true, count: shipData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/inv", async (req, res) => {
    try {
        const { invData, fileName } = req.body;
        if (!Array.isArray(invData)) return res.status(400).json({ error: "배열 필요" });
        const db2 = await readDB(); db2.invData = invData; db2.invFile = fileName || ""; await writeDB(db2);
        res.json({ ok: true, count: invData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/prod", async (req, res) => {
    try {
        const { prodData, fileName } = req.body;
        if (!Array.isArray(prodData)) return res.status(400).json({ error: "배열 필요" });
        const db2 = await readDB(); db2.prodData = prodData; db2.prodFile = fileName || ""; await writeDB(db2);
        res.json({ ok: true, count: prodData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/kce", async (req, res) => {
    try {
        const { kceData } = req.body;
        if (!Array.isArray(kceData)) return res.status(400).json({ error: "배열 필요" });
        const db2 = await readDB(); db2.kceData = kceData; await writeDB(db2);
        res.json({ ok: true, count: kceData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/memos", async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: "key 필요" });
        const db2 = await readDB();
        if (!db2.memos) db2.memos = {};
        if (value === "" || value == null) delete db2.memos[key];
        else db2.memos[key] = value;
        await writeDB(db2);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/data", async (req, res) => {
    try { await writeDB({ ...DEFAULT_DB }); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback
if (fs.existsSync(BUILD_DIR)) {
    app.get("*", (req, res) => res.sendFile(path.join(BUILD_DIR, "index.html")));
}

// 서버 시작
connectDB().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
});