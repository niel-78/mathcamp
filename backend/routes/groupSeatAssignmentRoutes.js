import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.put("/swap",
    async (req, res) => {

        try {

            const {
                assignmentId,
                targetSeatId
            } = req.body;

            const [[source]] =
                await db.query(
                    `
                    SELECT
                        classroom_seat_id
                    FROM group_seat_assignments
                    WHERE id = ?
                    `,
                    [assignmentId]
                );

            const [[target]] =
                await db.query(
                    `
                    SELECT
                        id
                    FROM group_seat_assignments
                    WHERE classroom_seat_id = ?
                    `,
                    [targetSeatId]
                );

            await db.query(
                "START TRANSACTION"
            );

            await db.query(
                `
                UPDATE group_seat_assignments
                SET classroom_seat_id = NULL
                WHERE id IN (?, ?)
                `,
                [
                    assignmentId,
                    target?.id
                ]
            );

            await db.query(
                `
                UPDATE group_seat_assignments
                SET classroom_seat_id = ?
                WHERE id = ?
                `,
                [
                    targetSeatId,
                    assignmentId
                ]
            );

            if (target) {

                await db.query(
                    `
                    UPDATE group_seat_assignments
                    SET classroom_seat_id = ?
                    WHERE id = ?
                    `,
                    [
                        source.classroom_seat_id,
                        target.id
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
                    "Kunde inte byta platser"
            });

        }

    }
);

router.put("/:assignmentId/pin",
    async (req, res) => {

        try {

            const assignmentId =
                req.params.assignmentId;

            const [[assignment]] =
                await db.query(
                    `
                    SELECT
                        pinned
                    FROM
                        group_seat_assignments
                    WHERE id = ?
                    `,
                    [assignmentId]
                );

            if (!assignment) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Placering hittades inte"
                    });

            }

            await db.query(
                `
                UPDATE
                    group_seat_assignments
                SET
                    pinned = ?
                WHERE id = ?
                `,
                [
                    assignment.pinned === 1
                        ? 0
                        : 1,
                    assignmentId
                ]
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Kunde inte uppdatera pin"
            });

        }

    }
);


export default router;