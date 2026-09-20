import express from "express";
import db from "../db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import formatDateTime from "../utils/formatDateTime.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { buildExamSession } from "../utils/buildExamSession.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student", "teacher"));

/* 
POST /group-assessment-lobby/:id/join
GET /group-assessment-lobby/:id/status
POST /group-assessment-lobby/find
*/

// GET /api/group-assessments/:id/status
router.get("/:id/status", async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    status AS assessment_status,
                    waiting_room_open
                FROM group_assessments
                WHERE id = ?
                `,
                [req.params.id]
            );

        if (!rows.length) {

            return res
                .status(404)
                .json({
                    error:
                        "Provtillfället hittades inte."
                });

        }

        const [waitingRows] =
            await db.query(
                `
                SELECT admitted_at
                FROM assessment_waiting_room
                WHERE
                    group_assessment_id = ?
                    AND user_id = ?
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );

        const [[attempt]] =
            await db.query(
                `
                SELECT
                    id,
                    status
                FROM assessment_attempts
                WHERE
                    group_assessment_id = ?
                    AND user_id = ?
                LIMIT 1
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );

            res.json({

                assessment_status:
                    rows[0].assessment_status,

                waiting_room_open:
                    rows[0].waiting_room_open,

                admitted:
                    waitingRows.length > 0 &&
                    waitingRows[0].admitted_at !== null,

                attempt_id:
                    attempt?.id || null,

                attempt_status:
                    attempt?.status || null

            });
    }
);

// POST /api/group-assessments/join
router.post("/join", async (req, res) => {

    const { group_assessment_key } = req.body;

    const [[groupExam]] =
        await db.query(
            `
            SELECT
                id,
                group_id,
                status AS assessment_status,
                waiting_room_open
            FROM group_assessments
            WHERE access_key = ?
            `,
            [group_assessment_key]
        );

    if (!groupExam) {

        return res.status(404).json({
            error: "Ogiltig nyckel."
        });

    }

    const [[existingAttempt]] =
        await db.query(
            `
            SELECT
                id,
                status
            FROM assessment_attempts
            WHERE
                group_assessment_id = ?
                AND user_id = ?
            ORDER BY started_at DESC
            LIMIT 1
            `,
            [
                groupExam.id,
                req.user.id
            ]
        );

    if (
        existingAttempt?.status === "submitted"
    ) {

        return res.status(409).json({
            error:
                "Du har redan lämnat in provet."
        });

    }

    if (existingAttempt) {

        return res.json({
            success: true,
            group_assessment_id: groupExam.id,
            assessment_status: groupExam.assessment_status
        });

    }

    if (groupExam.assessment_status === "closed") {

        return res.status(403).json({
            error:
                "Provet är stängt."
        });

    }

    if (!groupExam.waiting_room_open) {

        return res.status(403).json({
            error:
                "Väntrummet är stängt."
        });

    }

    const [studentRows] =
        await db.query(
            `
            SELECT 1
            FROM group_students
            WHERE group_id = ?
                AND user_id = ?
                AND deleted_at IS NULL
            `,
            [
                groupExam.group_id,
                req.user.id
            ]
        );

    if (!studentRows.length) {

        return res.status(403).json({
            error: "Du tillhör inte gruppen."
        });

    }

    await db.query(
        `
        INSERT IGNORE INTO assessment_waiting_room (
            group_assessment_id,
            user_id
        )
        VALUES (?, ?)
        `,
        [
            groupExam.id,
            req.user.id
        ]
    );

    res.json({
        success: true,
        group_assessment_id: groupExam.id,
        assessment_status: groupExam.assessment_status
    });

});

// POST /api/group-assessment-lobby/find
router.post("/find", async (req, res) => {

    try {

        const { group_assessment_key } = req.body;

        if (!group_assessment_key) {

            return res.status(400).json({
                error: "Exam key saknas."
            });

        }

        const [[groupExam]] = await db.query(
            `
            SELECT
                ge.id,
                ge.group_id,
                ge.assessment_id,
                ge.waiting_room_open,
                ge.status AS assessment_status,
                ge.available_from,
                ge.available_until,
                ge.config,

                e.title AS assessment_title,
                g.name AS group_name

            FROM group_assessments ge

            INNER JOIN assessments e
                ON e.id = ge.assessment_id

            INNER JOIN \`groups\` g
                ON g.id = ge.group_id

            WHERE ge.access_key = ?
            `,
            [group_assessment_key]
        );

        if (!groupExam) {

            return res.status(404).json({
                error: "Ogiltig assessment key."
            });

        }

        const groupExamConfig =
            typeof groupExam.config === "string"
                ? JSON.parse(groupExam.config || "{}")
                : groupExam.config || {};
        const abilityIds = Object.keys(
            groupExamConfig.abilityQuestionCounts || {}
        )
            .map(Number)
            .filter(Number.isInteger);
        let testAbilitySeries = null;

        if (abilityIds.length > 0) {
            [[testAbilitySeries]] = await db.query(
                `
                SELECT DISTINCT
                    a.series_id AS ability_series_id,
                    asr.name AS ability_series_name
                FROM abilities a
                INNER JOIN ability_series asr
                    ON asr.id = a.series_id
                WHERE a.id IN (?)
                LIMIT 1
                `,
                [abilityIds]
            );
        }

        if (!groupExam.waiting_room_open) {

            return res.status(403).json({
                error:
                    "Provtillfället tar inte emot nya deltagare."
            });

        }

        const [studentRows] = await db.query(
            `
            SELECT 1
            FROM group_students
            WHERE group_id = ?
                AND user_id = ?
            `,
            [
                groupExam.group_id,
                req.user.id
            ]
        );

        if (!studentRows.length) {

            return res.status(403).json({
                error: "Du tillhör inte gruppen."
            });

        }

        if (!groupExam.waiting_room_open) {

            return res.status(403).json({
                error: "Väntrummet är stängt."
            });

        }

        res.json({
            group_assessment_id: groupExam.id,
            assessment_id: groupExam.assessment_id,
            group_id: groupExam.group_id,
            assessment_title: groupExam.assessment_title,
            group_name: groupExam.group_name,
            assessment_status: groupExam.assessment_status,
            waiting_room_open: groupExam.waiting_room_open,
            ability_series_id: testAbilitySeries?.ability_series_id || null,
            ability_series_name: testAbilitySeries?.ability_series_name || null,
            available_from: groupExam.available_from,
            available_until: groupExam.available_until
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Kunde inte hitta provtillfället."
        });

    }

});


export default router
