import express from "express";
import db from "../db.js";

const router = express.Router();

/*
GET    /api/question-levels
GET    /api/question-levels/:id
POST   /api/question-levels
PUT    /api/question-levels/:id
DELETE /api/question-levels/:id
*/


// GET /api/question-levels
router.get("/", async (req, res) => {

    try {

        const [levels] = await db.query(`
            SELECT *
            FROM question_levels
            ORDER BY sort_order
        `);

        res.json(levels);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


export default router;