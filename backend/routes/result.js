import express from "express";
import db from "../db.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/result", async (req, res) => {
    const { attemptId } = req.query;

    try {
        const [questions] = await db.query(`
            SELECT q.*
            FROM questions q
            JOIN attempt_questions aq ON q.id = aq.question_id
            WHERE aq.attempt_id = ?
        `, [attemptId]);

        
        const results = [];

        const [allOptions] = await db.query(
            `SELECT id, question_id, text, is_correct FROM options`
        );

        for (const q of questions) {

            const [answerRows] = await db.query(
                `SELECT * FROM answers WHERE attempt_id = ? AND question_id = ?`,
                [attemptId, q.id]
            );

            const answer = answerRows[0];

            let isCorrect = false;

            // ✅ default values (VIKTIGT)
            let correctIds = [];
            let userIds = [];


            let correctText = "";
            let userText = "";


            // 🟢 TEXT
            if (q.type === 1) {
                const userRaw = answer?.text_answer || "";
                userText = userRaw;

                // ✅ HÄMTA ALLA korrekta svar
                const [correctOpts] = await db.query(
                    `SELECT text FROM options WHERE question_id = ? AND is_correct = 1`,
                    [q.id]
                );

                // ✅ LISTA med alla korrekta svar
                const correctList = correctOpts.map(o => o.text);

                // ✅ visa som text i UI
                correctText = correctList.join(" / ");
s
                // ✅ NORMALIZE
                const normalize = (str) => {
                    return str
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .replace(/−/g, "-")
                    .replace(/,/g, ".")
                    .trim();
                };

                const userNormalized = normalize(userRaw);

                // ✅ MATCHA mot ALLA rätta svar
                isCorrect = correctList.some(
                    c => normalize(c) === userNormalized
                );
            }



            // 🔵 SINGLE
            if (q.type === 2) {
                const [correctOpt] = await db.query(
                `SELECT id FROM options WHERE question_id = ? AND is_correct = 1`,
                [q.id]
                );

                const [userOpt] = await db.query(
                `SELECT option_id FROM answer_options WHERE answer_id = ?`,
                [answer?.id]
                );

                correctIds = correctOpt.map(o => o.id);
                userIds = userOpt.map(o => o.option_id);

                isCorrect = correctIds[0] === userIds[0];

            }

            // 🟣 MULTI
            if (q.type === 3) {
                const [correctOpts] = await db.query(
                `SELECT id FROM options WHERE question_id = ? AND is_correct = 1`,
                [q.id]
                );

                const [userOpts] = await db.query(
                `SELECT option_id FROM answer_options WHERE answer_id = ?`,
                [answer?.id]
                );

                correctIds = correctOpts.map(o => o.id).sort();
                userIds = userOpts.map(o => o.option_id).sort();

                isCorrect =
                JSON.stringify(correctIds) === JSON.stringify(userIds);

            }


            const optionMap = allOptions.filter(o => o.question_id === q.id);

            results.push({
                question_id: q.id,
                type: q.type,
                correct: isCorrect,
                correctOptions: correctIds,
                userOptions: userIds,
                options: optionMap,
                correctText,
                userText
            });

        }

        res.json({ results });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


router.get("/latest-attempt", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(`
            SELECT *
            FROM exam_attempts
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [userId]);

        return res.json({ attempt: rows[0] });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


export default router;
