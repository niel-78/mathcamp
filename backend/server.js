
import express from "express";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(express.json());

// ✅ detta MÅSTE finnas
app.use("/api", authRoutes);

app.listen(3000, () => {
  console.log("🚀 SERVER STARTED");
});




