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
      return res.status(400).json({ error: "Missing group exam key" });
    }

    const [groupExams] = await connection.query(
      "SELECT * FROM group_exams WHERE group_exam_key = ?",
      [examKey]
    );

    if (groupExams.length === 0) {
      return res.status(404).json({ error: "Group exam not found" });
    }

    const groupExam = groupExams[0];
    const attemptId = crypto.randomUUID();


    // ✅ 1. skapa attempt
    await connection.query(
      "INSERT INTO exam_attempts (id, user_id, group_exam_id) VALUES (?, ?, ?)",
      [attemptId, req.user.id, groupExam.id]
    );

    // ✅ 2. slumpa frågor
    const [questions] = await connection.query(
      `
        SELECT
            q.id,
            ge.shuffle_questions,
            ge.shuffle_options,
            ge.time_limit_minutes
        FROM questions q
        JOIN (
            SELECT block_id, MIN(id) AS id
            FROM (
                SELECT block_id, id
                FROM questions
                ORDER BY RAND()
            ) shuffled
            GROUP BY block_id
        ) picked ON q.id = picked.id
        JOIN exam_blocks eb ON q.block_id = eb.block_id
        JOIN group_exams ge ON ge.exam_id = eb.exam_id
        WHERE ge.id = ?
      `,
      [groupExam.id]
    );

    //Eventuellt slumpa ordning på frågorna
    //console.log("randomizeQuestions")
    //const parsed = JSON.parse(groupExam.exam_config);
    //console.log(parsed.randomizeQuestions)
    //const randomizeQuestions = parsed.randomizeQuestions;

    var order_by = intArray(questions.length);
    /*
    if(randomizeQuestions){
      order_by = shuffle(order_by);
      console.log("slumpa uppgifterna")
    }*/

    // ✅ 3. spara frågor
    let index = 0;
    for (const q of questions) {
      await connection.query(
        "INSERT INTO attempt_questions (attempt_id, question_id,order_by) VALUES (?, ? , ?)",
        [attemptId, q.id, order_by[index++]]
      );
      console.log("skapar attempt_question");
    }

    await connection.commit(); // ✅ COMMIT

    res.json({
      attemptId,
      exam: {
        id: groupExam.id,
        title: groupExam.title,
        examConfig: groupExam.exam_config
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
