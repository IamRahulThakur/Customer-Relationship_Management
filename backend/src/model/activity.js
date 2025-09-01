import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    action: { 
        type: String, 
        required: true 
    }, // e.g. "Lead Created", "Task Updated"
    entity: { 
        type: String, 
        required: true 
    }, // Lead / Customer / Deal / Task
    entityId: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: "entity" 
    },
    performedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },
    details: { 
        type: Object 
    }, // optional metadata like { oldStatus, newStatus }
  },
  { timestamps: true }
);

export const ActivityModel = mongoose.model("Activity", activitySchema);
