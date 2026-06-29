import express from "express";
import requireAuth from "../middleware/auth.js";
import db from "../db.js";
import crypto from "crypto";

const router = express.Router();

router.post("/start-exam", requireAuth, async (req, res) => {
  console.log("start exam påbörjas");

  const connection = await db.getConnection(); // ✅ viktigt

  try {
    await connection.beginTransaction(); // ✅ START TRANSACTION

    const { examKey } = req.body;

    if (!examKey) {
      return res.status(400).json({ error: "Missing exam key" });
    }

    const [exams] = await connection.query(
      "SELECT * FROM exams WHERE exam_key = ?",
      [examKey]
    );

    if (exams.length === 0) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const exam = exams[0];
    const attemptId = crypto.randomUUID();

    // ✅ 1. skapa attempt
    await connection.query(
      "INSERT INTO exam_attempts (id, user_id, exam_id) VALUES (?, ?, ?)",
      [attemptId, req.user.id, exam.id]
    );

    // ✅ 2. slumpa frågor
    const [questions] = await connection.query(
      `
      SELECT q.id
      FROM questions q
      JOIN (
        SELECT block_id, MIN(id) as id
        FROM (
          SELECT block_id, id
          FROM questions
          ORDER BY RAND()
        ) shuffled
        GROUP BY block_id
      ) picked ON q.id = picked.id
      JOIN exam_blocks eb ON q.block_id = eb.block_id
      WHERE eb.exam_id = ?
      `,
      [exam.id]
    );

    // ✅ 3. spara frågor
    for (const q of questions) {
      await connection.query(
        "INSERT INTO attempt_questions (attempt_id, question_id) VALUES (?, ?)",
        [attemptId, q.id]
      );
    }

    await connection.commit(); // ✅ COMMIT

    res.json({
      attemptId,
      exam: {
        id: exam.id,
        title: exam.title
      }
    });

  } catch (err) {
    await connection.rollback(); // ✅ rollback om fel
    console.log("❌ ERROR:", err);
    res.status(500).json({ error: err.message });

  } finally {
    connection.release(); // ✅ släpp connection
  }
});





router.get("/questions", requireAuth, async (req, res) => {
  try {
    const { attemptId } = req.query;

    if (!attemptId) {
      return res.status(400).json({ error: "Missing attemptId" });
    }

    // ✅ hämta frågor
    const [questions] = await db.query(`
      SELECT q.*
      FROM questions q
      JOIN attempt_questions aq ON q.id = aq.question_id
      WHERE aq.attempt_id = ?
    `, [attemptId]);

    // ✅ hämta ALLA options
    const [options] = await db.query(`
      SELECT * FROM options
    `);

    // ✅ kombinera ALLT i ett steg
    const finalQuestions = questions.map(q => ({
      ...q,
      math_config: q.math_config
        ? JSON.parse(q.math_config)
        : null,
      options: options.filter(o => o.question_id === q.id)
    }));

    // ✅ EN res.json
    return res.json({ questions: finalQuestions });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});



const saveAnswer = async (questionId) => {
  await fetch(`${API_URL}/api/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token")
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      question_id: questionId,
      answer: answers[questionId]
    })
  });
};


export default router;   // ✅ VIKTIG RAD
