const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");

// POST - create branch
router.post("/", async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - all branches
router.get("/", async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - one branch by id
router.get("/:id", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - update branch
router.put("/:id", async (req, res) => {
  try {
    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(updatedBranch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - delete branch
router.delete("/:id", async (req, res) => {
  try {
    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);

    if (!deletedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;