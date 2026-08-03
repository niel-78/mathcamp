import express from "express";

const router = express.Router();

/*
GET    /api/events
POST   /api/events

GET    /api/events/:id
DELETE /api/events/:id
*/

// GET /api/events

// POST /api/events
router.post("/", (req, res) => {
    console.log("📡 EVENT:", req.body);
    res.json({ ok: true });
});

// GET /api/events/:id
// DELETE /api/events/:id

export default router;
