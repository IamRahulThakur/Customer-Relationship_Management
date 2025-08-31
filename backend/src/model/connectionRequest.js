import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: '{VALUE} is not a valid status'
        },
        default: "pending",
        required: true
    },
}, {
    timestamps: true,
});


// Making Indexing to make it fast
connectionRequestSchema.index({ fromUserId: 1 , toUserId: 1 });

// Ye hamne 1 middleware banaya hai to MongoDB m hi check kr lega
// save krne se phle then we have calles next()
connectionRequestSchema.pre("save", function (next) {
    const connectionRequest = this;
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        throw new Error("can't send connection request to yoourself !!")
    }
    next();
})

const ConnectionRequestModel = mongoose.model(
    "ConnectionRequest", 
    connectionRequestSchema
);

export { ConnectionRequestModel };