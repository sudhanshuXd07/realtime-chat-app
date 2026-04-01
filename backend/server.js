import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import Message from "./models/Message.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/message.js";
import userRoutes from "./routes/user.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import friendRoutes from "./routes/friends.js";


console.log("📂 Backend starting...");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/messages", uploadRoutes);
app.use("/api/friends", friendRoutes);

// ✅ Multer setup (must come BEFORE using upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ✅ File upload route — now upload exists
app.post("/api/messages/upload", upload.single("file"), async (req, res) => {
  try {
    const { sender, receiver, text = "" } = req.body;
    const fileUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : "";

    const msg = await Message.create({ sender, receiver, text, file: fileUrl });

    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", msg);

    return res.json(msg);
  } catch (e) {
    console.error("Upload error:", e);
    return res.status(500).json({ msg: "Upload failed" });
  }
});

// ✅ Default route
app.get("/", (req, res) => res.send("API is running 🚀"));

// ✅ Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


// ✅ Socket logic
let onlineUsers = new Map();

let waitingUsers = [];
let activeChats = new Map();

io.on("connection", (socket) => {
  console.log("🔗 New user connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("✅ User joined:", userId);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("find_random", (userId) => {

    if (waitingUsers.length > 0) {

      const partner = waitingUsers.pop();

      const roomId = socket.id + partner.socketId;

      socket.join(roomId);
      partner.socket.join(roomId);

      activeChats.set(socket.id, roomId);
      activeChats.set(partner.socketId, roomId);

      io.to(roomId).emit("chat_started", {
        roomId,
        users: [userId, partner.userId]
      });

    } else {

      waitingUsers.push({
        userId,
        socketId: socket.id,
        socket
      });

    }

  });

  socket.on("skip_user", () => {

    const roomId = activeChats.get(socket.id);

    if (roomId) {

      socket.leave(roomId);

      io.to(roomId).emit("partner_skipped");

      activeChats.delete(socket.id);

    }

  });


  socket.on("send_message", async (data) => {
    try {
      const { sender, receiver, text, file } = data;

      const message = new Message({ sender, receiver, text, file });
      await message.save();

      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", message);
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_group_message", async (data) => {
    const { roomId, sender, text } = data;
    const message = new Message({ sender, receiver: null, text });
    await message.save();
    io.to(roomId).emit("receive_group_message", message);
  });

  socket.on("typing", ({ sender, receiver, isTyping }) => {
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { sender, isTyping });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

