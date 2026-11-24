/* global require, module */
const express = require("express");
const { ObjectId } = require("mongodb");

const fieldLimits = {
    name: 200,
    address: 500,
    contactName: 100,
    contact: 100,
    phone: 100,
    email: 254,
    notes: 2000,
};

function readCustomer(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;

    const customer = {};
    for (const [field, limit] of Object.entries(fieldLimits)) {
        const value = Object.hasOwn(body, field) ? body[field] : "";
        if (typeof value !== "string" || value.trim().length > limit) return null;
        customer[field] = value.trim();
    }
    return customer.name ? customer : null;
}

function createCustomerRouter(getCollection) {
    const router = express.Router();
    const handle = (handler) => async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            console.error("거래처 주소록 API 오류:", error);
            res.status(500).json({ error: "거래처 데이터를 처리할 수 없습니다." });
        }
    };

    router.get("/", handle(async (req, res) => {
        const customers = await getCollection().find().sort({ name: 1, _id: 1 }).toArray();
        res.json(customers);
    }));

    router.get("/suggestions", handle(async (req, res) => {
        const query = req.query.q;
        if (typeof query !== "string" || query.trim().length > fieldLimits.name) {
            return res.status(400).json({ error: "거래처명 검색어를 확인해 주세요." });
        }

        const name = query.trim();
        if (!name) return res.json([]);
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = await getCollection().aggregate([
            { $match: { name: { $regex: escaped, $options: "i" } } },
            { $group: { _id: "$name" } },
            { $sort: { _id: 1 } },
            { $limit: 10 },
        ]).toArray();
        res.json(matches.map(match => match._id));
    }));

    router.param("id", (req, res, next, id) => {
        if (!/^[0-9a-f]{24}$/i.test(id)) {
            return res.status(400).json({ error: "거래처 ID를 확인해 주세요." });
        }
        req.customerId = new ObjectId(id);
        next();
    });

    router.post("/", handle(async (req, res) => {
        const customer = readCustomer(req.body);
        if (!customer) return res.status(400).json({ error: "거래처명과 입력값을 확인해 주세요." });

        const now = new Date();
        const document = { ...customer, createdAt: now, updatedAt: now };
        const { insertedId } = await getCollection().insertOne(document);
        res.status(201).json({ ...document, _id: insertedId });
    }));

    router.put("/:id", handle(async (req, res) => {
        const customer = readCustomer(req.body);
        if (!customer) return res.status(400).json({ error: "거래처명과 입력값을 확인해 주세요." });

        const updated = await getCollection().findOneAndUpdate(
            { _id: req.customerId },
            { $set: { ...customer, updatedAt: new Date() } },
            { returnDocument: "after" },
        );
        if (!updated) return res.status(404).json({ error: "거래처를 찾을 수 없습니다." });
        res.json(updated);
    }));

    router.delete("/:id", handle(async (req, res) => {
        const { deletedCount } = await getCollection().deleteOne({ _id: req.customerId });
        if (!deletedCount) return res.status(404).json({ error: "거래처를 찾을 수 없습니다." });
        res.json({ ok: true });
    }));

    return router;
}

module.exports = { createCustomerRouter };
