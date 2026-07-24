import express from "express";
import db from "../db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

// PUT /api/teacher/group-exams/:id
router.put("/group-exams/:id", async (req, res) => {

    const {
        exam_config,
        time_limit_minutes,
        shuffle_questions,
        shuffle_options,
        max_attempts,
        show_result_immediately,
        passing_score,
        is_active,
        available_from,
        available_until
    } = req.body;

    await db.query(
        `
        UPDATE group_exams
        SET
            exam_config = ?,
            time_limit_minutes = ?,
            shuffle_questions = ?,
            shuffle_options = ?,
            max_attempts = ?,
            show_result_immediately = ?,
            passing_score = ?,
            is_active = ?,
            available_from = ?,
            available_until = ?
        WHERE id = ?
        `,
        [
            JSON.stringify(exam_config),
            time_limit_minutes,
            shuffle_questions,
            shuffle_options,
            max_attempts,
            show_result_immediately,
            passing_score,
            is_active,
            available_from,
            available_until,
            req.params.id
        ]
    );

    res.sendStatus(204);
});

// DELETE /api/teacher/group-exams/:id
router.delete("/group-exams/:id", async (req, res) => {

    await db.query(
        `
        DELETE FROM group_exams
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.sendStatus(204);
});


export default router