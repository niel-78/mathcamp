import express from "express";
import db from "../db.js";
import multer from "multer";
import XLSX from "xlsx";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import getAbilitySeriesPermission from "../utils/getAbilitySeriesPermission.js";


const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher","super"));

const upload = multer({
    storage: multer.memoryStorage()
});

// GET /api/ability-series
router.get("/", requireAuth, async (req, res) => {

    let series;

    if (req.user.role === "super") {

        [series] = await db.query(`
            SELECT
                s.*,
                sub.name AS subject_name
            FROM ability_series s
            INNER JOIN subjects sub
                ON sub.id = s.subject_id
            ORDER BY s.name
        `);

    } else {

        [series] = await db.query(`
            SELECT
                s.*,
                sub.name AS subject_name
            FROM ability_series s
            INNER JOIN subjects sub
                ON sub.id = s.subject_id
            WHERE
                s.visibility = 'global'
                OR (
                    s.visibility = 'private'
                    AND s.created_by = ?
                )
            ORDER BY s.name
        `, [req.user.id]);

    }

    for (const item of series) {

        item.permission =
            await getAbilitySeriesPermission(
                item.id,
                req.user.id
            );

        const [abilities] =
            await db.query(
                `
                SELECT *
                FROM abilities
                WHERE series_id = ?
                ORDER BY name
                `,
                [item.id]
            );

        item.abilities = abilities;

    }

    res.json(series);

});

// GET /api/ability-series:id
router.get("/:id", async (req, res) => {

    const [[series]] = await db.query(
        `
        SELECT *
        FROM ability_series
        WHERE id = ?
        `,
        [req.params.id]
    );

    if (!series) {

        return res.status(404).json({
            error: "Serien hittades inte"
        });

    }

    res.json(series);

});

// POST /api/ability-series/:id
router.post("/", async (req, res) => {

    const {
        subjectId,
        name,
        visibility,
        userId
    } = req.body;

    const [result] =
        await db.query(
            `
            INSERT INTO ability_series (
                subject_id,
                name,
                visibility,
                created_by,
                updated_by
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                subjectId,
                name,
                visibility || "private",
                userId,
                userId
            ]
        );

    await db.query(
        `
        INSERT INTO ability_series_permissions (
            series_id,
            teacher_id,
            role
        )
        VALUES (?, ?, 'owner')
        `,
        [
            result.insertId,
            userId
        ]
    );

    res.status(201).json({
        id: result.insertId
    });

});

// PUT /api/ability-series/:id
router.put("/:id", async (req, res) => {

    const { name } = req.body;

    await db.query(
        `
        UPDATE ability_series
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

// DELETE /api/ability-series/:id
router.delete("/:id", async (req, res) => {

    await db.query(
        `
        DELETE
        FROM ability_series
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.sendStatus(204);

});


export default router;