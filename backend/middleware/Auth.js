import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ msg: "Invalid token" });

      req.user = decoded; // decoded.id
      next();
    });
  } catch (err) {
    res.status(500).json({ msg: "Auth middleware error", error: err.message });
  }
};
