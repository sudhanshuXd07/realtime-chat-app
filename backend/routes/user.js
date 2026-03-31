import express from "express";
import User from "../models/User.js";
import auth from "./authe.js";

const router = express.Router();

// Get all users except the logged-in one
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("-password"); // exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching users", error: err.message });
  }
});

export default router;
