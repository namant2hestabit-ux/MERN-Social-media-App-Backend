const express = require("express");
const { userAuth, adminAuth } = require("../middlewares/auth");
const {
  createComment,
  deleteComment,
  updateComment,
  getAllComments,
  deleteAnyComment,
} = require("../controllers/commentController");

const commentRouter = express.Router();

commentRouter.get("/comment/:postId", userAuth, getAllComments);

commentRouter.post("/comment/:postId", userAuth, createComment);

commentRouter.delete("/comment/:commentId", userAuth, deleteComment);

commentRouter.delete(
  "/admin/comment/:commentId",
  userAuth,
  adminAuth,
  deleteAnyComment
);

commentRouter.patch("/comment/:commentId", userAuth, updateComment);

module.exports = commentRouter;
