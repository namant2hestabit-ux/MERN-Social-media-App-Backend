const express = require("express");
const multer = require("multer");

const { userAuth, adminAuth } = require("../middlewares/auth");
const {
  createPost,
  getAllPosts,
  getUserPosts,
  deletePost,
  updatePost,
  getPostData,
  deleteAnyPost,
} = require("../controllers/postController");

const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";

    // Check & create folder
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const postRouter = express.Router();

postRouter.post("/create-post", upload.single("image"), userAuth, createPost);

postRouter.get("/posts", userAuth, getAllPosts);

postRouter.get("/user-posts", userAuth, getUserPosts);

postRouter.delete("/post/:postId", userAuth, deletePost);

postRouter.delete("/admin/post/:postId", userAuth, adminAuth, deleteAnyPost);

postRouter.get("/post/:postId", userAuth, getPostData);

postRouter.patch("/post/:postId", userAuth, updatePost);

module.exports = postRouter;
