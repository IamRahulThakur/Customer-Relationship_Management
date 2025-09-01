import express from "express";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.js";
import leadRouter from "./routes/lead.js";
import customerRouter from "./routes/customer.js";
import taskRouter from "./routes/task.js";
import activityRouter from "./routes/activity.js";
import userRouter from "./routes/user.js";

export const app = express();

// ✅ Allow frontend connection (change port based on frontend framework)
app.use(
  cors({
    origin: "http://localhost:5173", // if using Vite; use 3001 if CRA
    credentials: true,
  })
);

app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/lead", leadRouter);
app.use("/api/customers", customerRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/activity", activityRouter);
app.use("/api/users", userRouter);

// ✅ Serve static files (like uploads, public assets)
app.use(express.static("public"));

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Connect DB and start server
connectDB()
  .then(() => {
    console.log("Database connected");
    app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
