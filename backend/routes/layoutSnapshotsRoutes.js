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

router.post(
    "/layout-snapshots/:snapshotId/restore",
    async (req, res) => {

        try {

            const snapshotId =
                req.params.snapshotId;

            const [items] =
                await db.query(
                    `
                    SELECT
                        student_id,
                        classroom_seat_id,
                        pinned
                    FROM
                        group_layout_snapshot_items
                    WHERE
                        snapshot_id = ?
                    `,
                    [snapshotId]
                );

            await db.query(
                "START TRANSACTION"
            );

            for (
                const item
                of items
            ) {

                await db.query(
                    `
                    UPDATE
                        group_seat_assignments
                    SET
                        classroom_seat_id = ?,
                        pinned = ?
                    WHERE
                        student_id = ?
                    `,
                    [
                        item.classroom_seat_id,
                        item.pinned,
                        item.student_id
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
                    "Kunde inte återställa placering"
            });

        }

    }
);

export default router;