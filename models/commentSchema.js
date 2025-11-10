const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
      minlength: [1, "Comment must be at least 5 characters long"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
      trim: true,
    },
    post: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    user: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1 });
commentSchema.index({ user: 1 });

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
