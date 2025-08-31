import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    emailId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String
    },
    source: {
      type: String
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    leadId: {   // to keep track of the original lead
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead"
    }
  },
  { timestamps: true }
);

export const CustomerModel = mongoose.model("Customer", customerSchema);
