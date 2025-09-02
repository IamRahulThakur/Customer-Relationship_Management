import express from "express";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

// Routers
import authRouter from "./routes/auth.js";
import leadRouter from "./routes/lead.js";
import customerRouter from "./routes/customer.js";
import taskRouter from "./routes/task.js";
import activityRouter from "./routes/activity.js";
import userRouter from "./routes/user.js";

dotenv.config();

export const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.VITE_CLIENT_URL || "http://localhost:5173";

//  Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies

//  Routes
app.use("/api/auth", authRouter);
app.use("/api/lead", leadRouter);
app.use("/api/customers", customerRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/activity", activityRouter);
app.use("/api/users", userRouter);

//  Serve static files (like uploads, public assets)
app.use(express.static("public"));

//  Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Something went wrong!",
  });
});

//  Connect DB and start server
connectDB()
  .then(() => {
    console.log(" Database connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error(" DB connection error:", err);
  });
