const mongoose = require("mongoose");
const Comment = require("../models/commentSchema");
const Post = require("../models/postSchema");

const getAllComments = async (req, res) => {
  try {
    const postId = req.params.postId;

    if (!postId)
      return res.status(400).json({ message: "Post ID is required" });

    const comments = await Comment.find({ post: postId })
      .populate("user", "firstName")
      .lean(); // .lean() avoids model overhead and reduces memory usage significantly.

    return res
      .status(201)
      .json({ message: "Comment fetched successfully", comment: comments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Comment controller", error });
  }
};

const createComment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { postId } = req.params;
    const { comment } = req.body;

    if (!postId)
      return res.status(400).json({ message: "Post ID is required" });

    if (!comment)
      return res.status(400).json({ message: "Comment is required" });

    // Find post with or without session chaining
    const postQuery = Post.findById(postId);
    const post =
      postQuery && typeof postQuery.session === "function"
        ? await postQuery.session(session)
        : await postQuery;

    if (!post)
      return res.status(404).json({ message: "Post not found" });

    // Create and save the comment in the same session
    const newComment = new Comment({
      comment,
      post: post._id,
      user: req.user._id,
    });

    const savedComment = await newComment.save({ session });

    // Add comment reference to post
    post.comments.push(savedComment._id);
    await post.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      message: "Comment created successfully",
      comment: savedComment,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Error in Comment controller",
      error: error.message || error,
    });
  } finally {
    // ✅ Always close session, even if response was sent
    session.endSession();
  }
};


const deleteAnyComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Find the post asociated with comment
    const post = await Post.findById(comment.post);

    const session = await mongoose.startSession();

    // Start the session
    session.startTransaction();

    try {
      await Promise.all([
        Post.findByIdAndUpdate(
          post._id,
          {
            $pull: { comments: commentId },
          },
          { session }
        ),
        Comment.findByIdAndDelete(commentId, { session }),
      ]);

      // Commit transaction if everything is okay
      await session.commitTransaction();
    } catch (error) {
      // Abort transaction if some issue is there
      await session.abortTransaction();
      throw error;
    } finally {
      //Finally always end the sesson
      session.endSession();
    }

    return res.status(201).json({
      message: "Comment Deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Delete Comment controller", error });
  }
};

const deleteComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { commentId } = req.params;
    const loggedInUser = req.user;

    const comment = await Comment.findById(commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Find the post asociated with comment
    const post = await Post.findById(comment.post);

    const isDeleteAllowed =
      loggedInUser._id.toString() === post.author.toString() ||
      loggedInUser._id.toString() === comment.user.toString();

    if (!isDeleteAllowed)
      return res.status(400).json({
        message: "Can not delete someone else's post comments",
      });

    await Post.findByIdAndUpdate(
      post._id,
      {
        $pull: { comments: commentId },
      },
      { session }
    );
    await Comment.findByIdAndDelete(commentId, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Comment Deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ message: "Error in Delete Comment controller", error });
  }
};

const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const loggedInUser = req.user;

    const commentData = await Comment.findById(commentId);

    if (!commentData)
      return res.status(404).json({ message: "Comment not found" });

    const isUpdateAllowed =
      loggedInUser._id.toString() === commentData.user.toString();

    if (!isUpdateAllowed)
      return res.status(400).json({
        message: "Can not update someone else's comments",
      });

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { comment },
      { new: true }
    );

    return res.status(201).json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Update Comment controller", error });
  }
};

module.exports = {
  createComment,
  deleteComment,
  updateComment,
  getAllComments,
  deleteAnyComment,
};
