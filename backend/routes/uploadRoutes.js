import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import Message from "../models/Message.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { sender, receiver, text = "" } = req.body;
    const fileUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : "";

    const msg = await Message.create({ sender, receiver, text, file: fileUrl });
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const receiverSocketId = onlineUsers?.get(receiver);

    if (io && receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", msg);
    }

    res.json(msg);
  } catch (e) {
    console.error("Upload error:", e);
    res.status(500).json({ msg: "Upload failed", error: e.message });
  }
});

export default router;
