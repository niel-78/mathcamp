import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import multer from "multer";
import XLSX from "xlsx";
import crypto from "crypto";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { scoreNumericInput } from "../utils/grading/gradeNumericInput.js";
import { scoreFactorization } from "../utils/grading/gradeFactorization.js";

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

GET    /api/groups/:id/group-assessments

PUT    /api/groups/:id/archive
*/


// GET /api/groups/student-import-template - måste ligga före /
router.get("/student-import-template",
    async (req, res) => {

        const workbook =
            XLSX.utils.book_new();

        const worksheet =
            XLSX.utils.json_to_sheet([
                {
                    Efternamn: "Andersson",
                    Förnamn: "Anna",
                    "E-post": "anna.andersson@example.com",
                    Visningsnamn: "",
                    Användarnamn: ""
                },
                {
                    Efternamn: "Svensson",
                    Förnamn: "Karl",
                    "E-post": "karl.svensson@example.com",
                    Visningsnamn: "Kalle",
                    Användarnamn: "kalle"
                }
            ]);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Elever"
        );

        const buffer =
            XLSX.write(
                workbook,
                {
                    type: "buffer",
                    bookType: "xlsx"
                }
            );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="elever-mall.xlsx"'
        );

        res.send(buffer);

    }
);

// GET /api/groups
router.get("/", async (req, res) => {

    let groups;

    if (req.user.role === "super") {

        [groups] = await db.query(
            `
            SELECT
                g.*,
                l.code AS level_code,
                l.name AS level_name,
                s.name AS subject_name
            FROM \`groups\` g
            LEFT JOIN levels l ON l.id = g.level_id
            LEFT JOIN subjects s ON s.id = l.subject_id
            WHERE archived_at IS NULL
            ORDER BY name
            `
        );

    } else {

        [groups] = await db.query(
            `
            SELECT
                g.*,
                l.code AS level_code,
                l.name AS level_name,
                s.name AS subject_name
            FROM \`groups\` g
            INNER JOIN group_permissions gp
                ON gp.group_id = g.id
            LEFT JOIN levels l ON l.id = g.level_id
            LEFT JOIN subjects s ON s.id = l.subject_id
            WHERE gp.user_id = ?
            AND g.archived_at IS NULL
            ORDER BY g.name
            `,
            [req.user.id]
        );

    }

    const bookIds = [
        ...new Set(
            groups
                .filter(group => group.book_id)
                .map(group => group.book_id)
        )
    ];

    if (bookIds.length > 0) {

        const [sections] = await db.query(
            `
            SELECT
                s.id,
                s.subchapter_id,
                s.title,
                s.content,
                s.page_number,
                s.sort_order,

                sc.title AS subchapter_title,
                c.title AS chapter_title,
                c.book_id

            FROM sections s

            INNER JOIN subchapters sc
                ON sc.id = s.subchapter_id

            INNER JOIN chapters c
                ON c.id = sc.chapter_id

            WHERE c.book_id IN (?)

            ORDER BY
                c.sort_order,
                sc.sort_order,
                s.sort_order
            `,
            [bookIds]
        );

        const sectionsBySubchapter = {};

        sections.forEach(section => {

            if (!sectionsBySubchapter[section.subchapter_id]) {
                sectionsBySubchapter[section.subchapter_id] = [];
            }

            sectionsBySubchapter[section.subchapter_id].push(section);

        });

        Object.values(sectionsBySubchapter).forEach(
            subchapterSections => {

                for (
                    let i = 0;
                    i < subchapterSections.length;
                    i++
                ) {

                    subchapterSections[i].end_page =
                        i < subchapterSections.length - 1
                            ? subchapterSections[i + 1].page_number - 1
                            : subchapterSections[i].page_number;

                }

            }
        );

        const sectionIds =
            sections.map(section => section.id);

        const [blockCounts] = sectionIds.length > 0
            ? await db.query(
                `
                SELECT
                    section_id,
                    COUNT(*) AS block_count
                FROM block_sections
                INNER JOIN blocks b
                    ON b.id = block_sections.block_id
                WHERE section_id IN (?)
                AND b.archived_at IS NULL
                AND b.deleted_at IS NULL
                GROUP BY section_id
                `,
                [sectionIds]
            )
            : [[]];

        const blockCountBySection = {};

        blockCounts.forEach(row => {
            blockCountBySection[row.section_id] = row.block_count;
        });

        sections.forEach(section => {
            section.block_count =
                blockCountBySection[section.id] || 0;
        });

        const sectionsByBook = {};

        sections.forEach(section => {

            if (!sectionsByBook[section.book_id]) {
                sectionsByBook[section.book_id] = [];
            }

            sectionsByBook[section.book_id].push(section);

        });

        groups.forEach(group => {

            group.sections =
                sectionsByBook[group.book_id] || [];

        });

        const levelIds = [
            ...new Set(
                groups
                    .filter(group => group.level_id)
                    .map(group => group.level_id)
            )
        ];

        const [abilities] = await db.query(
            `
            SELECT
                a.*,
                s.name AS series_name,
                l.id AS level_id

            FROM abilities a

            INNER JOIN ability_series s
                ON s.id = a.series_id

            INNER JOIN levels l
                ON l.subject_id = s.subject_id

            WHERE l.id IN (?)

            ORDER BY
                s.name,
                a.name
            `,
            [levelIds]
        );

        const abilitiesByLevel = {};

        abilities.forEach(ability => {

            if (!abilitiesByLevel[ability.level_id]) {
                abilitiesByLevel[ability.level_id] = [];
            }

            abilitiesByLevel[ability.level_id].push(ability);

        });

        const groupIds = groups.map(group => group.id);

        const [planningSections] = await db.query(
            `
            SELECT
                group_id,
                section_id
            FROM group_planning_sections
            WHERE group_id IN (?)
            `,
            [groupIds.length > 0 ? groupIds : [0]]
        );

        const planningSectionIdsByGroup = {};

        planningSections.forEach(row => {

            if (!planningSectionIdsByGroup[row.group_id]) {
                planningSectionIdsByGroup[row.group_id] = [];
            }

            planningSectionIdsByGroup[row.group_id].push(
                row.section_id
            );

        });

        groups.forEach(group => {

            group.sections =
                sectionsByBook[group.book_id] || [];

            group.abilities =
                abilitiesByLevel[group.level_id] || [];

            group.planningSectionIds =
                planningSectionIdsByGroup[group.id] || [];

        });

    }

    res.json(groups);

});

// GET /api/groups/:id/results
router.get("/:id/results", async (req, res) => {

    try {

        const [[group]] = await db.query(
            `
            SELECT g.id
            FROM \`groups\` g
            INNER JOIN group_permissions gp
                ON gp.group_id = g.id
            WHERE g.id = ?
                AND gp.user_id = ?
            `,
            [req.params.id, req.user.id]
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
                u.display_name,
                u.username,
                gs.review_status,
                (
                    SELECT ROUND(AVG(COALESCE(sam.mastery_score, 50)), 2)
                    FROM \`groups\` ability_group
                    INNER JOIN abilities ability
                        ON ability.series_id = ability_group.ability_series_id
                        AND ability.deleted_at IS NULL
                    LEFT JOIN student_ability_mastery sam
                        ON sam.ability_id = ability.id
                        AND sam.user_id = gs.user_id
                    WHERE ability_group.id = gs.group_id
                ) AS mastery_average
            FROM group_students gs
            INNER JOIN users u
                ON u.id = gs.user_id
            WHERE gs.group_id = ?
                AND gs.deleted_at IS NULL
                AND u.deleted_at IS NULL
            ORDER BY u.last_name, u.first_name
            `,
            [req.params.id]
        );

        const results = [];

        for (const student of students) {

            const [answers] = await db.query(
                `
                SELECT
                    aq.question_id,
                    q.question_type,
                    q.answer_config,
                    aa.text_answer,
                    (
                        SELECT GROUP_CONCAT(o.id ORDER BY o.id)
                        FROM options o
                        WHERE o.question_id = q.id
                            AND o.is_correct = 1
                    ) AS correct_option_ids,
                    (
                        SELECT GROUP_CONCAT(o.text ORDER BY o.id SEPARATOR '||')
                        FROM options o
                        WHERE o.question_id = q.id
                            AND o.is_correct = 1
                    ) AS correct_text,
                    GROUP_CONCAT(
                        DISTINCT ao.option_id
                        ORDER BY ao.option_id
                    ) AS selected_option_ids
                FROM assessment_attempts at
                INNER JOIN group_assessments ga
                    ON ga.id = at.group_assessment_id
                INNER JOIN attempt_questions aq
                    ON aq.attempt_id = at.id
                INNER JOIN questions q
                    ON q.id = aq.question_id
                INNER JOIN assessment_answers aa
                    ON aa.attempt_id = aq.attempt_id
                    AND aa.question_id = aq.question_id
                LEFT JOIN answer_options ao
                    ON ao.answer_id = aa.id
                WHERE ga.group_id = ?
                    AND at.user_id = ?
                    AND aq.answered_at IS NOT NULL
                    AND q.excluded_from_assessments = 0
                    AND NOT EXISTS (
                        SELECT 1
                        FROM question_reports qr
                        WHERE qr.attempt_id = at.id
                            AND qr.question_id = aq.question_id
                            AND qr.report_type = 'missing_correct_option'
                    )
                GROUP BY
                    aq.attempt_id,
                    aq.question_id,
                    q.question_type,
                    q.answer_config,
                    aa.text_answer
                `,
                [req.params.id, student.id]
            );

            let correctCount = 0;

            for (const answer of answers) {

                const config = typeof answer.answer_config === "string"
                    ? JSON.parse(answer.answer_config || "{}")
                    : answer.answer_config || {};

                if (answer.question_type === "factorization") {
                    const correctText = answer.correct_text
                        ?.split("||")[0];
                    const score = scoreFactorization(
                        answer.text_answer,
                        correctText
                    );
                    correctCount += score.pointsFraction;
                    continue;
                }

                if (
                    answer.question_type === "expression" ||
                    answer.question_type === "text"
                ) {
                    const correctText = answer.correct_text
                        ?.split("||")[0];

                    if (gradeAnswer({
                        studentAnswer: answer.text_answer,
                        correctAnswer: correctText,
                        questionType: answer.question_type,
                        config
                    })) {
                        correctCount += 1;
                    }
                    continue;
                }

                if (
                    answer.question_type === "numeric_input" ||
                    answer.question_type === "equation"
                ) {
                    const correctValues = (answer.correct_text || "")
                        .split("||")
                        .filter(Boolean);

                    const score = scoreNumericInput(
                        answer.text_answer,
                        correctValues,
                        config
                    );

                    correctCount += score.pointsFraction;
                    continue;
                }

                const selectedIds = (answer.selected_option_ids || "")
                    .split(",")
                    .filter(Boolean)
                    .map(Number);
                const correctIds = (answer.correct_option_ids || "")
                    .split(",")
                    .filter(Boolean)
                    .map(Number);

                if (JSON.stringify(selectedIds) === JSON.stringify(correctIds)) {
                    correctCount += 1;
                }
            }

            results.push({
                id: student.id,
                name: student.display_name ||
                    `${student.first_name} ${student.last_name}`,
                username: student.username,
                mastery_average: student.mastery_average === null
                    ? null
                    : Number(student.mastery_average),
                answered_question_count: answers.length,
                correct_answer_count: Math.round(correctCount * 100) / 100,
                correct_percentage: answers.length
                    ? Math.round((correctCount / answers.length) * 100)
                    : null
            });
        }

        res.json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Kunde inte läsa gruppens resultat."
        });
    }

});

// POST /api/groups
router.post("/", async (req, res) => {

    const {
        name,
        school_id,
        level_id,
        book_id
    } = req.body;

    const [result] = await db.query(
        `
        INSERT INTO \`groups\` (
            name,
            school_id,
            level_id,
            book_id
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            name,
            school_id,
            level_id,
            book_id
        ]
    );

    await db.query(
        `
        INSERT INTO group_permissions (
            group_id,
            user_id,
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
        school_id,
        level_id,
        book_id,
        role: "owner"
    });

});

// GET /api/groups/:id
router.get("/:id", async (req, res) => {
    const [[group]] = await db.query(
        `
        SELECT
            g.*,
            gp.role,
            b.title AS book_title,
            a.name AS ability_series_name,
            l.code AS level_code,
            l.name AS level_name,
            s.name AS subject_name
        FROM \`groups\` g

        INNER JOIN group_permissions gp
            ON gp.group_id = g.id

        LEFT JOIN books b
            ON b.id = g.book_id

        LEFT JOIN ability_series a
            ON a.id = g.ability_series_id

        LEFT JOIN levels l
            ON l.id = g.level_id

        LEFT JOIN subjects s
            ON s.id = l.subject_id

        WHERE g.id = ?
        AND gp.user_id = ?
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
            u.display_name,
            u.username,
            u.user_key,
            gs.review_status,
            gs.review_updated_at,
            (
                SELECT DATE_FORMAT(
                    MAX(us.logged_in_at),
                    '%Y-%m-%dT%H:%i:%s.000Z'
                )
                FROM user_sessions us
                WHERE us.user_id = u.id
            ) AS last_login,
            (
                SELECT COUNT(*)
                FROM user_sessions us
                WHERE us.user_id = u.id
            ) AS login_count
        FROM group_students gs

        INNER JOIN users u
            ON u.id = gs.user_id

        WHERE gs.group_id = ?
            AND gs.deleted_at IS NULL
            AND u.deleted_at IS NULL

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
            UPDATE \`groups\`
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

// PUT /api/groups/:id/color
router.put("/:id/color", async (req, res) => {

    try {

        const { color_index } = req.body;

        await db.query(
            `
            UPDATE \`groups\`
            SET color_index = ?
            WHERE id = ?
            `,
            [
                color_index === null || typeof color_index === "undefined"
                    ? null
                    : Number(color_index),
                req.params.id
            ]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte uppdatera gruppens f\u00e4rg."
        });

    }

});

// PUT /api/groups/:id/ability-series
router.put("/:id/ability-series", async (req, res) => {

    try {

        const { ability_series_id } = req.body;

        await db.query(
            `
            UPDATE \`groups\`
            SET ability_series_id = ?
            WHERE id = ?
            `,
            [
                ability_series_id || null,
                req.params.id
            ]
        );

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte uppdatera f\u00f6rm\u00e5gaserien."
        });

    }


});

// PUT /api/groups/:id/book
router.put("/:id/book", async (req, res) => {

    try {

        const bookId = Number(req.body.book_id);

        if (!Number.isInteger(bookId) || bookId <= 0) {
            return res.status(400).json({
                error: "Ogiltigt bok-id."
            });
        }

        const [[book]] = await db.query(
            "SELECT id FROM books WHERE id = ?",
            [bookId]
        );

        if (!book) {
            return res.status(404).json({
                error: "Boken hittades inte."
            });
        }

        const [result] = await db.query(
            "UPDATE `groups` SET book_id = ? WHERE id = ?",
            [bookId, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Gruppen hittades inte."
            });
        }

        res.sendStatus(204);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Kunde inte byta bok för gruppen."
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
                u.display_name,
                gs.review_status,
                gs.review_updated_at,
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

router.put("/:id/students/:studentId/review", async (req, res) => {
    const { id: groupId, studentId } = req.params;
    const { review_status: reviewStatus } = req.body;
    const validStatuses = new Set(["green", "yellow", "red"]);

    if (!validStatuses.has(reviewStatus)) {
        return res.status(400).json({
            error: "Omdömet måste vara green, yellow eller red."
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [[membership]] = await connection.query(
            `
            SELECT review_status
            FROM group_students
            WHERE group_id = ?
                AND user_id = ?
                AND deleted_at IS NULL
            FOR UPDATE
            `,
            [groupId, studentId]
        );

        if (!membership) {
            await connection.rollback();
            return res.status(404).json({
                error: "Eleven finns inte i gruppen."
            });
        }

        if (membership.review_status === reviewStatus) {
            await connection.commit();
            return res.json({ review_status: reviewStatus });
        }

        await connection.query(
            `
            UPDATE group_students
            SET review_status = ?,
                review_updated_at = NOW(),
                review_updated_by = ?
            WHERE group_id = ?
                AND user_id = ?
            `,
            [reviewStatus, req.user.id, groupId, studentId]
        );

        await connection.query(
            `
            INSERT INTO group_student_review_history (
                user_id,
                group_id,
                previous_status,
                new_status,
                changed_by
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [studentId, groupId, membership.review_status, reviewStatus, req.user.id]
        );

        await connection.commit();
        res.json({ review_status: reviewStatus });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({
            error: "Kunde inte spara omdömet."
        });
    } finally {
        connection.release();
    }
});
// POST /api/groups/:id/students/bulk
router.post("/:id/students/bulk", async (req, res) => {
    try {
        const studentIds = [
            ...new Set(
                (Array.isArray(req.body?.student_ids)
                    ? req.body.student_ids
                    : []
                )
                    .map(Number)
                    .filter(Number.isInteger)
            )
        ];

        if (!studentIds.length) {
            return res.status(400).json({
                error: "Minst en elev måste väljas."
            });
        }

        const placeholders = studentIds.map(() => "?").join(", ");

        await db.query(
            `
            INSERT IGNORE INTO group_students (
                group_id,
                user_id
            )
            SELECT ?, id
            FROM users
            WHERE id IN (${placeholders})
                AND role = 'student'
                AND deleted_at IS NULL
            `,
            [req.params.id, ...studentIds]
        );

        res.status(201).json({
            imported_count: studentIds.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Kunde inte importera eleverna."
        });
    }
});

// POST /api/groups/:id/students
router.post("/:id/students", async (req, res) => {

    try {

        const {
            username,
            first_name,
            last_name,
            email
        } = req.body;

        const normalizedEmail = email?.trim() || null;

        let userId = null;
        let password = null;

        const [[existingUser]] =
            await db.query(
                `
                    SELECT id, email
                FROM users
                WHERE username = ?
                `,
                [username]
            );

        if (existingUser) {

            userId =
                existingUser.id;

            if (normalizedEmail || !existingUser.email) {
                await db.query(
                    `
                    UPDATE users
                    SET email = COALESCE(?, CONCAT(username, '@elev.ga.dbgy.se'))
                    WHERE id = ?
                    `,
                    [normalizedEmail, userId]
                );
            }

        } else {

            password =
                generatePassword();

            const password_hash =
                await bcrypt.hash(
                    password,
                    12
                );

            const [userResult] =
                await db.query(
                    `
                    INSERT INTO users (
                        username,
                        password_hash,
                        role,
                        first_name,
                        last_name,
                        email
                    )
                    VALUES (
                        ?,
                        ?,
                        'student',
                        ?,
                        ?,
                        COALESCE(?, CONCAT(?, '@elev.ga.dbgy.se'))
                    )
                    `,
                    [
                        username,
                        password_hash,
                        first_name,
                        last_name,
                        normalizedEmail,
                        username
                    ]
                );

            userId =
                userResult.insertId;

        }

        await db.query(
            `
            INSERT IGNORE INTO
                group_students
            (
                group_id,
                user_id
            )
            VALUES (?, ?)
            `,
            [
                req.params.id,
                userId
            ]
        );

        res.status(201).json({
            id: userId,
            password
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error:
                "Kunde inte skapa elev."
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

// POST /api/groups/:id/reset-passwords
router.post("/:id/reset-passwords",
    async (req, res) => {

        try {

            const [students] =
                await db.query(
                    `
                    SELECT
                        u.id,
                        u.username,
                        u.first_name,
                        u.last_name,
                        u.display_name
                    FROM users u
                    INNER JOIN group_students gs
                        ON gs.user_id = u.id
                    WHERE gs.group_id = ?
                      AND u.role = 'student'
                    ORDER BY
                        COALESCE(
                            u.display_name,
                            u.first_name
                        )
                    `,
                    [req.params.id]
                );

            const credentials = [];

            for (const student of students) {

                const password =
                    generatePassword();

                const password_hash =
                    await bcrypt.hash(
                        password,
                        12
                    );

                await db.query(
                    `
                    UPDATE users
                    SET password_hash = ?
                    WHERE id = ?
                    `,
                    [
                        password_hash,
                        student.id
                    ]
                );

                credentials.push({

                    id: student.id,

                    display_name:
                        student.display_name ||
                        student.first_name,

                    first_name:
                        student.first_name,

                    last_name:
                        student.last_name,

                    username:
                        student.username,

                    password

                });

            }

            res.json(credentials);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error:
                    "Kunde inte återställa lösenord."
            });

        }

    }
);

// POST /api/groups/:id/import-students
router.post("/:id/import-students",
    upload.single("file"),
    async (req, res) => {

        try {

            if (!req.file && !req.body?.csvText?.trim()) {
                return res.status(400).json({
                    error: "Ingen fil eller CSV-text angiven"
                });
            }

            const workbook = req.file
                ? XLSX.read(req.file.buffer)
                : XLSX.read(req.body.csvText, { type: "string" });

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(sheet);

            const imported = [];
            const skipped = [];

            const importedNames =
                new Set();

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

                const fullName =
                    `${firstName} ${lastName}`;

                if (
                    importedNames.has(fullName)
                ) {

                    skipped.push({
                        fullName,
                        reason:
                            "Förekommer flera gånger i filen"
                    });

                    continue;

                }

                importedNames.add(
                    fullName
                );

                const displayName =
                    row.Visningsnamn?.trim()
                    || null;

                const email =
                    row["E-post"]?.trim()
                    || row.Email?.trim()
                    || null;

                let username =
                    row.Användarnamn?.trim();

                if (!username) {

                    username =
                        (
                            firstName.toLowerCase() +
                            "." +
                            lastName.toLowerCase()
                        )
                        .replace(/å/g, "a")
                        .replace(/ä/g, "a")
                        .replace(/ö/g, "o")
                        .replace(/\s+/g, "");

                }

                const [[existingUser]] =
                    await db.query(
                        `
                        SELECT
                            id,
                            username,
                            email
                        FROM users
                        WHERE username = ?
                        LIMIT 1
                        `,
                        [username]
                    );

                if (existingUser) {

                    if (email || !existingUser.email) {
                        await db.query(
                            `
                            UPDATE users
                            SET email = COALESCE(?, CONCAT(username, '@elev.ga.dbgy.se'))
                            WHERE id = ?
                            `,
                            [email, existingUser.id]
                        );
                    }

                    await db.query(
                        `
                        INSERT IGNORE INTO
                            group_students
                        (
                            user_id,
                            group_id
                        )
                        VALUES (?, ?)
                        `,
                        [
                            existingUser.id,
                            req.params.id
                        ]
                    );

                    imported.push({
                        id: existingUser.id,
                        firstName,
                        lastName,
                        fullName,
                        username:
                            existingUser.username,
                        existing: true
                    });

                    continue;

                }

                const password =
                    generatePassword();

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
                            full_name,
                            display_name,
                            user_key,
                            email
                        )
                        VALUES (
                            ?,
                            ?,
                            'student',
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            COALESCE(?, CONCAT(?, '@elev.ga.dbgy.se'))
                        )
                        `,
                        [
                            username,
                            passwordHash,
                            firstName,
                            lastName,
                            fullName,
                            displayName,
                            userKey,
                            email,
                            username
                        ]
                    );

                await db.query(
                    `
                    INSERT IGNORE INTO
                        group_students
                    (
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
                    id:
                        userResult.insertId,
                    firstName,
                    lastName,
                    fullName,
                    displayName,
                    username,
                    password,
                    existing: false
                });

            }

            res.json({

                importedCount:
                    imported.length,

                skippedCount:
                    skipped.length,

                students:
                    imported,

                skipped

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Importen misslyckades"
            });

        }

    }
);

//PUT /api/groups/:id/archive
router.put("/:id/archive", async (req, res) => {
    try {

        await db.query(
            `
            UPDATE \`groups\`
            SET archived_at = NOW()
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
            UPDATE \`groups\`
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
                    sort_order,
                    priority
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    req.params.id,
                    sectionIds[i],
                    i + 1,
                    Array.isArray(req.body.prioritizedSectionIds) &&
                    req.body.prioritizedSectionIds.includes(sectionIds[i])
                        ? 1
                        : 0
                ]
            );

        }

            const [rows] =
            await db.query(
                `
                SELECT COUNT(*) AS count
                FROM group_planning_sections
                WHERE group_id = ?
                `,
                [req.params.id]
            );


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
                FROM \`groups\`
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
                    s.included_by_default,
                    s.title,

                    CASE
                        WHEN gps.id IS NULL
                        THEN s.included_by_default
                        ELSE TRUE
                    END AS selected,

                    CASE
                        WHEN gps.id IS NULL
                        THEN s.planning_priority
                        ELSE gps.priority
                    END AS priority

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
                FROM \`groups\`
                WHERE id = ?
                `,
                [groupId]
            );

        if (!group) {

            return res
                .status(404)
                .send(
                    "Gruppen hittades inte"
                );

        }

        const [lessons] =
            await db.query(
                `
                SELECT
                    l.id,
                    l.starts_at,

                    EXISTS (
                        SELECT 1
                        FROM lesson_sections ls
                        WHERE ls.lesson_id = l.id
                        AND ls.pinned = 1
                    ) AS has_pinned

                FROM lessons l

                WHERE l.group_id = ?
                AND l.cancelled_at IS NULL
                AND l.deleted_at IS NULL

                ORDER BY l.starts_at
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
        
        const queueSectionIds =
            sections.map(
                section => section.id
            );

        const [gps] =
            await db.query(
                `
                SELECT *
                FROM group_planning_sections
                WHERE group_id = ?
                `,
                [groupId]
            );

        const [pinnedSections] =
            await db.query(
                `
                SELECT
                    ls.lesson_id,
                    ls.section_id

                FROM lesson_sections ls

                JOIN lessons l
                    ON l.id = ls.lesson_id

                WHERE l.group_id = ?
                AND ls.pinned = 1

                ORDER BY l.starts_at
                `,
                [groupId]
            );

        // --------------------------------------------------
        // 1. Räkna ut hur många sidor varje sektion omfattar
        // --------------------------------------------------

        for (let i = 0; i < sections.length; i++) {
            const current = sections[i];
            const next = sections[i + 1];

            current.page_count = next
                ? Math.max(
                    1,
                    next.page_number - current.page_number
                )
                : 1;
        }


        // --------------------------------------------------
        // 2. Hitta alla pinnade sektioner och deras index
        // --------------------------------------------------

        const pinnedWithIndex = pinnedSections
            .map(pinned => {

                const sectionIndex = sections.findIndex(
                    section =>
                        section.id === pinned.section_id
                );

                const lessonIndex = lessons.findIndex(
                    lesson =>
                        lesson.id === pinned.lesson_id
                );

                return {
                    ...pinned,
                    sectionIndex,
                    lessonIndex
                };
            })
            .filter(pinned =>
                pinned.sectionIndex !== -1 &&
                pinned.lessonIndex !== -1
            )
            .sort(
                (a, b) =>
                    a.sectionIndex - b.sectionIndex
            );


        // --------------------------------------------------
        // 3. Kontrollera att pinnarna ligger i rätt ordning
        // --------------------------------------------------

        for (let i = 1; i < pinnedWithIndex.length; i++) {

            const previous =
                pinnedWithIndex[i - 1];

            const current =
                pinnedWithIndex[i];

            if (
                current.lessonIndex <
                previous.lessonIndex
            ) {
                return res
                    .status(400)
                    .send(
                        "Nålade sektioner ligger i fel ordning."
                    );
            }
        }


        // --------------------------------------------------
        // 4. Kontrollera att samma sektion inte är pinnad
        //    flera gånger
        // --------------------------------------------------

        const pinnedSectionIds =
            new Set();

        for (const pinned of pinnedWithIndex) {

            if (
                pinnedSectionIds.has(
                    pinned.section_id
                )
            ) {
                return res
                    .status(400)
                    .send(
                        "En sektion är pinnad flera gånger."
                    );
            }

            pinnedSectionIds.add(
                pinned.section_id
            );
        }


        // --------------------------------------------------
        // 5. Kontrollera att samma lektion inte har flera
        //    olika pinnade sektioner
        //
        //    Ta bort detta block om du faktiskt vill tillåta
        //    flera pinnade sektioner på samma lektion.
        // --------------------------------------------------

        const pinnedLessonIds =
            new Set();

        for (const pinned of pinnedWithIndex) {

            if (
                pinnedLessonIds.has(
                    pinned.lesson_id
                )
            ) {
                return res
                    .status(400)
                    .send(
                        "En lektion kan inte ha flera pinnade sektioner."
                    );
            }

            pinnedLessonIds.add(
                pinned.lesson_id
            );
        }


        // --------------------------------------------------
        // 6. Mål för antal sidor per lektion
        // --------------------------------------------------

        const targetPages =
            Number(group.pages_per_lesson) || 8;


        // --------------------------------------------------
        // 7. Funktion som fyller ett block
        // --------------------------------------------------

        function fillBlock(
            blockSections,
            blockLessons
        ) {

            const assignments = [];

            let lessonIndex = 0;
            let lessonPages = 0;
            let sortOrder = 1;

            for (
                const section of blockSections
            ) {

                // Finns det ingen lektion kvar?
                if (
                    lessonIndex >=
                    blockLessons.length
                ) {
                    throw new Error(
                        `Sektion ${section.id} får inte plats.`
                    );
                }


                // --------------------------------------------------
                // Om sektionen inte får plats i aktuell lektion,
                // gå vidare till nästa lektion.
                // --------------------------------------------------

                if (
                    lessonPages > 0 &&
                    lessonPages +
                        section.page_count >
                        targetPages
                ) {

                    lessonIndex++;

                    lessonPages = 0;

                    sortOrder = 1;
                }


                // Fortfarande ingen lektion?
                if (
                    lessonIndex >=
                    blockLessons.length
                ) {
                    throw new Error(
                        `Sektion ${section.id} får inte plats inom blockets lektioner.`
                    );
                }


                const lesson =
                    blockLessons[lessonIndex];


                // --------------------------------------------------
                // Placera sektionen
                // --------------------------------------------------

                assignments.push({
                    lesson_id: lesson.id,
                    section_id: section.id,
                    sort_order: sortOrder
                });


                // --------------------------------------------------
                // Uppdatera antal sidor
                // --------------------------------------------------

                lessonPages +=
                    section.page_count;

                sortOrder++;
            }

            return assignments;
        }


        // --------------------------------------------------
        // 8. Skapa block mellan pinnarna
        // --------------------------------------------------

        const blocks = [];

        let previousSectionIndex = 0;
        let previousLessonIndex = 0;


        for (
            const pinned of pinnedWithIndex
        ) {

            const pinnedSectionIndex =
                pinned.sectionIndex;

            const pinnedLessonIndex =
                pinned.lessonIndex;


            // Sektionerna FÖRE pinnen
            const blockSections =
                sections.slice(
                    previousSectionIndex,
                    pinnedSectionIndex
                );


            // Lektionerna FÖRE pinnen
            //
            // pinnedLessonIndex ingår INTE.
            // Den lektionen är reserverad för pinnen.
            const blockLessons =
                lessons.slice(
                    previousLessonIndex,
                    pinnedLessonIndex
                );


            blocks.push({
                sections: blockSections,
                lessons: blockLessons,

                pinnedSection:
                    pinned.section_id,

                pinnedLesson:
                    pinned.lesson_id
            });


            // Nästa block börjar efter pinnen
            previousSectionIndex =
                pinnedSectionIndex + 1;

            previousLessonIndex =
                pinnedLessonIndex + 1;
        }


        // --------------------------------------------------
        // 9. Sista blocket efter sista pinnen
        // --------------------------------------------------

        blocks.push({

            sections:
                sections.slice(
                    previousSectionIndex
                ),

            lessons:
                lessons.slice(
                    previousLessonIndex
                )
        });


        // --------------------------------------------------
        // 10. Ta bort alla opinnade placeringar
        // --------------------------------------------------

        await db.query(
            `
            DELETE ls
            FROM lesson_sections ls
            JOIN lessons l
                ON l.id = ls.lesson_id
            WHERE l.group_id = ?
            AND ls.pinned = 0
            `,
            [groupId]
        );


        // --------------------------------------------------
        // 11. Fyll blocken
        // --------------------------------------------------

        let sectionsPlaced = 0;

        try {

            for (
                const block of blocks
            ) {

                // Fyll blocket
                const assignments =
                    fillBlock(
                        block.sections,
                        block.lessons
                    );


                // Spara placeringarna
                for (
                    const assignment
                    of assignments
                ) {

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
                            assignment.lesson_id,
                            assignment.section_id,
                            assignment.sort_order
                        ]
                    );


                    sectionsPlaced++;
                }
            }

        } catch (error) {

            console.error(
                "Kunde inte fylla planeringen:",
                error
            );

            return res
                .status(400)
                .json({
                    error: error.message
                });
        }


        // --------------------------------------------------
        // 12. Svara
        // --------------------------------------------------

        return res.json({
            lessonsFilled:
                lessons.length,

            sectionsPlaced
        });

    }
);

// GET /api/groups/:id/classrooms
router.get("/:id/classrooms",
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT DISTINCT
                    c.id AS classroom_id,
                    c.name AS classroom_name,

                    cl.id AS layout_id,
                    cl.name AS layout_name

                FROM lessons l

                JOIN classrooms c
                    ON c.id = l.classroom_id

                LEFT JOIN classroom_layouts cl
                    ON cl.id = l.classroom_layout_id

                WHERE l.group_id = ?
                AND l.deleted_at IS NULL

                ORDER BY
                    c.name,
                    cl.name
                                `,
                [req.params.id]
            );

        const classroomMap =
            new Map();

        for (const row of rows) {

            if (
                !classroomMap.has(
                    row.classroom_id
                )
            ) {

                classroomMap.set(
                    row.classroom_id,
                    {
                        id:
                            row.classroom_id,

                        name:
                            row.classroom_name,

                        layouts: []
                    }
                );

            }

            classroomMap
                .get(row.classroom_id)
                .layouts
                .push({
                    id:
                        row.layout_id,

                    name:
                        row.layout_name
                });

        }

        res.json(
            [...classroomMap.values()]
        );

    }
);

router.get("/:groupId/seat-assignments",
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    *
                FROM group_seat_assignments
                WHERE group_id = ?
                `,
                [req.params.groupId]
            );

        res.json(rows);

    }
);

router.post("/:groupId/seat-assignments/generate",
    async (req, res) => {

        const groupId =
            req.params.groupId;

        const [existing] =
            await db.query(
                `
                SELECT id
                FROM group_seat_assignments
                WHERE group_id = ?
                LIMIT 1
                `,
                [groupId]
            );

        if (existing.length > 0) {

            return res.json({
                created: 0
            });

        }

        const [students] = await db.query(
            `
            SELECT
                u.id
            FROM group_students gs
            INNER JOIN users u
                ON u.id = gs.user_id
            WHERE gs.group_id = ?
            AND u.role = 'student'
            AND gs.deleted_at IS NULL
            ORDER BY u.last_name, u.first_name
            `,
            [groupId]
        );

        const [seats] =
            await db.query(
                `
                SELECT cs.id
                FROM classroom_seats cs
                JOIN classroom_layouts cl
                    ON cl.id = cs.layout_id
                JOIN group_schedules gs
                    ON gs.classroom_layout_id = cl.id
                WHERE gs.group_id = ?
                ORDER BY
                    cs.id
                `,
                [groupId]
            );

        const count =
            Math.min(
                students.length,
                seats.length
            );

        for (let i = 0; i < count; i++) {

            await db.query(
                `
                INSERT IGNORE INTO
                    group_seat_assignments (
                        group_id,
                        student_id,
                        classroom_seat_id,
                        pinned
                    )
                VALUES (?, ?, ?, FALSE)
                `,
                [
                    groupId,
                    students[i].id,
                    seats[i].id
                ]
            );

        }

        res.json({
            created: count
        });

    }
);

// POST /api/groups/:groupId/seat-assignments/shuffle
router.post("/:groupId/seat-assignments/shuffle",
    async (req, res) => {

        try {

            const groupId =
                req.params.groupId;

            const {
                mode = "current-seats"
            } = req.body;

            const [students] =
                await db.query(
                    `
                    SELECT
                        u.id
                    FROM group_students gs
                    INNER JOIN users u
                        ON u.id = gs.user_id
                    WHERE gs.group_id = ?
                    AND u.role = 'student'
                    AND gs.deleted_at IS NULL
                    `,
                    [groupId]
                );

            const [existingAssignments] =
                await db.query(
                    `
                    SELECT
                        student_id
                    FROM group_seat_assignments
                    WHERE group_id = ?
                    `,
                    [groupId]
                );

            const assignedStudentIds =
                new Set(
                    existingAssignments.map(
                        assignment =>
                            assignment.student_id
                    )
                );

            for (const student of students) {

                if (assignedStudentIds.has(student.id)) {
                    continue;
                }

                await db.query(
                    `
                    INSERT IGNORE INTO
                        group_seat_assignments (
                            group_id,
                            student_id,
                            classroom_seat_id,
                            pinned
                        )
                    VALUES (?, ?, NULL, FALSE)
                    `,
                    [groupId, student.id]
                );

            }

            const [assignments] =
                await db.query(
                    `
                    SELECT *
                    FROM group_seat_assignments
                    WHERE group_id = ?
                    `,
                    [groupId]
                );

            const pinned =
                assignments.filter(
                    assignment =>
                        assignment.pinned === 1
                );

            const movable =
                assignments.filter(
                    assignment =>
                        assignment.pinned !== 1
                );

            let availableSeatIds = [];

            if (mode === "current-seats") {

                availableSeatIds =
                    movable.map(
                        assignment =>
                            assignment.classroom_seat_id
                    ).filter(Boolean);

            }

            else if (mode === "all-seats") {

                const firstAssignment =
                    assignments.find(
                        assignment =>
                            assignment.classroom_seat_id
                    );

                if (!firstAssignment) {

                    return res.status(400).json({
                        error:
                            "Gruppen har inga tilldelade platser."
                    });

                }

                const [[seat]] =
                    await db.query(
                        `
                        SELECT
                            layout_id
                        FROM classroom_seats
                        WHERE id = ?
                        `,
                        [
                            firstAssignment.classroom_seat_id
                        ]
                    );

                const [seats] =
                    await db.query(
                        `
                        SELECT id
                        FROM classroom_seats
                        WHERE layout_id = ?
                        `,
                        [
                            seat.layout_id
                        ]
                    );

                const pinnedSeatIds =
                    pinned
                        .map(
                            assignment =>
                                assignment.classroom_seat_id
                        )
                        .filter(Boolean);

                availableSeatIds =
                    seats
                        .map(seat => seat.id)
                        .filter(
                            seatId =>
                                !pinnedSeatIds.includes(
                                    seatId
                                )
                        );

            }

            if (
                availableSeatIds.length <
                movable.length
            ) {

                return res.status(400).json({
                    error:
                        "Det finns inte tillräckligt många platser i klassrummet."
                });

            }

            for (
                let i =
                    availableSeatIds.length - 1;
                i > 0;
                i--
            ) {

                const j =
                    Math.floor(
                        Math.random() *
                        (i + 1)
                    );

                [
                    availableSeatIds[i],
                    availableSeatIds[j]
                ] = [
                    availableSeatIds[j],
                    availableSeatIds[i]
                ];

            }

            await db.query(
                "START TRANSACTION"
            );

            for (
                const assignment
                of movable
            ) {

                await db.query(
                    `
                    UPDATE
                        group_seat_assignments
                    SET
                        classroom_seat_id = NULL
                    WHERE id = ?
                    `,
                    [assignment.id]
                );

            }

            for (
                let i = 0;
                i < movable.length;
                i++
            ) {

                await db.query(
                    `
                    UPDATE
                        group_seat_assignments
                    SET
                        classroom_seat_id = ?
                    WHERE id = ?
                    `,
                    [
                        availableSeatIds[i],
                        movable[i].id
                    ]
                );

            }

            await db.query(
                "COMMIT"
            );

            res.json({
                success: true
            });

        } catch (error) {

            await db.query(
                "ROLLBACK"
            );

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte slumpa platser"
            });

        }

    }
);

// POST /api/groups/:groupId/seat-assignments/sync
router.post("/:groupId/seat-assignments/sync",
    async (req, res) => {

        try {

            const groupId =
                req.params.groupId;

            const [students] =
                await db.query(
                    `
                    SELECT
                        u.id
                    FROM group_students gs
                    INNER JOIN users u
                        ON u.id = gs.user_id
                    WHERE gs.group_id = ?
                    AND u.role = 'student'
                    AND gs.deleted_at IS NULL
                    `,
                    [groupId]
                );

            const [assignments] =
                await db.query(
                    `
                    SELECT
                        student_id,
                        classroom_seat_id
                    FROM group_seat_assignments
                    WHERE group_id = ?
                    `,
                    [groupId]
                );

            const assignedStudentIds =
                new Set(
                    assignments.map(
                        assignment =>
                            assignment.student_id
                    )
                );

            const assignedSeatIds =
                new Set(
                    assignments.map(
                        assignment =>
                            assignment.classroom_seat_id
                    )
                );

            const [[currentLayout]] =
                await db.query(
                    `
                    SELECT
                        cs.layout_id
                    FROM group_seat_assignments gsa

                    INNER JOIN classroom_seats cs
                        ON cs.id =
                            gsa.classroom_seat_id

                    WHERE gsa.group_id = ?

                    LIMIT 1
                    `,
                    [groupId]
                );

            if (!currentLayout) {

                return res.json({
                    added: 0
                });

            }

            const [seats] =
                await db.query(
                    `
                    SELECT
                        id
                    FROM classroom_seats
                    WHERE layout_id = ?
                    ORDER BY seat_number
                    `,
                    [
                        currentLayout.layout_id
                    ]
                );

            const missingStudents =
                students.filter(
                    student =>
                        !assignedStudentIds.has(
                            student.id
                        )
                );

            const freeSeats =
                seats.filter(
                    seat =>
                        !assignedSeatIds.has(
                            seat.id
                        )
                );

            const count =
                Math.min(
                    missingStudents.length,
                    freeSeats.length
                );

            for (
                let i = 0;
                i < count;
                i++
            ) {

                await db.query(
                    `
                    INSERT INTO
                        group_seat_assignments (
                            group_id,
                            student_id,
                            classroom_seat_id,
                            pinned
                        )
                    VALUES (
                        ?, ?, ?, 0
                    )
                    `,
                    [
                        groupId,
                        missingStudents[i].id,
                        freeSeats[i].id
                    ]
                );

            }

            res.json({
                added: count
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte synkronisera sittplatser"
            });

        }

    }
);


router.get("/:groupId/layout-snapshots",
    async (req, res) => {

        try {

            const [snapshots] =
                await db.query(
                    `
                    SELECT *
                    FROM group_layout_snapshots
                    WHERE group_id = ?
                    ORDER BY created_at DESC
                    `,
                    [
                        req.params.groupId
                    ]
                );

            res.json(
                snapshots
            );

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte hämta placeringar"
            });

        }

    }
);


router.post("/:groupId/layout-snapshots",
    async (req, res) => {

        try {

            const groupId =
                req.params.groupId;

            const {
                name
            } = req.body;

            const [result] =
                await db.query(
                    `
                    INSERT INTO
                        group_layout_snapshots (
                            group_id,
                            name
                        )
                    VALUES (
                        ?, ?
                    )
                    `,
                    [
                        groupId,
                        name
                    ]
                );

            const snapshotId =
                result.insertId;

            const [assignments] =
                await db.query(
                    `
                    SELECT
                        gsa.student_id,
                        cs.seat_number,
                        gsa.pinned
                    FROM
                        group_seat_assignments gsa

                    INNER JOIN
                        classroom_seats cs
                        ON cs.id =
                            gsa.classroom_seat_id

                    WHERE
                        gsa.group_id = ?
                    `,
                    [groupId]
                );

            for (
                const assignment
                of assignments
            ) {

                await db.query(
                    `
                    INSERT INTO
                        group_layout_snapshot_items (
                            snapshot_id,
                            student_id,
                            seat_number,
                            pinned
                        )
                    VALUES (
                        ?, ?, ?, ?
                    )
                    `,
                    [
                        snapshotId,
                        assignment.student_id,
                        assignment.seat_number,
                        assignment.pinned
                    ]
                );

            }

            res.status(201).json({
                id: snapshotId
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte spara placering"
            });

        }

    }
);

// POST /api/groups/:groupId/seat-assignments/apply-layout
router.post("/:groupId/seat-assignments/apply-layout",
    async (req, res) => {

        try {

            const groupId =
                req.params.groupId;

            const {
                layoutId
            } = req.body;

            const [assignments] =
                await db.query(
                    `
                    SELECT
                        gsa.id,
                        cs.seat_number
                    FROM group_seat_assignments gsa

                    INNER JOIN classroom_seats cs
                        ON cs.id =
                            gsa.classroom_seat_id

                    WHERE gsa.group_id = ?
                    `,
                    [groupId]
                );

            await db.query(
                "START TRANSACTION"
            );

            for (
                const assignment
                of assignments
            ) {

                const [seats] =
                    await db.query(
                        `
                        SELECT
                            id
                        FROM classroom_seats
                        WHERE layout_id = ?
                        AND seat_number = ?
                        LIMIT 1
                        `,
                        [
                            layoutId,
                            assignment.seat_number
                        ]
                    );

                if (
                    seats.length === 0
                ) {
                    continue;
                }

                await db.query(
                    `
                    UPDATE
                        group_seat_assignments
                    SET
                        classroom_seat_id = ?
                    WHERE id = ?
                    `,
                    [
                        seats[0].id,
                        assignment.id
                    ]
                );

            }

            await db.query(
                "COMMIT"
            );

            res.json({
                success: true
            });

        } catch (error) {

            await db.query(
                "ROLLBACK"
            );

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte applicera layout"
            });

        }

    }
);

// GET /api/groups/:groupId/lesson-events
router.get("/:groupId/lesson-events",
    async (req, res) => {

        const [rows] =
            await db.query(
                `
                SELECT
                    l.id AS lesson_id,

                    sse.id,
                    sse.title,
                    sse.note,
                    sse.type,
                    sse.affects_lessons

                FROM lessons l

                JOIN groups g
                    ON g.id = l.group_id

                JOIN school_schedule_exceptions sse
                    ON sse.school_id = g.school_id
                    AND sse.date =
                        DATE(l.starts_at)

                LEFT JOIN
                    schedule_exception_groups seg
                    ON seg.schedule_exception_id =
                        sse.id

                WHERE l.group_id = ?
                AND (
                    seg.group_id IS NULL
                    OR seg.group_id = ?
                )

                ORDER BY l.starts_at
                `,
                [
                    req.params.groupId,
                    req.params.groupId
                ]
            );

        res.json(rows);

    }
);

router.get("/:groupId/share-link",
    requireAuth,
    async (req, res) => {

        const [[link]] =
            await db.query(
                `
                SELECT *
                FROM planning_share_links
                WHERE group_id = ?
                AND revoked_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [req.params.groupId]
            );

        if (!link) {
            return res.json(null);
        }

        res.json({
            id: link.id,
            url:
                `${process.env.FRONTEND_URL}/shared-planning/${link.id}`
        });

    }
);

router.post("/:groupId/share-link",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE planning_share_links
            SET revoked_at = NOW()
            WHERE group_id = ?
            AND revoked_at IS NULL
            `,
            [req.params.groupId]
        );

        const shareId =
            crypto.randomUUID();

        await db.query(
            `
            INSERT INTO
                planning_share_links
            (
                id,
                group_id,
                created_by
            )
            VALUES (?, ?, ?)
            `,
            [
                shareId,
                req.params.groupId,
                req.user.id
            ]
        );

        res.json({
            id: shareId,
            url:
                `${process.env.FRONTEND_URL}/shared-planning/${shareId}`
        });

    }
);

router.delete("/share-link/:id",
    requireAuth,
    async (req, res) => {

        await db.query(
            `
            UPDATE planning_share_links
            SET revoked_at = NOW()
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.sendStatus(204);

    }
);


export default router
