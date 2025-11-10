const { verifyJWTToken } = require("../config/jwtService");
const User = require("../models/userSchema");

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;
  try {
    if (!token)
      return res.status(401).json({ message: "User is not logged in", expired: true });
    const { id } = verifyJWTToken(token);
    if (!id)
      return res
        .status(401)
        .json({ message: "Access token expired", expired: true });

    const user = await User.findById(id);

    if (!user) return res.status(401).json({ message: "Invalid token", expired: true });

    req.user = user;

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in User Auth", error, expired: true });
  }
};

const adminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Error in adminAuth middleware", err });
  }
};


module.exports = { userAuth, adminAuth };
