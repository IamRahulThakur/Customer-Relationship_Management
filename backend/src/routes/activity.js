import express from "express";
import { userAuth } from "../middlewares/auth.js";
import { ActivityModel } from "../model/activity.js";

const activityRouter = express.Router();

// GET latest activity logs
activityRouter.get("/", userAuth, async (req, res) => {
  try {
    const activities = await ActivityModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("performedBy", "name email");
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default activityRouter;
