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

// GET /api/teacher/groups
router.get("/", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM groups
        WHERE archived = FALSE
        ORDER BY name
        `
    );

    res.json(rows);
});

// GET /api/teacher/groups/archived
router.get("/archived", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM groups
        WHERE archived = TRUE
        ORDER BY name
        `
    );

    res.json(rows);
});

// GET /api/teacher/groups/:groupId/full
router.get("/:groupId/full", async (req, res) => {

    const [groupRows] = await db.query(
        `
        SELECT *
        FROM groups
        WHERE id = ?
        `,
        [req.params.groupId]
    );

    if (!groupRows.length) {
        return res.status(404).json({
            error: "Group not found"
        });
    }

    const [students] = await db.query(
        `
        SELECT
            u.id,
            u.username,
            u.first_name,
            u.last_name,
            u.user_key
        FROM users u
        JOIN group_students gs
            ON gs.user_id = u.id
        WHERE gs.group_id = ?
        AND u.role = 'student'
        ORDER BY
            u.last_name,
            u.first_name
        `,
        [req.params.groupId]
    );


    const [groupExams] = await db.query(
        `
        SELECT
            ge.*,
            e.title
        FROM group_exams ge
        JOIN exams e
            ON e.id = ge.exam_id
        WHERE ge.group_id = ?
        ORDER BY e.title
        `,
        [req.params.groupId]
    );

    res.json({
        ...groupRows[0],
        students,
        groupExams
    });
});

// POST /api/teacher/groups
router.post("/", async (req, res) => {

    const { name } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO groups(name)
        VALUES(?)
        `,
        [name]
    );

    res.json({
        id: result.insertId
    });
});

// PUT /api/teacher/groups/:groupId
router.put("/:groupId", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE groups
        SET name = ?
        WHERE id = ?
        `,
        [
            name,
            req.params.groupId
        ]
    );

    res.sendStatus(204);
});

// PUT /api/teacher/groups/:groupId/archive
router.put("/:groupId/archive", async (req, res) => {

        await db.query(
            `
            UPDATE groups
            SET archived = TRUE
            WHERE id = ?
            `,
            [req.params.groupId]
        );

        res.sendStatus(204);
    }
);

// PUT /api/teacher/groups/:groupId/unarchive
router.put("/:groupId/unarchive", async (req, res) => {

        await db.query(
            `
            UPDATE groups
            SET archived = FALSE
            WHERE id = ?
            `,
            [req.params.groupId]
        );

        res.sendStatus(204);
    }
);

// DELETE /api/teacher/groups/:groupId
router.delete("/:groupId", async (req, res) => {

    await db.query(
        `
        DELETE FROM groups
        WHERE id = ?
        `,
        [req.params.groupId]
    );

    res.sendStatus(204);
});

// POST /api/teacher/groups/:groupId/students
router.post("/:groupId/students", async (req, res) => {

    const {
        email,
        first_name,
        last_name
    } = req.body;

    const password = generatePassword();

    const passwordHash =
        await bcrypt.hash(
            password,
            12
        );

    const [existingUser] =
        await db.query(
            `
            SELECT id
            FROM users
            WHERE username = ?
            `,
            [email]
        );

    if (existingUser.length) {
        return res.status(400).json({
            error: "Användaren finns redan"
        });
    }

    const [userResult] =
        await db.query(
            `
            INSERT INTO users(
                username,
                password_hash,
                role,
                first_name,
                last_name
            )
            VALUES (?, ?, 'student', ?, ?)
            `,
            [
                email,
                passwordHash,
                first_name,
                last_name
            ]
        );

    await db.query(
        `
        INSERT INTO group_students(
            user_id,
            group_id
        )
        VALUES (?, ?)
        `,
        [
            userResult.insertId,
            req.params.groupId
        ]
    );

    res.json({
        id: userResult.insertId,
        username: email,
        password
    });
});

// DELETE /api/teacher/groups/:groupId/students/:userId
router.delete(
    "/:groupId/students/:userId",
    async (req, res) => {

        await db.query(
            `
            DELETE FROM group_students
            WHERE user_id = ?
            AND group_id = ?
            `,
            [
                req.params.userId,
                req.params.groupId
            ]
        );

        res.sendStatus(204);
    }
);

// POST /api/teacher/groups/:groupId/exams
router.post("/:groupId/exams", async (req, res) => {

    const { examId } = req.body;

    await db.query(
        `
        INSERT INTO group_exams(
            group_id,
            exam_id,
            group_exam_key
        )
        VALUES (?, ?, ?)
        `,
        [
            req.params.groupId,
            examId,
            crypto.randomUUID()
        ]
    );

    res.sendStatus(201);
});


export default router
