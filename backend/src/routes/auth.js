import express from "express";
import { UserModel } from "../model/user.js";
import { validateSignupData } from "../utils/validation.js";
import bcrypt from "bcrypt";
import { userAuth } from "../middlewares/auth.js";

const authRouter = express.Router();

authRouter.post("/register", userAuth, async (req, res) => {
  // Validate signup data
  try {
    const User = req.user;
    if (User.role !== "Admin") {
      return res.status(403).send({ error: "Only Admins can create users" });
    }

    // Validating the user input
    await validateSignupData(req);

    // Encrypt the password
    const { emailId, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creating a new user
    const user = new UserModel({
      name,
      emailId,
      password: hashedPassword,
      role,
    });
    console.log("User Created: ", user);
    await user.save();
    res.send({
      message: "User created successfully",
    });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { emailId, password } = req.body;

  try {
    // Find user by email and Validating correct User
    const user = await UserModel.findOne({ emailId });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT Token
    const token = await user.getJwtToken();
    // Add Token to cookie and send response back to user
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        emailId: user.emailId,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

authRouter.post("/refresh", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const token = await user.getJwtToken();
    // Add Token to cookie and send response back to user
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: "Token refreshed successfully",
      user: {
        id: user._id,
        name: user.name,
        emailId: user.emailId,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).send({ err: err.message });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Getting all Users
authRouter.get("/users", userAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Only admins can access user list" });
    }
    
    const users = await UserModel.find({}, { password: 0 }); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default authRouter;
