import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth2.js";

const router = express.Router();

// Get all users except the logged-in one
router.get("/", verifyToken, async (req, res) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7553/ingest/a0c42aab-7475-43a0-8a56-ebfbce0f7080',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8315b0'},body:JSON.stringify({sessionId:'8315b0',location:'user.js:GET/',message:'users route hit',data:{userId:req.user?.id},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("-password"); // exclude password
    res.json(users);
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7553/ingest/a0c42aab-7475-43a0-8a56-ebfbce0f7080',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8315b0'},body:JSON.stringify({sessionId:'8315b0',location:'user.js:GET/catch',message:'users route error',data:{error:err.message},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    res.status(500).json({ msg: "Error fetching users", error: err.message });
  }
});

export default router;
