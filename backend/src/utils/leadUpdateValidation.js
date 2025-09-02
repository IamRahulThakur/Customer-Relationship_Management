// utils/leadValidation.js
import validator from "validator";
import { LeadModel } from "../model/lead.js";

export const leadUpdateValidator = async (req) => {
  const { emailId, name, phone } = req.body;

  if (!emailId || !name || !phone) {
    throw new Error("Name, Email and Phone are required");
  }

  if (!validator.isEmail(emailId)) {
    throw new Error("Invalid email format");
  }

};
