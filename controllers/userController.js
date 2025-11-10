const bcrypt = require("bcryptjs");

const User = require("../models/userSchema");

const {
  generateJWTToken,
  verifyJWTRefreshToken,
  generateRefreshJWTToken,
} = require("../config/jwtService");
const { oauth2client } = require("../utils/googleConfig");
const { splitName } = require("../utils/helper");
const Post = require("../models/postSchema");
const Comment = require("../models/commentSchema");
const Message = require("../models/messageSchema");

const getUserData = (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "User profile fetched successfully", user: req.user });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Profile Controller",
      error,
    });
  }
};

const signUpUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password)
      return res.status(404).json({ message: "Error - email or password is missing" });

    const user = await User.findOne({ email });

    if (user) return res.status(404).json({ message: "Error - User already exist" });

    const hashedPassword = await bcrypt.hash(password, 8);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User created successfully",
      user: savedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in SignUp Controller",
      error,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(401).json({ message: "Error - email or password is missing" });

    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(401)
        .json({ message: "Error - Email or Password is incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res
        .status(500)
        .json({ message: "Error - Email or Password is incorrect" });

    const token = generateJWTToken({
      id: user._id,
      role: user?.role || "user",
    });

    const refreshToken = generateRefreshJWTToken({ id: user._id }, "7d");

    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "PRODUCTION",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "User logged in successfully",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Login Controller",
      error,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.cookie("token", null, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
    });
    res.cookie("refreshToken", null, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
    });
    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Logout Controller",
      error,
    });
  }
};

const editProfile = async (req, res) => {
  try {
    const allowedEditFields = ["firstName", "lastName"];

    const isEditAllowed = Object.keys(req.body).every((field) =>
      allowedEditFields.includes(field)
    );

    if (!isEditAllowed) {
      return res.status(400).json({
        message: "You are not allowed to edit these fields",
      });
    }

    const { user } = req;

    Object.keys(req.body).forEach((key) => (user[key] = req.body[key]));

    await user.save();

    return res.status(201).json({
      message: "User Updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Edit Profile Controller",
      error,
    });
  }
};

const editPassword = async (req, res) => {
  try {
    const { currentPassword, prevPassword } = req.body;

    if (currentPassword === prevPassword)
      return res.status(400).json({
        message: "Current and Previous cannot be same",
      });

    const loggedInUser = req.user;

    const isMatch = await bcrypt.compare(prevPassword, loggedInUser.password);

    if (!isMatch)
      return res.status(400).json({
        message: "Incorrect Previous Password",
      });

    const hashedPassword = await bcrypt.hash(currentPassword, 8);

    loggedInUser.password == hashedPassword;

    loggedInUser.save();

    return res.status(201).json({
      message: "Password Updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Edit Password Controller",
      error,
    });
  }
};

const fetchAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Fetch Users Controller",
      error,
    });
  }
};

const refreshTokens = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token missing" });

    const decoded = verifyJWTRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });

    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (user.refreshTokenExpiry < Date.now()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const { id } = verifyJWTRefreshToken(refreshToken);

    const newAccessToken = generateJWTToken({
      id,
      role: user?.role || "user",
    });

    // New Refresh token
    const newRefreshToken = generateRefreshJWTToken({ id: user._id }, "7d");
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    return res.status(201).json({ message: "Access token refreshed" });
  } catch (error) {
    return res.status(500).json({ message: "Refresh token error", error });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code is required" });
    }

    const googleResponse = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleResponse.tokens);

    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const googleUser = await response.json();

    if (!googleUser || !googleUser.email) {
      return res
        .status(400)
        .json({ message: "Failed to retrieve Google user data" });
    }

    // To split Full Name into first and last name
    const parts = splitName(googleUser?.name);

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create a new user if not found
      user = await User.create({
        firstName: parts.firstName,
        lastName: parts.lastName,
        email: googleUser.email,
      });
    }

    const token = generateJWTToken({
      id: user._id,
      role: user?.role || "user",
    });
    const refreshToken = generateRefreshJWTToken({ id: user._id }, "7d");

    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "PRODUCTION",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Google login successful",
      user: user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Google Login Controller", error });
  }
};

const deleteAnyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find all posts authored by this user
    const userPosts = await Post.find({ author: userId });
    const postIds = userPosts.map((p) => p._id);

    // Delete all comments related to user’s posts (only if posts exist)
    if (postIds.length > 0) {
      console.log(postIds);

      await Comment.deleteMany({ post: { $in: postIds } });
      await Post.deleteMany({ author: userId });
    }

    // Delete all user’s own comments (on other people’s posts too)
    await Comment.deleteMany({ user: userId });

    // Delete all messages where user is sender or receiver
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: "User and all associated data deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in deleteAnyUser controller", error });
  }
};

const editAnyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const allowedEditFields = ["firstName", "lastName", "email"];

    const isEditAllowed = Object.keys(req.body).every((field) =>
      allowedEditFields.includes(field)
    );

    if (!isEditAllowed) {
      return res.status(400).json({
        message: "You are not allowed to edit these fields",
      });
    }

    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        message: "User not found",
      });

    Object.keys(req.body).forEach((key) => (user[key] = req.body[key]));

    await user.save();

    return res.status(201).json({
      message: "User Updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Edit All Profile Controller",
      error,
    });
  }
};

module.exports = {
  getUserData,
  signUpUser,
  loginUser,
  logoutUser,
  editProfile,
  editPassword,
  fetchAllUsers,
  refreshTokens,
  googleLogin,
  deleteAnyUser,
  editAnyUser,
};
