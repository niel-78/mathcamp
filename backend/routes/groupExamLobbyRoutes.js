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
router.use(requireRole("student", "teacher", "admin"));

/* 
POST /group-exam-lobby/:id/join
GET /group-exam-lobby/:id/status
POST /group-exam-lobby/find
*/

// GET /api/group-exams/:id/status
router.get("/:id/status", async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    exam_status,
                    waiting_room_open
                FROM group_exams
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
                FROM exam_waiting_room
                WHERE
                    group_exam_id = ?
                    AND user_id = ?
                `,
                [
                    req.params.id,
                    req.user.id
                ]
            );

            console.log({
                exam_status: rows[0].exam_status,
                admitted:
                    waitingRows.length > 0 &&
                    waitingRows[0].admitted_at !== null
            });

            res.json({

                exam_status:
                    rows[0].exam_status,

                waiting_room_open:
                    rows[0].waiting_room_open,

                admitted:
                    waitingRows.length > 0 &&
                    waitingRows[0].admitted_at !== null

            });
    }
);

// POST /api/group-exams/join
router.post("/join", async (req, res) => {

    console.log("JOIN");

    const { group_exam_key } = req.body;

    const [[groupExam]] =
        await db.query(
            `
            SELECT
                id,
                group_id,
                exam_status,
                waiting_room_open
            FROM group_exams
            WHERE group_exam_key = ?
            `,
            [group_exam_key]
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
            FROM exam_attempts
            WHERE
                group_exam_id = ?
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
        INSERT IGNORE INTO exam_waiting_room (
            group_exam_id,
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
        group_exam_id: groupExam.id,
        exam_status: groupExam.exam_status
    });

});

// POST /api/group-exam-lobby/find
router.post("/find", async (req, res) => {

    try {

        const { group_exam_key } = req.body;

        if (!group_exam_key) {

            return res.status(400).json({
                error: "Exam key saknas."
            });

        }

        const [[groupExam]] = await db.query(
            `
            SELECT
                ge.id,
                ge.group_id,
                ge.exam_id,
                ge.waiting_room_open,
                ge.exam_status,
                ge.available_from,
                ge.available_until,

                e.title AS exam_title,
                g.name AS group_name

            FROM group_exams ge

            INNER JOIN exams e
                ON e.id = ge.exam_id

            INNER JOIN groups g
                ON g.id = ge.group_id

            WHERE ge.group_exam_key = ?
            `,
            [group_exam_key]
        );

        if (!groupExam) {

            return res.status(404).json({
                error: "Ogiltig exam key."
            });

        }

        console.log(groupExam);
        console.log(
            typeof groupExam.waiting_room_open,
            groupExam.waiting_room_open
        );

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
            group_exam_id: groupExam.id,
            exam_id: groupExam.exam_id,
            exam_title: groupExam.exam_title,
            group_name: groupExam.group_name,
            exam_status: groupExam.exam_status,
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
