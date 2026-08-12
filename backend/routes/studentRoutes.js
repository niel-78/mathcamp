import multer from "multer";
import path from "path";
import express from "express";
import db from "../db.js";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

/*
GET    /api/students
POST   /api/students

GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id

GET    /api/students/:id/attempts
GET    /api/students/:id/results

PUT    /api/students/:id/password
*/

// GET /api/students
router.get("/", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT
            id,
            username,
            first_name,
            last_name
        FROM users
        WHERE role = 'student'
        ORDER BY
            last_name,
            first_name
        `
    );

    res.json(rows);
});

// POST /api/students

// GET /api/students/:studentId
router.get("/:studentId", async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                id,
                username,
                first_name,
                last_name,
                user_key
            FROM users
            WHERE id = ?
            `,
            [req.params.studentId]
        );

        if (!rows.length) {
            return res.sendStatus(404);
        }

        res.json(rows[0]);

    }
);
// PUT /api/students/:studentId
router.put("/:studentId", async (req, res) => {

        const {
            first_name,
            last_name
        } = req.body;

        await db.query(
            `
            UPDATE users
            SET
                first_name = ?,
                last_name = ?
            WHERE id = ?
            `,
            [
                first_name,
                last_name,
                req.params.studentId
            ]
        );

        res.sendStatus(204);

    }
);
// DELETE /api/students/:id

//PUT /api/students/:studentId/password
router.put("/:studentId/password",
    async (req, res) => {

        let { password } = req.body;

        if (!password?.trim()) {
            password = generatePassword();
        }

        const passwordHash =
            await bcrypt.hash(password, 12);

        await db.query(
            `
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            `,
            [
                passwordHash,
                req.params.studentId
            ]
        );

        res.json({
            password
        });
    }
);

// GET /api/students/:id/attempts
// GET /api/students/:id/results

// GET /api/students/:id/events
router.get("/:id/students/:userId/events", async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    ee.*
                FROM exam_events ee

                INNER JOIN exam_attempts ea
                    ON ea.id = ee.attempt_id

                WHERE
                    ea.group_exam_id = ?
                    AND ea.user_id = ?

                ORDER BY
                    ee.created_at DESC
                `,
                [
                    req.params.id,
                    req.params.userId
                ]
            );

        res.json(rows);

    }
);


export default router