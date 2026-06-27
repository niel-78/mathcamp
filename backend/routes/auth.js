
import express from "express";

const router = express.Router();

router.post("/login", (req, res) => {
  console.log("✅ LOGIN HIT");
  res.json({ works: true });
});

export default router;
