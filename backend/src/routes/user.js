// File: backend/routes/users.js (Add this to your backend)
import express from "express";
import { UserModel } from "../model/user.js";
import { userAuth } from "../middlewares/auth.js";

const userRouter = express.Router();

// GET /api/users - Get all users (Admin only)
userRouter.get("/", userAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Only admins can access user list" });
    }
    
    const users = await UserModel.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:id - Update user (Admin only)
userRouter.patch("/:id", userAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Only admins can update users" });
    }

    const { name, emailId, role } = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { name, emailId, role },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
userRouter.delete("/:id", userAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Only admins can delete users" });
    }

    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default userRouter;