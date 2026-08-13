import express from "express";
import path from "path";

import authRoutes from "./routes/authRoutes.js";

import appSettingsRoutes from "./routes/appSettingsRoutes.js";

import archiveRoutes from "./routes/archiveRoutes.js";

import schoolSettingsRoutes from "./routes/schoolSettingsRoutes.js";

import userRoutes from "./routes/userRoutes.js";

import subjectRoutes from "./routes/subjectRoutes.js";

import lessonRoutes from "./routes/lessonRoutes.js";

import abilitiesRoutes from "./routes/abilitiesRoutes.js";
import blockPointRoutes from "./routes/blockPointRoutes.js";

import blockRoutes from "./routes/blockRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import questionLevelRoutes from "./routes/questionLevelRoutes.js";

import examRoutes from "./routes/examRoutes.js";
import groupExamRoutes from "./routes/groupExamRoutes.js";
import examAttemptRoutes from "./routes/examAttemptRoutes.js";

import groupRoutes from "./routes/groupRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

import bookRoutes from "./routes/bookRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";

import eventRoutes from "./routes/eventRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";

import groupExamLobbyRoutes from "./routes/groupExamLobbyRoutes.js";

import cors from "cors";

console.log("SERVER FILE START");

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

app.use("/api/auth", authRoutes);

app.use("/api/app-settings",appSettingsRoutes);

app.use("/api/archive",archiveRoutes);

app.use("/api/school-settings",schoolSettingsRoutes);

app.use("/api/users", userRoutes);

app.use("/api/subjects", subjectRoutes)

app.use("/api/lessons", lessonRoutes);

app.use("/api/abilities", abilitiesRoutes);
app.use("/api/block-points", blockPointRoutes);


app.use("/api/blocks", blockRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/question-levels", questionLevelRoutes);

app.use("/api/exams", examRoutes);
app.use("/api/group-exams", groupExamRoutes);
app.use("/api/exam-attempts", examAttemptRoutes);

app.use("/api/groups", groupRoutes);
app.use("/api/students", studentRoutes);

app.use("/api/books", bookRoutes);
app.use("/api/sections", sectionRoutes);

app.use("/api/group-exam-lobby", groupExamLobbyRoutes);

app.use("/api/results", resultRoutes);
app.use("/api/events", eventRoutes);


app.use(
  "/uploads",
  express.static("uploads")
);

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 SERVER STARTED ON 0.0.0.0");
});



