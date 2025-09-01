import express from "express";
import {TaskModel} from "../model/task.js";
import { userAuth } from "../middlewares/auth.js";
import { UserModel } from "../model/user.js";
import { LeadModel } from "../model/lead.js";
import { CustomerModel } from "../model/customer.js";

const taskRouter = express.Router();

/**
 * GET /api/tasks → List tasks (filters: owner, status, due)
 */
taskRouter.get("/", userAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const filters = {};

    if (role === "Agent") {
      filters.owner = req.user._id; // agents only see their own
    } else if (req.query.owner) {
      filters.owner = req.query.owner; // admins can filter by owner
    }

    if (req.query.status) filters.status = req.query.status;

    if (req.query.due === "overdue") {
      filters.dueDate = { $lt: new Date(), $ne: null };
    }

    const tasks = await TaskModel.find(filters).populate("owner", "name email");

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/tasks → Create task
 */
taskRouter.post("/", userAuth, async (req, res) => {
  try {
    const { title, dueDate, status, priority } = req.body;

    if (!title || !dueDate || !req.body.relatedTo || !req.body.owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate dueDate format
    if (isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: "Invalid dueDate format" });
    }

    // Ensure dueDate is not in the past
    if (new Date(dueDate) < new Date()) {
      return res.status(400).json({ error: "Due date must be in the future" });
    }

    // We have to set RelatedTo and RelatedModel by taking emailId
    // of Lead || Customer
    let findCustomer;
    let findLead = await LeadModel.findOne({ emailId: req.body.relatedTo });
    if (!findLead) {
      findCustomer = await CustomerModel.findOne({ emailId: req.body.relatedTo });
      if (!findCustomer) {
        return res.status(404).json({ error: "Related Lead or Customer not found" });
      }
    }

    // Here we are assigning RelatedTo & RelatedModel
    let relatedModel;
    let relatedTo;
    if (findLead) {
      relatedTo = findLead._id;
      relatedModel = "Lead";
    } else if (findCustomer) {
      relatedTo = findCustomer._id;
      relatedModel = "Customer";
    }

    // Here we are assigning Owner
    let assignedOwner;
    if (req.user.role === "Admin") {
      const findOwner = await UserModel.findOne({ emailId: req.body.owner });
      if (!findOwner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      assignedOwner = findOwner._id;
    }
    if (req.user.role === "Agent") {
      assignedOwner = req.user._id;
    }

    const task = await TaskModel.create({
      title,
      dueDate,
      status,
      priority,
      relatedTo,
      relatedModel,
      owner: assignedOwner,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * PATCH /api/tasks/:id → Update task
 */
taskRouter.patch("/:id", userAuth, async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // only Admin or owner can update
    if (req.user.role === "Agent" && task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const allowedUpdates = ["title", "dueDate", "status", "priority"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default taskRouter;