const express = require("express");
const Vault   = require("../models/Vault");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET all vault items for current user
router.get("/", protect, async (req, res) => {
  try {
    const items = await Vault.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

// CREATE vault item
router.post("/", protect, async (req, res) => {
  try {
    const { encryptedTitle, titleIv, encryptedData, iv } = req.body;
    if (!encryptedTitle || !titleIv || !encryptedData || !iv)
      return res.status(400).json({ message: "All fields required." });

    const item = await Vault.create({
      encryptedTitle, titleIv, encryptedData, iv, user: req.user.id,
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

// UPDATE vault item
router.put("/:id", protect, async (req, res) => {
  try {
    const { encryptedTitle, titleIv, encryptedData, iv } = req.body;
    const item = await Vault.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (encryptedTitle) item.encryptedTitle = encryptedTitle;
    if (titleIv)        item.titleIv        = titleIv;
    if (encryptedData)  item.encryptedData  = encryptedData;
    if (iv)             item.iv             = iv;

    await item.save();
    res.json(item);
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE vault item
router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await Vault.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json({ message: "Deleted." });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
