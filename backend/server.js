import express from "express";
import path from "path";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exam.js";
import answersRoutes from "./routes/answers.js";
import eventsRoutes from "./routes/events.js";
import resultRoutes from "./routes/result.js";
import subjectRoute from "./routes/subjectRoute.js";
import bookRoutes from "./routes/bookRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js"
import teacherExamRoutes from "./routes/teacherExamRoutes.js";
import teacherGroupRoutes from "./routes/teacherGroupRoutes.js";
import teacherStudentRoutes from "./routes/teacherStudentRoutes.js";
import teacherBlocksRoutes from "./routes/teacherBlocksRoutes.js";
import cors from "cors";

console.log("🔥 SERVER FILE START");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.1.115:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));


app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", examRoutes);
app.use("/api", answersRoutes)
app.use("/api", eventsRoutes);
app.use("/api", resultRoutes);
app.use("/api", subjectRoute);
app.use("/api/sections",sectionRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/teacher/exams", teacherExamRoutes);
app.use("/api/teacher/groups", teacherGroupRoutes);
app.use("/api/teacher/students", teacherStudentRoutes);
app.use("/api/teacher/blocks", teacherBlocksRoutes);




app.use(
  "/uploads",
  express.static("uploads")
);

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 SERVER STARTED ON 0.0.0.0");
});



