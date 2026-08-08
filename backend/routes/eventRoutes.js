import express from "express";
import db from "../db.js";

const router = express.Router();

/*
GET    /api/events
POST   /api/events

GET    /api/events/:id
DELETE /api/events/:id
*/

// GET /api/events

// POST /api/events
router.post("/", async (req, res) => {

    const {
        attempt_id,
        event_type,
        event_data
    } = req.body;

    await db.query(
        `
        INSERT INTO exam_events (
            attempt_id,
            event_type,
            event_data
        )
        VALUES (?, ?, ?)
        `,
        [
            attempt_id,
            event_type,
            JSON.stringify(
                event_data || {}
            )
        ]
    );

    res.json({
        success: true
    });

});

// GET /api/events/:id
// DELETE /api/events/:id

export default router;
