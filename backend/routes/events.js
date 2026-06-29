import express from "express";

const router = express.Router();

router.post("/events", (req, res) => {
    console.log("📡 EVENT:", req.body);
    res.json({ ok: true });
});

export default router;
