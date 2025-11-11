const mongoose = require("mongoose");
const Comment = require("../models/commentSchema");
const Post = require("../models/postSchema");
const imagekit = require("../config/imageKit");

const createPost = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title)
      return res.status(400).json({ message: "Post Title is required" });


    let imageURL = null;

    if (req.file) {
      const uploadedImage = await imagekit.upload({
        file: req.file.buffer.toString("base64"),  // file as base64 string
        fileName: req.file.originalname,           // original file name
        folder: "/posts",                          // optional folder
      });

      imageURL = uploadedImage.url;   // returns CDN URL
    }

    const newPost = new Post({
      title,
      author: req.user._id,
      imageURL,
    });

    const savedPost = await newPost.save();

    return res
      .status(201)
      .json({ message: "Post created successfully", post: savedPost });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Create Post controller",
      error,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();

    const allPost = await Post.find({})
      .sort({ createdAt: -1 })
      .populate("author", "firstName email")
      .skip(skip)
      .limit(limit)
      .lean(); // .lean() converts Mongoose documents into plain JS object
    // Result: ~40–50% faster queries and less memory usage.

    const hasMore = skip + allPost.length < totalPosts;

    return res.status(201).json({
      message: "All Post Fetched successfully",
      posts: allPost,
      hasMore,
      totalPosts,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Get all Post controller" });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const user = req.user;
    const userPosts = await Post.find({ author: user._id });
    return res.status(201).json({
      message: "All Post of User Fetched successfully",
      posts: userPosts,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Get User Posts controller" });
  }
};

const getPostData = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate(
      "author",
      "firstName email"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({
      message: "Single Post Fetched successfully",
      post,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in Get Post Data controller" });
  }
};

const deleteAnyPost = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { postId } = req.params;

    // Always include the session in the query
    const post = await Post.findById(postId).session(session);

    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Post not found" });
    }

    // All operations must include the same session
    await Comment.deleteMany({ post: postId }).session(session);
    await Post.findByIdAndDelete(postId).session(session);

    await session.commitTransaction();
    return res.status(201).json({ message: "Post Deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Error in Delete Any Post controller", error });
  } finally {
    session.endSession();
  }
};

const deletePost = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { postId } = req.params;
    const loggedInUser = req.user;

    const post = await Post.findById(postId).session(session);

    console.log(post);
    console.log(postId);
    console.log(loggedInUser);
    

    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Post not found" });
    }

    // Authorization check
    if (post.author.toString() !== loggedInUser._id.toString()) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ message: "You cannot delete someone else's post" });
    }
    

    // Delete all comments and post within the same transaction
    await Comment.deleteMany({ post: postId }).session(session);
    await Post.findByIdAndDelete(postId).session(session);

    await session.commitTransaction();

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    // Rollback if any error occurs
    await session.abortTransaction();
    console.log("Delete Post Error:", error);

    return res
      .status(500)
      .json({ message: "Error in Delete Post controller", error });
  } finally {
    // Always end session
    session.endSession();
  }
};

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const loggedInUser = req.user;
    // Guard against req.body being undefined in unit tests
    const { title } = req.body || {};

    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== loggedInUser._id.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot delete someone else's post" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title },
      { new: true }
    );

    return res.status(201).json({
      message: "Post Updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Update Post Error:", error);
    return res
      .status(500)
      .json({ message: "Error in Get Update Post controller", error });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  deletePost,
  updatePost,
  getPostData,
  deleteAnyPost,
};
