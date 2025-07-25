import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import "dotenv/config";
dotenv.config();


// 3rd verify JWT token Handles both cookies and Authorization: Bearer header
const verifyUser = (req, res, next) => {
  let token = req.cookies.token || req.headers["authorization"];

  // If token is from Authorization header, extract the actual token after "Bearer "
  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token." });
  }
};

export default verifyUser;
