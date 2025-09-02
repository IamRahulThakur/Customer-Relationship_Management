// routes/lead.routes.js
import express from "express";
import { userAuth } from "../middlewares/auth.js";
import { UserModel } from "../model/user.js";
import { LeadModel } from "../model/lead.js";
import {CustomerModel} from "../model/customer.js";
import {leadValidator} from "../utils/leadValidation.js";

const leadRouter = express.Router();

/**
 * POST /api/leads
 * Admin: can assign lead to any agent using email
 * Agent: lead is auto-assigned to themselves
 */
leadRouter.post("/", userAuth, async (req, res) => {
  try {
    const { name, emailId, phone, source, assignedAgent } = req.body;
    let assignedAgentId;

    await leadValidator(req);
    if (req.user.role === "Admin") {
      if (!assignedAgent) {
        return res.status(400).json({ error: "assignedAgent is required" });
      }
      const agent = await UserModel.findOne({
        emailId: assignedAgent,
        role: "Agent",
      });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      assignedAgentId = agent._id;
    } else if (req.user.role === "Agent") {
      if (req.body.assignedAgent && req.body.assignedAgent !== req.user.emailId) {
        return res.status(403).json({ error: "Agents can only assign leads to themselves" });
      }
      assignedAgentId = req.user._id;
    } else {
      return res.status(403).json({ error: "Not allowed" });
    }

    const lead = await LeadModel.create({
      name,
      emailId,
      phone,
      source,
      assignedAgent: assignedAgentId,
    });

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


leadRouter.get("/", userAuth, async (req, res) => {
  try {
    const filters = {};

    // Role-based filter
    if (req.user.role === "Agent") {
      filters.assignedAgent = req.user._id;
    }

    // Optional filters
    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.isArchived !== undefined) {
      filters.isArchived = req.query.isArchived === "true";
    }

    if (req.user.role === "Admin" && req.query.assignedAgent) {
      const agent = await UserModel.findOne({
        emailId: req.query.assignedAgent,
        role: "Agent",
      });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      filters.assignedAgent = agent._id;
    }

    // Search by name or email (case-insensitive)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i"); // i → case-insensitive
      filters.$or = [{ name: searchRegex }, { emailId: searchRegex }, { phone: searchRegex }];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalLeads = await LeadModel.countDocuments(filters);
    const leads = await LeadModel.find(filters)
      .populate("assignedAgent", "name emailId role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      page,
      limit,
      totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      leads,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


leadRouter.get("/:leadId", userAuth, async (req, res) => {
  try {
    const userRole = req.user.role;

    const lead = await LeadModel.findById(req.params.leadId).populate(
      "assignedAgent",
      "name emailId role"
    );

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (userRole !== "Agent") {
      res.send(lead);
    } else {
      if (
        lead.assignedAgent &&
        req.user._id.toString() === lead.assignedAgent._id.toString()
      ) {
        res.send(lead);
      } else {
        res.status(403).json({ error: "Not allowed" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


leadRouter.patch("/:leadId", userAuth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const lead = await LeadModel.findById(req.params.leadId);

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    await leadValidator(req);
    // Agent can only update their own leads
    if (
      userRole === "Agent" &&
      (!lead.assignedAgent ||
        lead.assignedAgent.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Admin and user who has assigned can only change assignedAgent
    if (
      req.body.assignedAgent &&
      (userRole === "Admin" ||
        (lead.assignedAgent &&
          lead.assignedAgent.toString() === req.user._id.toString()))
    ) {
      const agent = await UserModel.findOne({
        emailId: req.body.assignedAgent,
        role: "Agent",
      });
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      req.body.assignedAgent = agent._id;
    }

    // Optional: Validate status
    if (
      req.body.status &&
      !["New", "In Progress", "Closed Won", "Closed Lost"].includes(
        req.body.status
      )
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedLead = await LeadModel.findByIdAndUpdate(
      req.params.leadId,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


leadRouter.delete("/:leadId", userAuth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const lead = await LeadModel.findById(req.params.leadId);

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Permission check
    if (userRole === "Agent" && (!lead.assignedAgent || lead.assignedAgent.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Admin can delete any lead
    // Agent can delete only their own lead (already checked above)
    const updatedLead = await LeadModel.findByIdAndUpdate(
      req.params.leadId,
      { isArchived: true },
      { new: true }
    );

    res.status(200).json(updatedLead);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


leadRouter.post("/:leadId/convert", userAuth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const lead = await LeadModel.findById(req.params.leadId);

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Only Admin or assigned Agent can convert
    if (
      userRole === "Agent" &&
      (!lead.assignedAgent || lead.assignedAgent.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Create customer from lead
    const customer = await CustomerModel.create({
      name: lead.name,
      emailId: lead.emailId,
      phone: lead.phone,
      owner: lead.assignedAgent, // owner is the agent
      notes: [],
      tags: [],
      deals: []
    });

    // Optional: archive the lead
    lead.isArchived = true;
    await lead.save();

    res.status(201).json({
      message: "Lead converted to customer successfully",
      customer
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default leadRouter;
