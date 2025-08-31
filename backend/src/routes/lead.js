// routes/lead.routes.js
import express from "express";
import { userAuth } from "../middlewares/auth.js";
import { UserModel } from "../model/user.js";
import { LeadModel } from "../model/lead.js";

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

    if (req.user.role === "Admin") {
      if (!assignedAgent) {
        return res.status(400).json({ error: "assignedAgent is required" });
      }
      const agent = await UserModel.findOne({ emailId: assignedAgent, role: "Agent" });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      assignedAgentId = agent._id;
    } else if (req.user.role === "Agent") {
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
      const agent = await UserModel.findOne({ emailId: req.query.assignedAgent, role: "Agent" });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      filters.assignedAgent = agent._id;
    }

    const leads = await LeadModel.find(filters)
      .populate("assignedAgent", "name emailId role") // populate agent details
      .sort({ createdAt: -1 }); // latest first

    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


leadRouter.get('/:leadId' , userAuth, async (req, res) => {
  try {
    const {userRole} = req.user.role;
    res.send(userRole);

    const lead = await LeadModel.findById(req.params.leadId)
    .populate("assignedAgent", "name emailId role");
    if(userRole !== "Agent") {
      res.send(lead);
    }
    else {
      if(req.user._id === lead.assignedAgent._id) {
        res.send(lead);
      } else {
        res.status(403).json({ error: "Not allowed" });
      }
    }
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
})

export default leadRouter;
