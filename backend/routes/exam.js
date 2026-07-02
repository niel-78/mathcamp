import express from "express";
import requireAuth from "../middleware/auth.js";
import db from "../db.js";
import crypto from "crypto";

const router = express.Router();


// Get array with integers
function intArray(length){
  var array = [length];
  for(var i = 0; i < length; i++){
    array[i] = i + 1;
  }
  return array;
}

// Fisher-Yates shuffle
function shuffle(array) {
  const newArray = [...array]; // kopiera (viktigt i React!)
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}


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

    console.log("exam.exam_config");
    console.log(exam.exam_config);

    // ✅ 1. skapa attempt
    await connection.query(
      "INSERT INTO exam_attempts (id, user_id, exam_id, exam_config) VALUES (?, ?, ?, ?)",
      [attemptId, req.user.id, exam.id, exam.exam_config]
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

    //Eventuellt slumpa ordning på frågorna
    console.log("randomizeQuestions")
    const parsed = JSON.parse(exam.exam_config);
    console.log(parsed.randomizeQuestions)
    const randomizeQuestions = parsed.randomizeQuestions;

    var order_by = intArray(questions.length);
    
    if(randomizeQuestions){
      order_by = shuffle(order_by);
      console.log("slumpa uppgifterna")
    }

    // ✅ 3. spara frågor
    let index = 0;
    for (const q of questions) {
      await connection.query(
        "INSERT INTO attempt_questions (attempt_id, question_id,order_by) VALUES (?, ? , ?)",
        [attemptId, q.id, order_by[index++]]
      );
    }

    await connection.commit(); // ✅ COMMIT

    res.json({
      attemptId,
      exam: {
        id: exam.id,
        title: exam.title,
        examConfig: exam.exam_config
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
      ORDER BY aq.order_by ASC
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
