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
        INSERT INTO assessment_events (
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

    const [[attempt]] =
        await db.query(
            `
            SELECT
                config
            FROM assessment_attempts
            WHERE id = ?
            `,
            [attempt_id]
        );

    if (attempt) {

        const config =
            JSON.parse(
                attempt.config || "{}"
            );

        const eventLockMap = {

            tab_hidden:
                "lock_tab_hidden",

            window_blur:
                "lock_window_blur",

            context_menu:
                "lock_context_menu",

            page_unload:
                "lock_page_unload",

            page_refresh:
                "lock_page_refresh"

        };

        const configKey =
            eventLockMap[event_type];
        
        const shouldLock =
            configKey &&
            config.monitoring?.[configKey];

        console.log(
            "SHOULD LOCK",
            shouldLock
        );

        if (shouldLock) {

            await db.query(
                `
                UPDATE assessment_attempts
                SET status = 'locked'
                WHERE id = ?
                `,
                [attempt_id]
            );

            await db.query(
                `
                INSERT INTO assessment_events (
                    attempt_id,
                    event_type,
                    event_data
                )
                VALUES (?, ?, ?)
                `,
                [
                    attempt_id,
                    "attempt_locked",
                    JSON.stringify({
                        reason: event_type
                    })
                ]
            );

        }

    }

    res.json({
        success: true
    });

});


// GET /api/events/attempt/:attemptId/lock-reason
router.get("/attempt/:attemptId/lock-reason",
    async (req, res) => {

        const [[event]] =
            await db.query(
                `
                SELECT event_data
                FROM assessment_events
                WHERE
                    attempt_id = ?
                    AND event_type = 'attempt_locked'
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [req.params.attemptId]
            );

        if (!event) {

            return res.json({
                reason: null
            });

        }

        const data =
            JSON.parse(
                event.event_data || "{}"
            );

        res.json({
            reason: data.reason
        });

    }
);


// GET /api/events/:id
// DELETE /api/events/:id

export default router;
