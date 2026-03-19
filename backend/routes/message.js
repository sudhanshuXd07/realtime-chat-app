import express from "express";
import Message from "../models/Message.js";
import { verifyToken } from "../middleware/auth.js"; // ✅ correct import

const router = express.Router();

// ✅ Route 1: Get messages between two users (Protected)
router.get("/:userId/:partnerId", verifyToken, async (req, res) => {
  try {
    const { userId, partnerId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching messages" });
  }
});

// ✅ Route 2: Same functionality (you can remove one if duplicate)
router.get("/:senderId/:receiverId", async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const msgs = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching messages" });
  }
});

export default router;
