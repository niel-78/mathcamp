import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";


const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});

/*
GET    /api/subjects
POST   /api/subjects

GET    /api/subjects/:id
PUT    /api/subjects/:id
DELETE /api/subjects/:id

GET    /api/subjects/:id/central-content
*/

// GET /api/subjects
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

                ca.id          AS area_id,
                ca.title       AS area_title,
                ca.sort_order  AS area_sort_order,

                cc.id          AS content_id,
                cc.content     AS content_text,
                cc.sort_order  AS content_sort_order

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
                    areas: []
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
                    sort_order:
                        row.content_sort_order
                });

            }

        }

        const [competencies] = await db.query(`
            SELECT DISTINCT
                cd.level_id,
                c.id,
                c.name
            FROM competency_descriptors cd
            INNER JOIN competencies c
                ON c.id = cd.competency_id
            ORDER BY c.id
        `);

        const [descriptors] = await db.query(`
            SELECT
                cd.id,
                cd.level_id,
                cd.competency_id,
                cd.grade,
                cd.description
            FROM competency_descriptors cd
            ORDER BY
                cd.competency_id,
                FIELD(cd.grade, 'E', 'C', 'A')
        `);

        const descriptorsByCompetency = {};

        descriptors.forEach(desc => {

            const key =
                `${desc.level_id}-${desc.competency_id}`;

            if (!descriptorsByCompetency[key]) {
                descriptorsByCompetency[key] = [];
            }

            descriptorsByCompetency[key].push({
                id: desc.id,
                grade: desc.grade,
                description: desc.description
            });

        });

        const competenciesByLevel = {};

        competencies.forEach(comp => {

            if (!competenciesByLevel[comp.level_id]) {
                competenciesByLevel[comp.level_id] = [];
            }

            competenciesByLevel[comp.level_id].push({
                id: comp.id,
                name: comp.name
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
                    JOIN books b
                        ON b.id = lb.book_id
                    WHERE lb.level_id = ?
                    ORDER BY b.title
                    `,
                    [level.id]
                );

                level.books = books;

                level.competencies =
                    (competenciesByLevel[level.id] || [])
                        .map(comp => ({

                            ...comp,

                            descriptors:
                                descriptorsByCompetency[
                                    `${level.id}-${comp.id}`
                                ] || []

                        }));

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


router.post("/:id/import-criteria",
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

            let imported = 0;

            for (const row of rows) {

                const levelId =
                    row.LevelId;

                const competencyName =
                    row.Förmåga?.trim();

                const grade =
                    row.Betyg?.trim();

                const description =
                    row.Beskrivning?.trim();

                if (
                    !levelId ||
                    !competencyName ||
                    !grade ||
                    !description
                ) {
                    continue;
                }

                const [[competency]] =
                    await db.query(
                        `
                        SELECT id
                        FROM competencies
                        WHERE name = ?
                        `,
                        [competencyName]
                    );

                if (!competency) {
                    continue;
                }

                await db.query(
                    `
                    INSERT INTO competency_descriptors (
                        level_id,
                        competency_id,
                        grade,
                        description
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        levelId,
                        competency.id,
                        grade,
                        description
                    ]
                );

                imported++;

            }

            res.json({
                importedCount: imported
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);

export default router;