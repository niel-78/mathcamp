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
                    assessment_status,
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

            });o
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
                assessment_status,
                waiting_room_open
            FROM group_assessments
            WHERE group_assessment_key = ?
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
                ge.assessment_status,
                ge.available_from,
                ge.available_until,

                e.title AS assessment_title,
                g.name AS group_name

            FROM group_assessments ge

            INNER JOIN assessments e
                ON e.id = ge.assessment_id

            INNER JOIN \`groups\` g
                ON g.id = ge.group_id

            WHERE ge.group_assessment_key = ?
            `,
            [group_assessment_key]
        );

        if (!groupExam) {

            return res.status(404).json({
                error: "Ogiltig assessment key."
            });

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
            assessment_title: groupExam.assessment_title,
            group_name: groupExam.group_name,
            assessment_status: groupExam.assessment_status,
            waiting_room_open: groupExam.waiting_room_open,
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
