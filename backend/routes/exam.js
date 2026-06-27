
import express from "express";
import requireAuth from "../middleware/auth.js";
import db from "../db.js";
import crypto from "crypto";

const router = express.Router();

router.post("/start-exam", requireAuth, async (req, res) => {
  try {
    const { examKey } = req.body;

    if (!examKey) {
      return res.status(400).json({ error: "Missing exam key" });
    }

    const [exams] = await db.query(
      "SELECT * FROM exams WHERE exam_key = ?",
      [examKey]
    );

    if (exams.length === 0) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const exam = exams[0];

    const attemptId = crypto.randomUUID();

    await db.query(
      "INSERT INTO exam_attempts (id, user_id, exam_id) VALUES (?, ?, ?)",
      [attemptId, req.user.id, exam.id]
    );

    res.json({
      attemptId,
      exam: {
        id: exam.id,
        title: exam.title
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;   // ✅ VIKTIG RAD
