import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text:     { type: String, default: "" },
  file:     { type: String, default: "" }, // URL/path if file attached
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
