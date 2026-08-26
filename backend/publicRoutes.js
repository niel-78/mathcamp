import db from "../db.js";

router.get("/planning/:linkId",
    async (req, res) => {

        const [[link]] =
            await db.query(
                `
                SELECT *
                FROM planning_share_links
                WHERE id = ?
                AND revoked_at IS NULL
                `,
                [req.params.linkId]
            );

        if (!link) {
            return res.sendStatus(404);
        }

        const [lessons] =
            await db.query(
                `
                SELECT *
                FROM lessons
                WHERE group_id = ?
                ORDER BY starts_at
                `,
                [link.group_id]
            );

        res.json({
            lessons
        });

    }
);