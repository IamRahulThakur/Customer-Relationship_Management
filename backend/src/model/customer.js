// model/customer.js
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    emailId: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    notes: [noteSchema],
    tags: [String],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
    isArchived: { type: Boolean, default: false }, // optional soft delete
  },
  { timestamps: true }
);

customerSchema.index({ owner: 1 });
customerSchema.index({ tags: 1 });

export const CustomerModel = mongoose.model("Customer", customerSchema);
