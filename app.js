
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");



const userRouter = require("./routes/userRoutes");
const postRouter = require("./routes/postRoutes");
const commentRouter = require("./routes/commentRoutes");
const messageRouter = require("./routes/messageRoutes");


const app = express();

// Middleware
app.use(cookieParser());
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'https://mern-social-media-app-frontend.vercel.app',
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api", userRouter);
app.use("/api", postRouter);
app.use("/api", commentRouter);
app.use("/api", messageRouter);

module.exports = app;
