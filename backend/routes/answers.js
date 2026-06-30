import express from "express";
import db from "../db.js";

const router = express.Router();

console.log("🔥 answers route loaded");

router.post("/answers", async (req, res) => {
  const { attempt_id, question_id, answer } = req.body;

  try {
    // ✅ 1. TEXT → endast om string
    const textAnswer =
      typeof answer === "string" ? answer : null;

    // ✅ 2. INSERT + UPDATE
    await db.execute(
      `INSERT INTO answers (question_id, text_answer, attempt_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE text_answer = ?`,
      [question_id, textAnswer, attempt_id, textAnswer]
    );

    // ✅ 3. ALLTID hämta answerId (robust)
    const [rows] = await db.execute(
      `SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?`,
      [attempt_id, question_id]
    );

    const answerId = rows[0]?.id;

    // 🚨 extra säkerhet
    if (!answerId) {
      console.error("❌ answerId missing", {
        attempt_id,
        question_id,
        answer
      });

      return res.status(500).json({
        error: "answerId not found"
      });
    }

    // ✅ 4. rensa gamla val
    await db.execute(
      `DELETE FROM answer_options WHERE answer_id = ?`,
      [answerId]
    );

    // ✅ 5. MULTI
    if (Array.isArray(answer)) {


      // ✅ först skapa unik array
      const unique = [...new Set(answer)];

      // ✅ sedan loopa över den
      for (const optId of unique) {
        if (typeof optId !== "number") continue;

        await db.execute(
          `INSERT IGNORE INTO answer_options (answer_id, option_id)
          VALUES (?, ?)`,
          [answerId, optId]
        );
      }

    }

    // ✅ 6. SINGLE
    else if (typeof answer === "number") {
      await db.execute(
        `INSERT INTO answer_options (answer_id, option_id)
         VALUES (?, ?)`,
        [answerId, answer]
      );
    }

    console.log("✅ Saved!");
    return res.json({ ok: true });

  } catch (err) {
    console.error("🔥 REAL ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});


// ✅ debug endpoint
router.get("/answers", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM answers");
  return res.json(rows);
});

export default router;
