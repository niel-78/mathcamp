import express from "express";
import db from "../db.js";

const router = express.Router();

/*
GET    /api/subjects
POST   /api/subjects

GET    /api/subjects/:id
PUT    /api/subjects/:id
DELETE /api/subjects/:id

GET    /api/subjects/:id/central-content
*/

// GET /api/subjects
// router.get("/", async (req, res) => {

//     try {

//         const [rows] = await db.query(`
//             SELECT
//                 s.id   AS subject_id,
//                 s.code AS subject_code,
//                 s.name AS subject_name,

//                 l.id   AS level_id,
//                 l.code AS level_code,
//                 l.name AS level_name,

//                 ca.id          AS area_id,
//                 ca.title       AS area_title,
//                 ca.sort_order  AS area_sort_order,

//                 cc.id          AS content_id,
//                 cc.content     AS content_text,
//                 cc.sort_order  AS content_sort_order

//             FROM subjects s

//             LEFT JOIN levels l
//                 ON l.subject_id = s.id

//             LEFT JOIN content_areas ca
//                 ON ca.level_id = l.id

//             LEFT JOIN central_content cc
//                 ON cc.area_id = ca.id

//             ORDER BY
//                 s.name,
//                 l.name,
//                 ca.sort_order,
//                 cc.sort_order
//         `);

//         const subjects = [];

//         for (const row of rows) {

//             let subject = subjects.find(
//                 s => s.id === row.subject_id
//             );

//             if (!subject) {

//                 subject = {
//                     id: row.subject_id,
//                     code: row.subject_code,
//                     name: row.subject_name,
//                     levels: []
//                 };

//                 subjects.push(subject);

//             }

//             let level = subject.levels.find(
//                 l => l.id === row.level_id
//             );

//             if (!level && row.level_id) {

//                 level = {
//                     id: row.level_id,
//                     code: row.level_code,
//                     name: row.level_name,
//                     books: [],
//                     areas: []
//                 };

//                 subject.levels.push(level);

//             }

//             if (!level) {
//                 continue;
//             }

//             let area = level.areas.find(
//                 a => a.id === row.area_id
//             );

//             if (!area && row.area_id) {

//                 area = {
//                     id: row.area_id,
//                     title: row.area_title,
//                     sort_order: row.area_sort_order,
//                     centralContent: []
//                 };

//                 level.areas.push(area);

//             }

//             if (area && row.content_id) {

//                 area.centralContent.push({
//                     id: row.content_id,
//                     content: row.content_text,
//                     sort_order:
//                         row.content_sort_order
//                 });

//             }

//         }

//         // Lägg till böcker på respektive level

//         for (const subject of subjects) {

//             // for (const level of subject.levels) {

//             //     const [books] = await db.query(
//             //         `
//             //         SELECT
//             //             b.id,
//             //             b.title

//             //         FROM level_books lb

//             //         JOIN books b
//             //             ON b.id = lb.book_id

//             //         WHERE lb.level_id = ?

//             //         ORDER BY b.title
//             //         `,
//             //         [level.id]
//             //     );

//             //     level.books = books;

//             // }

//         }

//         const [competencies] = await db.query(
//             `
//             SELECT
//                 lc.level_id,

//                 c.id,
//                 c.name

//             FROM level_competencies lc

//             INNER JOIN competencies c
//                 ON c.id = lc.competency_id

//             ORDER BY c.name
//             `
//         );

//         const [descriptors] = await db.query(
//             `
//             SELECT
//                 cd.id,
//                 cd.level_id,
//                 cd.competency_id,
//                 cd.grade,

//                 ga.id AS ability_id,
//                 ga.name AS ability_name

//             FROM competency_descriptors cd

//             INNER JOIN grading_abilities ga
//                 ON ga.id = cd.grading_ability_id

//             ORDER BY
//                 ga.name,
//                 cd.grade
//             `
//         );


//         const descriptorsByCompetency = {};

//         descriptors.forEach(desc => {

//             const key =
//                 `${desc.level_id}-${desc.competency_id}`;

//             if (!descriptorsByCompetency[key]) {
//                 descriptorsByCompetency[key] = [];
//             }

//             descriptorsByCompetency[key].push({
//                 id: desc.id,
//                 grade: desc.grade,
//                 abilityName: desc.ability_name
//             });

//         });

//         const competenciesByLevel = {};

//         competencies.forEach(comp => {

//             if (!competenciesByLevel[comp.level_id]) {
//                 competenciesByLevel[comp.level_id] = [];
//             }

//             competenciesByLevel[comp.level_id].push({
//                 id: comp.id,
//                 name: comp.name
//             });

//         });

//         for (const subject of subjects) {

//             for (const level of subject.levels) {

//                 const [books] = await db.query(
//                     `
//                     SELECT
//                         b.id,
//                         b.title
//                     FROM level_books lb
//                     JOIN books b
//                         ON b.id = lb.book_id
//                     WHERE lb.level_id = ?
//                     ORDER BY b.title
//                     `,
//                     [level.id]
//                 );

//                 level.books = books;

//                 level.competencies =
//                     (competenciesByLevel[level.id] || [])
//                         .map(comp => ({

//                             ...comp,

//                             descriptors:
//                                 descriptorsByCompetency[
//                                     `${level.id}-${comp.id}`
//                                 ] || []

//                         }));

//             }

//         }

//         console.log(
//             JSON.stringify(
//                 subjects[0],
//                 null,
//                 2
//             )
//         );

//         res.json(subjects);

//     } catch (error) {

//         console.error(error);

//         res.status(500).json({
//             error: error.message
//         });

//     }

// });
router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                s.id   AS subject_id,
                s.code AS subject_code,
                s.name AS subject_name,

                l.id   AS level_id,
                l.code AS level_code,
                l.name AS level_name,

                ca.id         AS area_id,
                ca.title      AS area_title,
                ca.sort_order AS area_sort_order,

                cc.id         AS content_id,
                cc.content    AS content_text,
                cc.sort_order AS content_sort_order

            FROM subjects s

            LEFT JOIN levels l
                ON l.subject_id = s.id

            LEFT JOIN content_areas ca
                ON ca.level_id = l.id

            LEFT JOIN central_content cc
                ON cc.area_id = ca.id

            ORDER BY
                s.name,
                l.name,
                ca.sort_order,
                cc.sort_order
        `);

        const subjects = [];

        for (const row of rows) {

            let subject = subjects.find(
                s => s.id === row.subject_id
            );

            if (!subject) {

                subject = {
                    id: row.subject_id,
                    code: row.subject_code,
                    name: row.subject_name,
                    levels: []
                };

                subjects.push(subject);

            }

            let level = subject.levels.find(
                l => l.id === row.level_id
            );

            if (!level && row.level_id) {

                level = {
                    id: row.level_id,
                    code: row.level_code,
                    name: row.level_name,
                    books: [],
                    areas: [],
                    gradingAbilities: {}
                };

                subject.levels.push(level);

            }

            if (!level) {
                continue;
            }

            let area = level.areas.find(
                a => a.id === row.area_id
            );

            if (!area && row.area_id) {

                area = {
                    id: row.area_id,
                    title: row.area_title,
                    sort_order: row.area_sort_order,
                    centralContent: []
                };

                level.areas.push(area);

            }

            if (area && row.content_id) {

                area.centralContent.push({
                    id: row.content_id,
                    content: row.content_text,
                    sort_order: row.content_sort_order
                });

            }

        }

        const [descriptors] = await db.query(`
            SELECT
                cd.id,
                cd.level_id,
                cd.competency_id,
                cd.grade,
                cd.description,

                ga.id   AS ability_id,
                ga.name AS ability_name,

                c.name  AS competency_name

            FROM competency_descriptors cd

            INNER JOIN grading_abilities ga
                ON ga.id = cd.grading_ability_id

            INNER JOIN competencies c
                ON c.id = cd.competency_id

            ORDER BY
                ga.name,
                cd.grade,
                c.name
        `);

        const abilitiesByLevel = {};

        descriptors.forEach(desc => {

            if (!abilitiesByLevel[desc.level_id]) {
                abilitiesByLevel[desc.level_id] = {};
            }

            if (
                !abilitiesByLevel[
                    desc.level_id
                ][
                    desc.ability_name
                ]
            ) {

                abilitiesByLevel[
                    desc.level_id
                ][
                    desc.ability_name
                ] = {
                    E: [],
                    C: [],
                    A: []
                };

            }

            abilitiesByLevel[
                desc.level_id
            ][
                desc.ability_name
            ][
                desc.grade
            ].push({
                id: desc.competency_id,
                name: desc.competency_name,
                descriptorId: desc.id,
                description: desc.description
            });

        });

        for (const subject of subjects) {

            for (const level of subject.levels) {

                const [books] = await db.query(
                    `
                    SELECT
                        b.id,
                        b.title

                    FROM level_books lb

                    INNER JOIN books b
                        ON b.id = lb.book_id

                    WHERE lb.level_id = ?

                    ORDER BY b.title
                    `,
                    [level.id]
                );

                level.books = books;

                level.gradingAbilities =
                    abilitiesByLevel[level.id] || {};

            }

        }

        res.json(subjects);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});
// POST /api/subjects

// GET /api/subjects/:id

// PUT /api/subjects/:id

// DELETE /api/subjects/:id

// GET /api/subjects/:id/central-content

export default router;