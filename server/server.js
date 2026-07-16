// server.js - 출하 일정관리 백엔드 (MongoDB 컬렉션 분리 버전)
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");
const { fetchAndParseKceSheet } = require("./kceSync");
const { fetchAndParseShipSheet } = require("./shipSync");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
// 접속 비밀번호 (운영에서는 반드시 환경변수 APP_PASSWORD 로 설정)
const APP_PASSWORD = process.env.APP_PASSWORD || "pyo-webgate";
const AUTH_TOKEN = crypto.createHash("sha256").update(APP_PASSWORD).digest("hex");
// 관리자 페이지(업로드 설정) 전용 별도 비밀번호 (운영에서는 반드시 환경변수 ADMIN_PASSWORD 로 설정)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

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

// 관리자 페이지(업로드 설정) 진입용 비밀번호 확인 — 로그인과 별개의 2차 확인
app.post("/api/admin/verify", (req, res) => {
    const input = Buffer.from(String((req.body && req.body.password) || ""));
    const expected = Buffer.from(ADMIN_PASSWORD);
    const ok = input.length === expected.length && crypto.timingSafeEqual(input, expected);
    if (!ok) return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
    res.json({ ok: true });
});

// 전체 데이터 조회
app.get("/api/data", async (req, res) => {
    try {
        const [shipData, prodData, invData, kceData, memosDocs, quickDocs, metaDocs] = await Promise.all([
            db.collection("shipData").find().toArray(),
            db.collection("prodData").find().toArray(),
            db.collection("invData").find().toArray(),
            db.collection("kceData").find().toArray(),
            db.collection("memos").find().toArray(),
            db.collection("quickData").find().toArray(),
            db.collection("meta").find().toArray(),
        ]);

        // memos: [{key, value}] → {key: value} 형태로 변환
        const memos = {};
        memosDocs.forEach(m => { memos[m.key] = m.value; });

        // quickData: [{key, value}] → {key: value} (value = {address, boxCount, ...스냅샷})
        const quick = {};
        quickDocs.forEach(q => { quick[q.key] = q.value; });

        // meta에서 파일명 가져오기
        const meta = {};
        metaDocs.forEach(m => { meta[m._id] = m.value; });

        res.json({
            shipData: shipData.map(({ _id, ...rest }) => rest),
            prodData: prodData.map(({ _id, ...rest }) => rest),
            invData: invData.map(({ _id, ...rest }) => rest),
            kceData: kceData.map(({ _id, ...rest }) => rest),
            memos,
            quick,
            prodFile: meta.prodFile || "",
            invFile: meta.invFile || "",
            kceSheetUrl: meta.kceSheetUrl || "",
            kceLastSync: meta.kceLastSync || "",
            shipSheetUrl: meta.shipSheetUrl || "",
            shipLastSync: meta.shipLastSync || "",
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
        // 출하의뢰가 새로 교체되면 기존 퀵 지정도 함께 초기화
        await db.collection("quickData").deleteMany({});
        res.json({ ok: true, count: shipData.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 출하의뢰 — 구글 시트(뷰어 공개) 즉시 동기화. sheetUrl 생략 시 마지막으로 저장된 URL 사용
app.post("/api/ship/sync", async (req, res) => {
    try {
        const bodyUrl = (req.body && req.body.sheetUrl || "").trim();
        const saved = await db.collection("meta").findOne({ _id: "shipSheetUrl" });
        const sheetUrl = bodyUrl || (saved && saved.value) || "";
        if (!sheetUrl) return res.status(400).json({ error: "구글 시트 URL이 설정되어 있지 않습니다." });

        const parsed = await fetchAndParseShipSheet(sheetUrl);
        await db.collection("shipData").deleteMany({});
        if (parsed.length > 0) await db.collection("shipData").insertMany(parsed);
        // 출하의뢰가 새로 교체되면 기존 퀵 지정도 함께 초기화
        await db.collection("quickData").deleteMany({});

        const syncedAt = new Date().toISOString();
        await db.collection("meta").updateOne({ _id: "shipSheetUrl" }, { $set: { value: sheetUrl } }, { upsert: true });
        await db.collection("meta").updateOne({ _id: "shipLastSync" }, { $set: { value: syncedAt } }, { upsert: true });

        res.json({ ok: true, count: parsed.length, syncedAt, shipData: parsed });
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

// KCE 입고일정 — 구글 시트(뷰어 공개) 즉시 동기화. sheetUrl 생략 시 마지막으로 저장된 URL 사용
app.post("/api/kce/sync", async (req, res) => {
    try {
        const bodyUrl = (req.body && req.body.sheetUrl || "").trim();
        const saved = await db.collection("meta").findOne({ _id: "kceSheetUrl" });
        const sheetUrl = bodyUrl || (saved && saved.value) || "";
        if (!sheetUrl) return res.status(400).json({ error: "구글 시트 URL이 설정되어 있지 않습니다." });

        const parsed = await fetchAndParseKceSheet(sheetUrl);
        await db.collection("kceData").deleteMany({});
        if (parsed.length > 0) await db.collection("kceData").insertMany(parsed);

        const syncedAt = new Date().toISOString();
        await db.collection("meta").updateOne({ _id: "kceSheetUrl" }, { $set: { value: sheetUrl } }, { upsert: true });
        await db.collection("meta").updateOne({ _id: "kceLastSync" }, { $set: { value: syncedAt } }, { upsert: true });

        res.json({ ok: true, count: parsed.length, syncedAt, kceData: parsed });
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

// 퀵 배송정보 단건 저장/삭제 (value = {address, boxCount, ...스냅샷})
app.patch("/api/quick", async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: "key 필요" });
        if (value == null) {
            await db.collection("quickData").deleteOne({ key });
        } else {
            await db.collection("quickData").updateOne(
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
            db.collection("quickData").deleteMany({}),
            db.collection("meta").deleteMany({}),
        ]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback
if (fs.existsSync(BUILD_DIR)) {
    app.get("*", (req, res) => res.sendFile(path.join(BUILD_DIR, "index.html")));
}

// KCE 입고일정 자동 동기화 — 저장된 구글 시트 URL이 있을 때만 수행, 실패해도 서버는 계속 동작
const KCE_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1시간
async function runAutoKceSync() {
    try {
        const saved = await db.collection("meta").findOne({ _id: "kceSheetUrl" });
        const sheetUrl = saved && saved.value;
        if (!sheetUrl) return;
        const parsed = await fetchAndParseKceSheet(sheetUrl);
        await db.collection("kceData").deleteMany({});
        if (parsed.length > 0) await db.collection("kceData").insertMany(parsed);
        await db.collection("meta").updateOne({ _id: "kceLastSync" }, { $set: { value: new Date().toISOString() } }, { upsert: true });
        console.log(`✅ KCE 자동 동기화 완료 (${parsed.length}건)`);
    } catch (e) {
        console.error("⚠️ KCE 자동 동기화 실패:", e.message);
    }
}

// 출하의뢰 자동 동기화 — 저장된 구글 시트 URL이 있을 때만 수행, 실패해도 서버는 계속 동작
const SHIP_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1시간
async function runAutoShipSync() {
    try {
        const saved = await db.collection("meta").findOne({ _id: "shipSheetUrl" });
        const sheetUrl = saved && saved.value;
        if (!sheetUrl) return;
        const parsed = await fetchAndParseShipSheet(sheetUrl);
        await db.collection("shipData").deleteMany({});
        if (parsed.length > 0) await db.collection("shipData").insertMany(parsed);
        await db.collection("meta").updateOne({ _id: "shipLastSync" }, { $set: { value: new Date().toISOString() } }, { upsert: true });
        console.log(`✅ 출하의뢰 자동 동기화 완료 (${parsed.length}건)`);
    } catch (e) {
        console.error("⚠️ 출하의뢰 자동 동기화 실패:", e.message);
    }
}

// 서버 시작
connectDB().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    });
    runAutoKceSync();
    setInterval(runAutoKceSync, KCE_SYNC_INTERVAL_MS);
    runAutoShipSync();
    setInterval(runAutoShipSync, SHIP_SYNC_INTERVAL_MS);
}).catch(err => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
});