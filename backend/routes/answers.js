
import express from "express";
import db from "../db.js";

const router = express.Router();

console.log("🔥 answers route loaded");

router.post("/answers", async (req, res) => {
    console.log("🔥 /api/answers HIT");

    const { attempt_id, question_id, answer } = req.body;

    console.log("BODY:", req.body);

    try {
        // ✅ 1. skapa / uppdatera answer
        const [result] = await db.execute(
            `INSERT INTO answers (question_id, text_answer, attempt_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE text_answer = ?`,
            [
                question_id,
                typeof answer === "string" ? answer : null,
                attempt_id,
                typeof answer === "string" ? answer : null
            ]
        );

        let answerId = result.insertId;

        // ✅ Om duplicate (update), hämta befintligt id
        if (!answerId) {
        const [rows] = await db.execute(
            `SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?`,
            [attempt_id, question_id]
        );
        
        answerId = rows[0]?.id;

        if (!answerId) {
        throw new Error("answerId not found");
        }

        }

        // ✅ 2. Rensa gamla val (för single & multi)
        await db.execute(
            `DELETE FROM answer_options WHERE answer_id = ?`,
            [answerId]
        );

    // ✅ 3. Spara val beroende på typ
    if (Array.isArray(answer)) {
        // 🔵 MULTI
        for (const optId of answer) {
            await db.execute(
                `INSERT INTO answer_options (answer_id, option_id)
                VALUES (?, ?)`,
                [answerId, optId]
            );
        }

    } else if (typeof answer === "number") {
        // 🟢 SINGLE
        await db.execute(
            `INSERT INTO answer_options (answer_id, option_id)
            VALUES (?, ?)`,
            [answerId, answer]
        );
    }

    console.log("✅ Saved!");
    res.json({ ok: true });

    } catch (err) {
        console.error("🔥 REAL ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});



router.get("/answers", async (req, res) => {
    const [rows] = await db.query("SELECT * FROM answers");
    res.json(rows);
});


export default router;
