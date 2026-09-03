import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

const upload = multer({
    storage: multer.memoryStorage()
});


//GET /api/abilities
router.get("/", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM abilities
        WHERE deleted_at IS NULL
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

// POST /api/abilities/
router.post("/", async (req, res) => {

    const {
        name,
        seriesId
    } = req.body;

    if (!seriesId || !name?.trim()) {

        return res.status(400).json({
            error: "Serie och namn krävs"
        });

    }

    const [result] =
        await db.query(
            `
            INSERT INTO abilities (
                series_id,
                name,
                created_by,
                updated_by
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                seriesId,
                name,
                req.user.id,
                req.user.id
            ]
        );

    res.status(201).json({
        id: result.insertId,
        name,
        series_id: seriesId
    });

});

//PUT /api/abilities/:id
router.put("/:id", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE abilities
        SET
            name = ?,
            updated_by = ?
            WHERE id = ?
        `,
        [
            name,
            req.user.id,
            req.params.id
        ]
    );

    res.sendStatus(204);

});
//DELETE /api/abilities/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        UPDATE abilities
        SET deleted_at = NOW()
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

            const replaceExisting =
                req.body.replaceExisting === "true";

            if (replaceExisting) {

                await db.query(
                    `
                    DELETE FROM abilities
                    WHERE series_id = ?
                    `,
                    [req.body.seriesId]
                );

            }

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
                        series_id,
                        name
                    )
                    VALUES (?, ?)
                    `,
                    [
                        req.body.seriesId,
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

router.get("/import-template",
    requireAuth,
    requireRole("super"),
    async (req, res) => {

        const workbook =
            XLSX.utils.book_new();

        const worksheet =
            XLSX.utils.json_to_sheet([
                {
                    Förmåga: "Problemlösning"
                },
                {
                    Förmåga: "Begreppsförståelse"
                },
                {
                    Förmåga: "Metodförmåga"
                }
            ]);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Förmågor"
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
            'attachment; filename="formagor-mall.xlsx"'
        );

        res.send(buffer);
    }
);


export default router;