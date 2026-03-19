import express from "express";
import User from "../models/User.js";

const router = express.Router();

// send friend request
router.post("/add", async (req, res) => {
  try {

    const { senderId, receiverId } = req.body;

    await User.findByIdAndUpdate(senderId,{
        $addToSet:{ friends: receiverId }
    });

    await User.findByIdAndUpdate(receiverId,{
        $addToSet:{ friends: senderId }
    });

    res.json({msg:"Friend added successfully"});

  } catch (err) {
    res.status(500).json({msg:"Error adding friend"});
  }
});

export default router;