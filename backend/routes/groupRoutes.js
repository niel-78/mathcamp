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

GET    /api/groups/:id/group-assessments

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

        groups.forEach(group => {

            group.sections =
                sectionsByBook[group.book_id] || [];

            group.abilities =
                abilitiesByLevel[group.level_id] || [];

        });

    }

    res.json(groups);

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
        INSERT INTO groups (
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
            gp.role
        FROM groups g

        INNER JOIN group_permissions gp
            ON gp.group_id = g.id

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
                    s.included_by_default,
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

        const [rows] = await db.query(
            `
            SELECT DISTINCT
                c.id AS classroom_id,
                c.name AS classroom_name,

                cl.id AS layout_id,
                cl.name AS layout_name

            FROM group_schedules gs

            INNER JOIN classrooms c
                ON c.id = gs.classroom_id

            INNER JOIN classroom_layouts cl
                ON cl.id =
                    gs.classroom_layout_id

            WHERE gs.group_id = ?

            ORDER BY
                c.name,
                cl.name
            `,
            [req.params.id]
        );

        const classrooms = [];

        for (const row of rows) {

            let classroom =
                classrooms.find(
                    c =>
                        c.id ===
                        row.classroom_id
                );

            if (!classroom) {

                classroom = {
                    id:
                        row.classroom_id,

                    name:
                        row.classroom_name,

                    layouts: []
                };

                classrooms.push(
                    classroom
                );

            }

            classroom.layouts.push({
                id: row.layout_id,
                name: row.layout_name
            });

        }

        res.json(classrooms);

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

            const availableSeatIds =
                movable.map(
                    assignment =>
                        assignment.classroom_seat_id
                );

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
router.post(
    "/:groupId/seat-assignments/sync",
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



export default router
