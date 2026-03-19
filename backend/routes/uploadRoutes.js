import express from "express";
import multer from "multer";
import Message from "../models/Message.js";

const router = express.Router();

// ✅ Multer setup (local uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ Upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { sender, receiver, text = "" } = req.body;
    const fileUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : "";

    const msg = await Message.create({ sender, receiver, text, file: fileUrl });

    res.json(msg);
  } catch (e) {
    console.error("Upload error:", e);
    res.status(500).json({ msg: "Upload failed", error: e.message });
  }
});

export default router;
