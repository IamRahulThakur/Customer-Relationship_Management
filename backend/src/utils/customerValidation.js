// utils/leadValidation.js
import validator from "validator";
import { LeadModel } from "../model/lead.js";

export const customerValidator = async (req) => {
  const { emailId, name } = req.body;

  if (!emailId || !name ) {
    throw new Error("Name, Email and Phone are required");
  }

  if (!validator.isEmail(emailId)) {
    throw new Error("Invalid email format");
  }

  const existingLead = await LeadModel.findOne({ emailId });
  if (existingLead) {
    throw new Error("Customer already exists");
  }
};
