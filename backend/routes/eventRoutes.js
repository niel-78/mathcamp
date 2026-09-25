import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/session", requireAuth, async (req, res) => {
    const allowedEventTypes = new Set([
        "calendar_view",
        "assessment_view",
        "exam_started",
        "logged_out"
    ]);
    const { event_type: eventType, event_data: eventData } = req.body || {};

    if (!allowedEventTypes.has(eventType)) {
        return res.status(400).json({
            error: "Ogiltig sessionshändelse."
        });
    }

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const [[session]] = await db.query(
        `
        SELECT id
        FROM user_sessions
        WHERE session_token = ?
            AND user_id = ?
        ORDER BY logged_in_at DESC
        LIMIT 1
        `,
        [token, req.user.id]
    );

    if (!session) {
        return res.status(401).json({
            error: "Aktiv session hittades inte."
        });
    }

    await db.query(
        `
        INSERT INTO user_session_events (
            session_id,
            event_type,
            event_data
        )
        VALUES (?, ?, ?)
        `,
        [session.id, eventType, JSON.stringify(eventData || {})]
    );

    res.status(201).json({ success: true });
});

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
            typeof attempt.config === "string"
                ? JSON.parse(attempt.config || "{}")
                : attempt.config || {};

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

        // Kräv upprepade händelser innan låsning för att undvika att en enstaka
        // ofrivillig fönsterbytning/högerklick låser provet i onödan.
        const violationThresholds = {
            tab_hidden: 3,
            window_blur: 3,
            context_menu: 3,
            page_unload: 1,
            page_refresh: 1
        };

        const configKey =
            eventLockMap[event_type];

        const isMonitoredEvent =
            configKey &&
            config.monitoring?.[configKey];

        let shouldLock = false;

        if (isMonitoredEvent) {

            const [[{ occurrences }]] =
                await db.query(
                    `
                    SELECT COUNT(*) AS occurrences
                    FROM assessment_events
                    WHERE
                        attempt_id = ?
                        AND event_type = ?
                    `,
                    [attempt_id, event_type]
                );

            const threshold =
                violationThresholds[event_type] ?? 1;

            shouldLock = occurrences >= threshold;

        }

        if (shouldLock) {

            const [lockResult] = await db.query(
                `
                UPDATE assessment_attempts
                SET status = 'locked'
                WHERE id = ?
                    AND status = 'in_progress'
                `,
                [attempt_id]
            );

            if (lockResult.affectedRows > 0) {

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
            typeof event.event_data === "string"
                ? JSON.parse(event.event_data || "{}")
                : event.event_data || {};

        res.json({
            reason: data.reason
        });

    }
);


// GET /api/events/:id
// DELETE /api/events/:id

export default router;
