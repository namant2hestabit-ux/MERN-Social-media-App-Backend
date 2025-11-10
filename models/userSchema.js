const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: [2, "First Name must be at least 2 characters long"],
    maxlength: [15, "First Name cannot exceed 15 characters"],
    trim: true,
    required: true
  },
  lastName: {
    type: String,
    maxlength: [15, "Last Name cannot exceed 15 characters"],
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: [2, "Email must be at least 5 characters long"],
    maxlength: [30, "Email cannot exceed 30 characters"],
    trim: true,
    set: (email) => email.toLowerCase(),
  },
  password: {
    type: String,
  },
  refreshToken: { type: String },
  refreshTokenExpiry: {
    type: Date,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
