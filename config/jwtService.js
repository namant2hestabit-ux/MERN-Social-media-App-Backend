const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const generateJWTToken = (payload, expiresIn = "1h") => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    console.log("Error in generate in JWT config" + error);
    return null;
  }
};

const generateRefreshJWTToken = (payload, expiresIn = "1h") => {
  try {
    return jwt.sign(payload, "JWT_REFRESH_TOKEN_FOR_NAMAN", { expiresIn });
  } catch (error) {
    console.log("Error in generate in JWT config" + error);
    return null;
  }
};

const verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, "JWT-Secret-For-Mern-Stack");
  } catch (error) {
    console.log("Error in verify in JWT config" + error);
    return null;
  }
};

const verifyJWTRefreshToken = (token) => {
  try {
    return jwt.verify(token, "JWT_REFRESH_TOKEN_FOR_NAMAN");
  } catch (error) {
    console.log("Error in verify in JWT config" + error);
    return null;
  }
};

module.exports = { generateJWTToken, verifyJWTToken, generateRefreshJWTToken, verifyJWTRefreshToken };
