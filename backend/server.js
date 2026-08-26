import express from "express";

import publicRoutes from "./routes/publicRoutes.js";

import authRoutes from "./routes/authRoutes.js";

import appSettingsRoutes from "./routes/appSettingsRoutes.js";

import archiveRoutes from "./routes/archiveRoutes.js";

import schoolRoutes from "./routes/schoolRoutes.js";
import schoolSettingsRoutes from "./routes/schoolSettingsRoutes.js";

import userRoutes from "./routes/userRoutes.js";

import subjectRoutes from "./routes/subjectRoutes.js";
import levelRoutes from "./routes/levelRoutes.js";

import lessonRoutes from "./routes/lessonRoutes.js";
import groupSchedulesRoutes from "./routes/groupSchedulesRoutes.js";

import abilitySeriesRoutes from "./routes/abilitySeriesRoutes.js";
import abilitiesRoutes from "./routes/abilitiesRoutes.js";

import blockPointRoutes from "./routes/blockPointRoutes.js";

import blockRoutes from "./routes/blockRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import questionLevelRoutes from "./routes/questionLevelRoutes.js";

import assessmentRoutes from "./routes/assessmentRoutes.js";
import groupAssessmentRoutes from "./routes/groupAssessmentRoutes.js";
import assessmentAttemptRoutes from "./routes/assessmentAttemptRoutes.js";

import groupRoutes from "./routes/groupRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

import bookRoutes from "./routes/bookRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";

import resultRoutes from "./routes/resultRoutes.js";

import groupAssessmentLobbyRoutes from "./routes/groupAssessmentLobbyRoutes.js";

import presentationRoutes from "./routes/presentationRoutes.js";

import classroomRoutes from "./routes/classroomRoutes.js";
import classroomLayoutRoutes from "./routes/classroomLayoutRoutes.js";
import classroomSeatRoutes from "./routes/classroomSeatRoutes.js";

import groupSeatAssignmentRoutes from "./routes/groupSeatAssignmentRoutes.js";

import eventRoutes from "./routes/eventRoutes.js";

import cors from "cors";

import logSystemError from "./helpers/logSystemError.js"

console.log("SERVER FILE START");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.1.115:5173",

  "http://85.190.97.203",
  "https://85.190.97.203",

  "http://mathcamp.one",
  "https://mathcamp.one",

  "http://www.mathcamp.one",
  "https://www.mathcamp.one"
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

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

app.use("/api/public", publicRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/app-settings",appSettingsRoutes);

app.use("/api/archive",archiveRoutes);

app.use("/api/schools",schoolRoutes);
app.use("/api/school-settings",schoolSettingsRoutes);

app.use("/api/users", userRoutes);

app.use("/api/subjects", subjectRoutes)
app.use("/api/levels", levelRoutes)

app.use("/api/lessons", lessonRoutes);
app.use("/api/group-schedules", groupSchedulesRoutes);

app.use("/api/ability-series", abilitySeriesRoutes);
app.use("/api/abilities", abilitiesRoutes);

app.use("/api/block-points", blockPointRoutes);

app.use("/api/blocks", blockRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/question-levels", questionLevelRoutes);

app.use("/api/assessments", assessmentRoutes);
app.use("/api/group-assessments", groupAssessmentRoutes);
app.use("/api/assessment-attempts", assessmentAttemptRoutes);

app.use("/api/groups", groupRoutes);
app.use("/api/students", studentRoutes);

app.use("/api/books", bookRoutes);
app.use("/api/sections", sectionRoutes);

app.use("/api/group-assessment-lobby", groupAssessmentLobbyRoutes);

app.use("/api/presentations", presentationRoutes);

app.use("/api/classrooms", classroomRoutes);
app.use("/api/classroom-layouts", classroomLayoutRoutes);
app.use("/api/classroom-seats", classroomSeatRoutes);
app.use("/api/group-seat-assignments", groupSeatAssignmentRoutes);

app.use("/api/results", resultRoutes);
app.use("/api/events", eventRoutes);

app.use(
  "/uploads",
  express.static("uploads")
);

app.use(async (error, req, res, next) => {

    console.error("GLOBAL ERROR:");
    console.error(error);

    await logSystemError({
        source: req.originalUrl,
        error
    });

    res.status(500).json({
        message: "Internt serverfel"
    });

});

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 SERVER STARTED ON 0.0.0.0");
});



