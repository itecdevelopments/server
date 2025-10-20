const User = require("../models/userModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const username = req.headers.authorization;

      if (!username) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No username provided" });
      }
      const token = username.split(" ")[1];
      const { id } = jwt.verify(token, process.env.JWT_SECRET);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      const user = await User.findOne({ _id: id });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role) && allowedRoles.length > 0) {
        return res
          .status(403)
          .json({ message: "Access denied: Insufficient permissions" });
      }
      req.info = {
        region: user.region,
        role: user.role,
        id,
      };
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = authorizeRoles;
