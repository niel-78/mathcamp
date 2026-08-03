import multer from "multer";
import path from "path";
import express from "express";
import db from "../db.js";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import generatePassword from "../utils/generatePassword.js";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("teacher", "admin"));

//GET /teachers/all
router.get("/teachers/all", async (req, res) => {

    const [rows] = await db.query(
        `
        SELECT
            id,
            username,
            first_name,
            last_name
        FROM users
        WHERE role = 'teacher'
        ORDER BY
            last_name,
            first_name
        `
    );

    res.json(rows);
});


export default router