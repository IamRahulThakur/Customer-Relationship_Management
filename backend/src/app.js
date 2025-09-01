import express from "express";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import cors from 'cors';
import leadRouter from "./routes/lead.js";
import customerRouter from "./routes/customer.js";
import taskRouter from "./routes/task.js";


export const app = express();

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser()); // Middleware to parse cookies


app.use('/api/auth', authRouter);
app.use('/api/lead', leadRouter);
app.use('/api/customers', customerRouter);
app.use('/api/tasks', taskRouter);



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});


app.use(express.static('/public'));

connectDB()
  .then(() => {
    console.log("Database connected");
    app.listen(3000, () => console.log("Server running"));

  })
  .catch(err => {
    console.error("DB connection error:", err);
  });

