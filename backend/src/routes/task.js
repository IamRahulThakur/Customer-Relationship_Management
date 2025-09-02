import express from "express";
import { TaskModel } from "../model/task.js";
import { userAuth } from "../middlewares/auth.js";
import { UserModel } from "../model/user.js";
import { LeadModel } from "../model/lead.js";
import { CustomerModel } from "../model/customer.js";
import { ActivityModel } from "../model/activity.js";
import { validateSignupData } from "../utils/validation.js";

const taskRouter = express.Router();

/**
 * GET /api/tasks → List tasks (filters: owner, status, due)
 */
taskRouter.get("/", userAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const filters = {};
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (role === "Agent") {
      filters.owner = req.user._id;
    } else if (req.query.owner) {
      filters.owner = req.query.owner;
    }

    if (req.query.status) filters.status = req.query.status;

    if (req.query.due === "overdue") {
      filters.dueDate = { $lt: new Date(), $ne: null };
      filters.status = { $ne: "Done" }; // Only show overdue if not done
    }

    const tasks = await TaskModel.find(filters)
      .populate("owner", "name emailId")
      .populate("relatedTo", "name emailId")
      .skip(skip)
      .limit(limit)
      .sort({ dueDate: 1 });

    const totalTasks = await TaskModel.countDocuments(filters);
    const totalPages = Math.ceil(totalTasks / limit);

    res.json({
      tasks,
      pagination: {
        page,
        totalPages,
        totalTasks,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
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

    if (!title || !dueDate || !req.body.relatedTo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate dueDate format but don't reject past dates
    if (isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: "Invalid dueDate format" });
    }

    // Find related entity by email
    let findCustomer;
    let findLead = await LeadModel.findOne({ emailId: req.body.relatedTo });
    if (!findLead) {
      findCustomer = await CustomerModel.findOne({ emailId: req.body.relatedTo });
      if (!findCustomer) {
        return res.status(404).json({ error: "Related Lead or Customer not found" });
      }
    }

    // Assign RelatedTo & RelatedModel
    let relatedModel;
    let relatedTo;
    if (findLead) {
      relatedTo = findLead._id;
      relatedModel = "Lead";
    } else if (findCustomer) {
      relatedTo = findCustomer._id;
      relatedModel = "Customer";
    }

    // Assign Owner
    let assignedOwner;
    if (req.user.role === "Admin") {
      if (!req.body.owner) {
        return res.status(400).json({ error: "Owner is required for Admin" });
      }
      const findOwner = await UserModel.findOne({ emailId: req.body.owner });
      if (!findOwner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      assignedOwner = findOwner._id;
    } else if (req.user.role === "Agent") {
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

    await ActivityModel.create({
      action: "Task Created",
      entity: "Task",
      performedBy: req.user,
      details: {
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority
      },
    });

    // Populate the task before returning it
    const populatedTask = await TaskModel.findById(task._id)
      .populate("owner", "name emailId")
      .populate("relatedTo", "name emailId");

    res.status(201).json(populatedTask);
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
    if (
      req.user.role === "Agent" &&
      task.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const allowedUpdates = ["title", "dueDate", "status", "priority"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await ActivityModel.create({
      action: "Task Updated",
      entity: "Task",
      performedBy: req.user,
      details: { changes: req.body },
    });

    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default taskRouter;
