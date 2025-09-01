import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    dueDate: { 
      type: Date, 
      required: true 
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Done"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel", // Dynamic reference (Lead/Customer)
      required: true,
    },
    relatedModel: {
      type: String,
      enum: ["Lead", "Customer"], // Identify whether it's linked to Lead or Customer
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
  },
  { timestamps: true }
);

export const TaskModel = mongoose.model("Task", taskSchema);