// server.js - 출하 일정관리 백엔드 (MongoDB 컬렉션 분리 버전)
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
// 접속 비밀번호 (운영에서는 반드시 환경변수 APP_PASSWORD 로 설정)
const APP_PASSWORD = process.env.APP_PASSWORD || "pyo-webgate";
const AUTH_TOKEN = crypto.createHash("sha256").update(APP_PASSWORD).digest("hex");

let db;

// MongoDB 연결 (자동 재연결 포함)
async function connectDB() {
    const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
    });
    client.on("close", () => console.warn("⚠️ MongoDB 연결 끊김 — 자동 재연결 시도 중..."));
    client.on("reconnected", () => console.log("✅ MongoDB 재연결 성공"));
    await client.connect();
    db = client.db("pyo-webgate");
    console.log("✅ MongoDB 연결 성공");
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
if (fs.existsSync(BUILD_DIR)) app.use(express.static(BUILD_DIR));

// ── 인증 ───────────────────────────────────────
// 로그인: 비밀번호 확인 후 토큰 발급 (공개)
app.post("/api/login", (req, res) => {
    const input = Buffer.from(String((req.body && req.body.password) || ""));
    const expected = Buffer.from(APP_PASSWORD);
    const ok = input.length === expected.length && crypto.timingSafeEqual(input, expected);
    if (!ok) return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
    res.json({ token: AUTH_TOKEN });
});

// 그 외 모든 /api 요청은 유효한 토큰 필요
app.use("/api", (req, res, next) => {
    if (req.path === "/login") return next();
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== AUTH_TOKEN) return res.status(401).json({ error: "인증이 필요합니다." });
    next();
});

// ── API ───────────────────────────────────────

// 전체 데이터 조회
app.get("/api/data", async (req, res) => {
    try {
        const [shipData, prodData, invData, kceData, memosDocs, metaDocs] = await Promise.all([
            db.collection("shipData").find().toArray(),
            db.collection("prodData").find().toArray(),
            db.collection("invData").find().toArray(),
            db.collection("kceData").find().toArray(),
            db.collection("memos").find().toArray(),
            db.collection("meta").find().toArray(),
        ]);

        // memos: [{key, value}] → {key: value} 형태로 변환
        const memos = {};
        memosDocs.forEach(m => { memos[m.key] = m.value; });

        // meta에서 파일명 가져오기
        const meta = {};
        metaDocs.forEach(m => { meta[m._id] = m.value; });

        res.json({
            shipData: shipData.map(({ _id, ...rest }) => rest),
            prodData: prodData.map(({ _id, ...rest }) => rest),
            invData: invData.map(({ _id, ...rest }) => rest),
            kceData: kceData.map(({ _id, ...rest }) => rest),
            memos,
            prodFile: meta.prodFile || "",
            invFile: meta.invFile || "",
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 출하의뢰 저장 (전체 교체)
app.post("/api/ship", async (req, res) => {
    try {
        const { shipData } = req.body;
        if (!Array.isArray(shipData)) return res.status(400).json({ error: "배열 필요" });
        await db.collection("shipData").deleteMany({});
        if (shipData.length > 0) await db.collection("shipData").insertMany(shipData);
        res.json({ ok: true, count: shipData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 재고현황 저장 (전체 교체)
app.post("/api/inv", async (req, res) => {
    try {
        const { invData, fileName } = req.body;
        if (!Array.isArray(invData)) return res.status(400).json({ error: "배열 필요" });
        await db.collection("invData").deleteMany({});
        if (invData.length > 0) await db.collection("invData").insertMany(invData);
        await db.collection("meta").updateOne(
            { _id: "invFile" }, { $set: { value: fileName || "" } }, { upsert: true }
        );
        res.json({ ok: true, count: invData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 생산계획 저장 (전체 교체)
app.post("/api/prod", async (req, res) => {
    try {
        const { prodData, fileName } = req.body;
        if (!Array.isArray(prodData)) return res.status(400).json({ error: "배열 필요" });
        await db.collection("prodData").deleteMany({});
        if (prodData.length > 0) await db.collection("prodData").insertMany(prodData);
        await db.collection("meta").updateOne(
            { _id: "prodFile" }, { $set: { value: fileName || "" } }, { upsert: true }
        );
        res.json({ ok: true, count: prodData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// KCE 입고일정 저장 (전체 교체)
app.post("/api/kce", async (req, res) => {
    try {
        const { kceData } = req.body;
        if (!Array.isArray(kceData)) return res.status(400).json({ error: "배열 필요" });
        await db.collection("kceData").deleteMany({});
        if (kceData.length > 0) await db.collection("kceData").insertMany(kceData);
        res.json({ ok: true, count: kceData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 메모 단건 저장/삭제
app.patch("/api/memos", async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: "key 필요" });
        if (value === "" || value == null) {
            await db.collection("memos").deleteOne({ key });
        } else {
            await db.collection("memos").updateOne(
                { key }, { $set: { key, value } }, { upsert: true }
            );
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 전체 초기화
app.delete("/api/data", async (req, res) => {
    try {
        await Promise.all([
            db.collection("shipData").deleteMany({}),
            db.collection("prodData").deleteMany({}),
            db.collection("invData").deleteMany({}),
            db.collection("kceData").deleteMany({}),
            db.collection("memos").deleteMany({}),
            db.collection("meta").deleteMany({}),
        ]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
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