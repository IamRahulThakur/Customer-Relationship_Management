import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["New", "In Progress", "Closed Won", "Closed Lost"],
      default: "New",
    },
    source: { 
        type: String 
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    isArchived: {
        type: Boolean,
        default: false
    }
},
{ timestamps: true }
);

leadSchema.index({ assignedAgent: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

export const LeadModel = mongoose.model("Lead", leadSchema);
