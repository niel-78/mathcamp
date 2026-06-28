import express from "express";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exam.js";
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

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 SERVER STARTED ON 0.0.0.0");
});



setInterval(() => {
  console.log("⏳ alive");
}, 3000);





