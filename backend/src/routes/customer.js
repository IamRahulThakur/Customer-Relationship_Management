// routes/customer.routes.js
import express from "express";
import { userAuth } from "../middlewares/auth.js";
import { CustomerModel } from "../model/customer.js";
import { UserModel } from "../model/user.js";

const customerRouter = express.Router();

/**
 * GET /api/customers
 * List/search customers with pagination, filters, and role-based access
 */
customerRouter.get("/", userAuth, async (req, res) => {
  try {
    const filters = {};

    // Role-based access
    if (req.user.role === "Agent") {
      filters.owner = req.user._id;
    }

    // Optional filters
    if (req.query.isArchived !== undefined) {
      filters.isArchived = req.query.isArchived === "true";
    }

    if (req.query.tags) {
      filters.tags = { $in: req.query.tags.split(",") };
    }

    if (req.user.role === "Admin" && req.query.ownerEmail) {
      const owner = await UserModel.findOne({ emailId: req.query.ownerEmail });
      if (!owner) return res.status(404).json({ error: "Owner not found" });
      filters.owner = owner._id;
    }

    // Search by name, emailId, phone (case-insensitive)
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filters.$or = [{ name: regex }, { emailId: regex }, { phone: regex }];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCustomers = await CustomerModel.countDocuments(filters);
    const customers = await CustomerModel.find(filters)
      .populate("owner", "name emailId role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      page,
      limit,
      totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit),
      hasNextPage: page * limit < totalCustomers,
      hasPrevPage: page > 1,
      customers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/customers
 * Create a new customer
 */
customerRouter.post("/", userAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const { name, company, emailId, phone, tags, owner, deals } = req.body;

    if (!name || !emailId) {
      return res.status(400).json({ error: "Name and Email are required" });
    }

    // Assign owner based on role
    let customerOwner;
    if (role === "Admin") {
      customerOwner = owner ? owner : req.user._id;
    } else {
      customerOwner = req.user._id;
    }

    const customer = await CustomerModel.create({
      name,
      company,
      emailId,
      phone,
      tags: tags || [],
      owner: customerOwner,
      notes: [],
      deals: deals || [],
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/customers/:id
 * Update customer with ownership checks
 */
customerRouter.patch("/:id", userAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Only Admin or owner can update
    if (req.user.role === "Agent" && customer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Optional: restrict certain fields (like owner only by Admin)
    if (req.body.owner && req.user.role !== "Admin") {
      delete req.body.owner;
    }

    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("owner", "name emailId role");

    res.status(200).json(updatedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/customers/:id/notes
 * Add note to customer with ownership checks
 */
customerRouter.post("/:id/notes", userAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Note text is required" });

    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Only Admin or owner can add note
    if (req.user.role === "Agent" && customer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    customer.notes.push({ text, createdBy: req.user._id });
    await customer.save();

    // Return latest 5 notes sorted by newest first
    const latestNotes = customer.notes
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.status(201).json({ ...customer.toObject(), notes: latestNotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default customerRouter;
