import express from "express";
import db from "../db.js";
import hydrateBlocks from "../utils/hydrateBlocks.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

/*
GET    /api/exam-attempts/:id

POST   /api/exam-attempts

PUT    /api/exam-attempts/:id

POST   /api/exam-attempts/:id/start
POST   /api/exam-attempts/:id/submit

GET    /api/exam-attempts/:id/results
*/


export default router
