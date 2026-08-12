import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});


//GET /api/abilities
router.get("/", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM abilities
        ORDER BY name
        `
    );

    res.json(rows);

});

//GET /api/abilities/:id
router.get("/:id", async (req, res) => {

    const [[ability]] = await db.query(
        `
        SELECT *
        FROM abilities
        WHERE id = ?
        `,
        [req.params.id]
    );

    if (!ability) {

        return res.status(404).json({
            error: "Förmågan hittades inte"
        });

    }

    res.json(ability);

});

//POST /api/abilities/
router.post("/", async (req, res) => {

    const {
        name,
        subjectId
    } = req.body;

    const [result] =
        await db.query(
            `
            INSERT INTO abilities (
                name,
                subject_id
            )
            VALUES (?, ?)
            `,
            [
                name,
                subjectId
            ]
        );

    res.status(201).json({
        id: result.insertId,
        name,
        subject_id: subjectId
    });

});

//PUT /api/abilities/:id
router.put("/:id", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE abilities
        SET name = ?
        WHERE id = ?
        `,
        [
            name,
            req.params.id
        ]
    );

    res.sendStatus(204);

});

//DELETE /api/abilities/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        DELETE
        FROM abilities
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.sendStatus(204);

});

//DELETE /api/abilities/import
router.post("/import",
    upload.single("file"),
    async (req, res) => {

        try {

            const workbook =
                XLSX.read(
                    req.file.buffer
                );

            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(
                    sheet
                );

            let createdCount = 0;

            for (const row of rows) {

                const name =
                    row.Förmåga ||
                    row.Name ||
                    row.name;

                if (!name) {
                    continue;
                }

                await db.query(
                    `
                    INSERT INTO abilities (
                        subject_id,
                        name
                    )
                    VALUES (?, ?)
                    `,
                    [
                        req.body.subjectId,
                        name
                    ]
                );

                createdCount++;

            }

            res.json({
                success: true,
                createdCount
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Import failed"
            });

        }

    }
);


export default router;