import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Agent"],
      default: "Agent",
      required: true,
    },
  },
  { timestamps: true }
);

// Validate password entered by User
userSchema.methods.validatePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// Creating JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { userId: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

userSchema.index({ role: 1 });

export const UserModel = mongoose.model("User", userSchema);
