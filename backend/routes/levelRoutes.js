import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

// POST /api/levels/
router.post("/",
    requireAuth,
    requireRole("super"),
    async (req, res) => {

        const {
            subjectId,
            code,
            name
        } = req.body;

        const [result] =
            await db.query(
                `
                INSERT INTO levels (
                    subject_id,
                    code,
                    name
                )
                VALUES (?, ?, ?)
                `,
                [
                    subjectId,
                    code,
                    name
                ]
            );

        res.json({
            id: result.insertId
        });

    }
);

// POST /api/levels/:id/import-criteria
router.post("/:id/import-criteria",
    requireAuth,
    requireRole("super"),
    upload.single("file"),
    async (req, res) => {

        try {

            const levelId = req.params.id;

            if (!req.file) {

                return res.status(400).json({
                    error: "Ingen fil uppladdad"
                });

            }

            const replaceExisting =
                req.body.replaceExisting === "true";

            const workbook = XLSX.read(
                req.file.buffer
            );

            if (replaceExisting) {

                await db.query(
                    `
                    DELETE FROM competency_descriptors
                    WHERE level_id = ?
                    `,
                    [levelId]
                );

            }

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(sheet);

            let imported = 0;
            let skipped = 0;

            for (const row of rows) {

                const competencyName =
                    row.Förmåga?.trim();

                const grade =
                    row.Betyg?.trim();

                const description =
                    row.Beskrivning?.trim();

                if (
                    !competencyName ||
                    !grade ||
                    !description
                ) {
                    skipped++;
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

                    console.log(
                        `Förmåga saknas: ${competencyName}`
                    );

                    skipped++;
                    continue;
                }

                const [[existing]] =
                    await db.query(
                        `
                        SELECT id
                        FROM competency_descriptors
                        WHERE level_id = ?
                        AND competency_id = ?
                        AND grade = ?
                        `,
                        [
                            levelId,
                            competency.id,
                            grade
                        ]
                    );

                if (existing) {

                    skipped++;
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
                importedCount: imported,
                skippedCount: skipped
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);

// POST /api/levels/:id/import-central-content
router.post("/:id/import-central-content",
    requireAuth,
    requireRole("super"),
    upload.single("file"),
    async (req, res) => {

        try {

            const levelId =
                req.params.id;

            if (!req.file) {

                return res.status(400).json({
                    error: "Ingen fil uppladdad"
                });

            }

            const replaceExisting =
                req.body.replaceExisting === "true";

            if (replaceExisting) {

                await db.query(
                    `
                    DELETE cc
                    FROM central_content cc
                    INNER JOIN content_areas ca
                        ON ca.id = cc.area_id
                    WHERE ca.level_id = ?
                    `,
                    [levelId]
                );

                await db.query(
                    `
                    DELETE FROM content_areas
                    WHERE level_id = ?
                    `,
                    [levelId]
                );

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
            let skipped = 0;

            for (const row of rows) {

                const areaTitle =
                    row.Område?.trim();

                const content =
                    row.Innehåll?.trim();

                if (
                    !areaTitle ||
                    !content
                ) {

                    skipped++;
                    continue;

                }

                let areaId;

                const [[existingArea]] =
                    await db.query(
                        `
                        SELECT id
                        FROM content_areas
                        WHERE level_id = ?
                        AND title = ?
                        `,
                        [
                            levelId,
                            areaTitle
                        ]
                    );

                if (existingArea) {

                    areaId =
                        existingArea.id;

                } else {

                    const [areaResult] =
                        await db.query(
                            `
                            INSERT INTO content_areas (
                                level_id,
                                title,
                                sort_order
                            )
                            VALUES (
                                ?,
                                ?,
                                (
                                    SELECT
                                        COALESCE(
                                            MAX(sort_order),
                                            0
                                        ) + 1
                                    FROM content_areas
                                    WHERE level_id = ?
                                )
                            )
                            `,
                            [
                                levelId,
                                areaTitle,
                                levelId
                            ]
                        );

                    areaId =
                        areaResult.insertId;

                }

                const [[existingContent]] =
                    await db.query(
                        `
                        SELECT id
                        FROM central_content
                        WHERE area_id = ?
                        AND content = ?
                        `,
                        [
                            areaId,
                            content
                        ]
                    );

                if (
                    existingContent
                ) {

                    skipped++;
                    continue;

                }

                const [[maxSort]] =
                    await db.query(
                        `
                        SELECT
                            COALESCE(
                                MAX(sort_order),
                                0
                            ) AS maxSort
                        FROM central_content
                        WHERE area_id = ?
                        `,
                        [areaId]
                    );

                await db.query(
                    `
                    INSERT INTO central_content (
                        area_id,
                        content,
                        sort_order
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        areaId,
                        content,
                        maxSort.maxSort + 1
                    ]
                );

                imported++;

            }

            res.json({
                importedCount:
                    imported,
                skippedCount:
                    skipped
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    error.message
            });

        }

    }
);

router.get("/criteria-template",
    requireAuth,
    requireRole("super"),
    async (req, res) => {

        const workbook =
            XLSX.utils.book_new();

        const worksheet =
            XLSX.utils.json_to_sheet([
                {
                    LevelId: 1,
                    Förmåga: "Problemlösning",
                    Betyg: "E",
                    Beskrivning:
                        "Eleven kan lösa enkla problem."
                },
                {
                    LevelId: 1,
                    Förmåga: "Problemlösning",
                    Betyg: "C",
                    Beskrivning:
                        "Eleven kan lösa problem på ett utvecklat sätt."
                },
                {
                    LevelId: 1,
                    Förmåga: "Problemlösning",
                    Betyg: "A",
                    Beskrivning:
                        "Eleven kan lösa problem på ett välutvecklat sätt."
                }
            ]);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Kriterier"
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
            'attachment; filename="kriterier-mall.xlsx"'
        );

        res.send(buffer);
    }
);

router.get("/central-content-template",
    requireAuth,
    requireRole("super"),
    async (req, res) => {

        const workbook =
            XLSX.utils.book_new();

        const worksheet =
            XLSX.utils.json_to_sheet([
                {
                    Område: "Taluppfattning",
                    Innehåll:
                        "Naturliga tal och deras egenskaper."
                },
                {
                    Område: "Taluppfattning",
                    Innehåll:
                        "Rationella tal och deras användning."
                },
                {
                    Område: "Algebra",
                    Innehåll:
                        "Variabler och algebraiska uttryck."
                }
            ]);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Centralt innehåll"
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
            'attachment; filename="centralt-innehall-mall.xlsx"'
        );

        res.send(buffer);
    }
);


export default router;