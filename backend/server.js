
import express from "express";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exam.js";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", examRoutes);

app.listen(3000, () => {
  console.log("🚀 SERVER STARTED");
});




