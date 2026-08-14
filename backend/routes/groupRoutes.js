import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import multer from "multer";
import XLSX from "xlsx";
import crypto from "crypto";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});

router.use(requireAuth);
router.use(requireRole("teacher","super"));

/*
GET    /api/groups
POST   /api/groups

GET    /api/groups/:id
PUT    /api/groups/:id
DELETE /api/groups/:id

GET    /api/groups/:id/students
POST   /api/groups/:id/students
DELETE /api/groups/:id/students/:studentId

GET    /api/groups/:id/group-exams

PUT    /api/groups/:id/archive
*/

// GET /api/groups
router.get("/", async (req, res) => {

    let groups;

    if (req.user.role === "super") {

        [groups] = await db.query(
            `
            SELECT *
            FROM groups
            WHERE archived_at IS NULL
            ORDER BY name
            `
        );

    } else {

        [groups] = await db.query(
            `
            SELECT g.*
            FROM groups g
            INNER JOIN group_permissions gp
                ON gp.group_id = g.id
            WHERE gp.teacher_id = ?
            AND g.archived_at IS NULL
            ORDER BY g.name
            `,
            [req.user.id]
        );

    }

    res.json(groups);

});

// POST /api/groups
router.post("/", async (req, res) => {

    const { name } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO groups (name)
        VALUES (?)
        `,
        [name]
    );

    await db.query(
        `
        INSERT INTO group_permissions (
            group_id,
            teacher_id,
            role
        )
        VALUES (?, ?, 'owner')
        `,
        [
            result.insertId,
            req.user.id
        ]
    );

    res.status(201).json({
        id: result.insertId,
        name,
        role: "owner"
    });

});


// GET /api/groups/:id
router.get("/:id", async (req, res) => {
    const [[group]] = await db.query(
        `
        SELECT
            g.*,
            gp.role
        FROM groups g

        INNER JOIN group_permissions gp
            ON gp.group_id = g.id

        WHERE g.id = ?
        AND gp.teacher_id = ?
        `,
        [
            req.params.id,
            req.user.id
        ]
    );

    if (!group) {

        return res.status(404).json({
            error: "Group not found"
        });

    }

    const [students] = await db.query(
        `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.username,
            u.user_key
        FROM group_students gs

        INNER JOIN users u
            ON u.id = gs.user_id

        WHERE gs.group_id = ?

        ORDER BY
            u.last_name,
            u.first_name
        `,
        [req.params.id]
    );

    group.students = students;

    res.json(group);

});
// PUT /api/groups/:id
router.put("/:id", async (req, res) => {

    try {

        const {
            name,
            description
        } = req.body;

        await db.query(
            `
            UPDATE groups
            SET
                name = ?,
                description = ?
            WHERE id = ?
            `,
            [
                name,
                description,
                req.params.id
            ]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte uppdatera gruppen."
        });

    }

});


// GET /api/groups/:id/students
router.get("/:id/students", async (req, res) => {
    try {

        const [students] = await db.query(
            `
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                gs.joined_at
            FROM group_students gs
            INNER JOIN users u
                ON u.id = gs.user_id
            WHERE gs.group_id = ?
            AND u.role = 'student'
            AND gs.deleted_at IS NULL
            ORDER BY u.last_name, u.first_name
            `,
            [req.params.id]
        );

        res.json({
            students
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte hämta gruppens elever."
        });

    }
});
// POST /api/groups/:id/students
router.post("/:id/students", async (req, res) => {
    try {

        const {
            username,
            first_name,
            last_name
        } = req.body;

        const password = generatePassword();


        const password_hash =
            await bcrypt.hash(password, 12);


        const [userResult] = await db.query(
            `
            INSERT INTO users (
                username,
                password_hash,
                role,
                first_name,
                last_name
            )
            VALUES (?, ?, 'student', ?, ?)
            `,
            [
                username,
                password_hash,
                first_name,
                last_name
            ]
        );

        await db.query(
            `
            INSERT INTO group_students (
                group_id,
                user_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.id,
                userResult.insertId
            ]
        );

        res.status(201).json({
            id: userResult.insertId,
            password: password 
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte skapa elev."
        });

    }
});
// DELETE /api/groups/:id/students/:studentId
router.delete("/:id/students/:studentId", async (req, res) => {
    try {

        const [result] = await db.query(
            `
                UPDATE group_students
                SET deleted_at = NOW()
                WHERE group_id = ?
                AND user_id = ?
            `,
            [
                req.params.id,
                req.params.studentId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Eleven finns inte i gruppen."
            });
        }

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte ta bort eleven från gruppen."
        });

    }
});

// POST /api/groups/:id/import-students
router.post("/:id/import-students",
    upload.single("file"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Ingen fil uppladdad"
                });
            }

            const workbook = XLSX.read(
                req.file.buffer
            );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(sheet);

            const imported = [];

            for (const row of rows) {

                const firstName =
                    row.Förnamn?.trim();

                const lastName =
                    row.Efternamn?.trim();

                if (
                    !firstName ||
                    !lastName
                ) {
                    continue;
                }

                let username =
                    (
                        firstName.toLowerCase() +
                        "." +
                        lastName.toLowerCase()
                    )
                    .replace(/å/g, "a")
                    .replace(/ä/g, "a")
                    .replace(/ö/g, "o")
                    .replace(/\s+/g, "");


                let counter = 1;

                while (true) {

                    const [[existing]] = await db.query(
                        `
                        SELECT id
                        FROM users
                        WHERE username = ?
                        `,
                        [username]
                    );

                    if (!existing) {
                        break;
                    }

                    counter++;

                    username =
                        (
                            firstName.toLowerCase() +
                            "." +
                            lastName.toLowerCase()
                        )
                        .replace(/å/g, "a")
                        .replace(/ä/g, "a")
                        .replace(/ö/g, "o")
                        .replace(/\s+/g, "")
                        + counter;
                }

                const password = generatePassword();
                
                const passwordHash =
                    await bcrypt.hash(
                        password,
                        10
                    );

                const userKey =
                    crypto.randomUUID();

                const [userResult] =
                    await db.query(
                        `
                        INSERT INTO users (
                            username,
                            password_hash,
                            role,
                            first_name,
                            last_name,
                            user_key
                        )
                        VALUES (
                            ?,
                            ?,
                            'student',
                            ?,
                            ?,
                            ?
                        )
                        `,
                        [
                            username,
                            passwordHash,
                            firstName,
                            lastName,
                            userKey
                        ]
                    );

                await db.query(
                    `
                    INSERT INTO group_students (
                        user_id,
                        group_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        userResult.insertId,
                        req.params.id
                    ]
                );

                imported.push({
                    id: userResult.insertId,
                    firstName,
                    lastName,
                    username,
                    password: password
                });

            }

            res.json({
                importedCount:
                    imported.length,
                students:
                    imported
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Importen misslyckades"
            });

        }

    }
);

//PUT /api/groups/:id/archive
router.put("/:id/archive", async (req, res) => {
    try {

        await db.query(
            `
            UPDATE groups
            SET archived = TRUE
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte arkivera gruppen."
        });

    }
});

//GET /api/groups/:id/planning-sections
router.get("/:id/planning-sections", requireAuth,
    async (req, res) => {

        const [rows] = await db.query(
            `
            SELECT
                gps.*,
                s.title
            FROM group_planning_sections gps
            JOIN sections s
                ON s.id = gps.section_id
            WHERE gps.group_id = ?
            ORDER BY gps.sort_order
            `,
            [req.params.id]
        );

        res.json(rows);

    }
);

//PUT /api/groups/:id/planning-sections
router.put("/:id/planning-sections", requireAuth,
    async (req, res) => {

        const {
            sectionIds,
            pages_per_lesson
        } = req.body;

        await db.query(
            `
            UPDATE groups
            SET pages_per_lesson = ?
            WHERE id = ?
            `,
            [
                pages_per_lesson,
                req.params.id
            ]
        );

        await db.query(
            `
            DELETE
            FROM group_planning_sections
            WHERE group_id = ?
            `,
            [req.params.id]
        );

        for (let i = 0; i < sectionIds.length; i++) {

            await db.query(
                `
                INSERT INTO
                group_planning_sections (
                    group_id,
                    section_id,
                    sort_order
                )
                VALUES (?, ?, ?)
                `,
                [
                    req.params.id,
                    sectionIds[i],
                    i + 1
                ]
            );

        }

        res.sendStatus(204);

    }
);

//GET /api/groups/:groupId/planning-sections/edit
router.get("/:groupId/planning-sections/edit", requireAuth,
    async (req, res) => {

        const [[group]] =
            await db.query(
                `
                SELECT 
                    book_id,
                    pages_per_lesson
                FROM groups
                WHERE id = ?
                `,
                [req.params.groupId]
            );

        if (!group?.book_id) {

            return res.json([]);

        }

        const [rows] =
            await db.query(
                `
                SELECT

                    s.id,

                    c.chapter_number,
                    sc.subchapter_number,

                    s.title,

                    CASE
                        WHEN gps.id IS NULL
                        THEN FALSE
                        ELSE TRUE
                    END AS selected

                FROM sections s

                JOIN subchapters sc
                    ON sc.id = s.subchapter_id

                JOIN chapters c
                    ON c.id = sc.chapter_id

                LEFT JOIN group_planning_sections gps
                    ON gps.section_id = s.id
                    AND gps.group_id = ?

                WHERE c.book_id = ?

                ORDER BY
                    c.sort_order,
                    sc.sort_order,
                    s.sort_order
                `,
                [
                    req.params.groupId,
                    group.book_id
                ]
            );

        res.json({
            pages_per_lesson:
                group.pages_per_lesson,

            sections: rows
        });

    }
);

// POST /api/groups/:groupId/fill-planning
router.post("/:groupId/fill-planning",
    requireAuth,
    async (req, res) => {

        const groupId =
            req.params.groupId;

        const [[group]] =
            await db.query(
                `
                SELECT
                    pages_per_lesson
                FROM groups
                WHERE id = ?
                `,
                [groupId]
            );

        if (!group) {

            return res
                .status(404)
                .send("Gruppen hittades inte");

        }

        const [lessons] =
            await db.query(
                `
                SELECT
                    id,
                    starts_at
                FROM lessons
                WHERE group_id = ?
                AND cancelled_at IS NULL
                AND deleted_at IS NULL
                ORDER BY starts_at
                `,
                [groupId]
            );

        const [sections] =
            await db.query(
                `
                SELECT
                    s.id,
                    s.page_number

                FROM group_planning_sections gps

                JOIN sections s
                    ON s.id = gps.section_id

                WHERE gps.group_id = ?

                ORDER BY gps.sort_order
                `,
                [groupId]
            );

        if (
            lessons.length === 0 ||
            sections.length === 0
        ) {

            return res.json({
                lessonsFilled: 0,
                sectionsPlaced: 0
            });

        }

        for (
            let i = 0;
            i < sections.length;
            i++
        ) {

            const current =
                sections[i];

            const next =
                sections[i + 1];

            current.page_count =
                next
                    ? Math.max(
                        1,
                        next.page_number -
                        current.page_number
                    )
                    : 1;

        }

        await db.query(
            `
            DELETE ls
            FROM lesson_sections ls
            JOIN lessons l
                ON l.id = ls.lesson_id
            WHERE l.group_id = ?
            `,
            [groupId]
        );

        const targetPages =
            group.pages_per_lesson || 8;

        let lessonIndex = 0;
        let lessonPages = 0;
        let lessonPosition = 1;
        let sectionsPlaced = 0;

        for (
            const section of sections
        ) {

            if (
                lessonIndex >=
                lessons.length
            ) {
                break;
            }

            if (
                lessonPages > 0 &&
                (
                    lessonPages +
                    section.page_count
                ) > targetPages
            ) {

                lessonIndex++;
                lessonPages = 0;
                lessonPosition = 1;

            }

            if (
                lessonIndex >=
                lessons.length
            ) {
                break;
            }

            await db.query(
                `
                INSERT INTO lesson_sections (
                    lesson_id,
                    section_id,
                    sort_order
                )
                VALUES (?, ?, ?)
                `,
                [
                    lessons[
                        lessonIndex
                    ].id,
                    section.id,
                    lessonPosition
                ]
            );

            lessonPages +=
                section.page_count;

            lessonPosition++;

            sectionsPlaced++;

        }

        res.json({
            lessonsFilled:
                lessonIndex + 1,
            sectionsPlaced
        });

    }
);



export default router
