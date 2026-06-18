import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth2.js";

const router = express.Router();
const avatarUploadDir = path.join(process.cwd(), "uploads", "avatars");

fs.mkdirSync(avatarUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user.id}-${Date.now()}${extension}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }

    cb(null, true);
  },
});

router.get("/random", verifyToken, async (req, res) => {
  try {
    const [randomUser] = await User.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(req.user.id) } } },
      { $sample: { size: 1 } },
      { $project: { password: 0 } },
    ]);

    if (!randomUser) {
      return res.status(404).json({ msg: "No other registered users found" });
    }

    res.json(randomUser);
  } catch (err) {
    res.status(500).json({ msg: "Error finding random user", error: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching users", error: err.message });
  }
});

router.patch("/me/avatar", verifyToken, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No image uploaded" });

    const avatar = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      msg: "Profile picture updated",
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ msg: "Profile picture update failed", error: err.message });
  }
});

export default router;
