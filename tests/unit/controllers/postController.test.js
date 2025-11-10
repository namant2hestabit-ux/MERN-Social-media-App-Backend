const mongoose = require("mongoose");
const {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostData,
  deletePost,
  updatePost,
  deleteAnyPost,
} = require("../../../controllers/postController");
const Post = require("../../../models/postSchema");
const Comment = require("../../../models/commentSchema");

jest.mock("../../../models/postSchema");
jest.mock("../../../models/commentSchema");
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  startSession: jest.fn().mockResolvedValue({
    startTransaction: jest.fn().mockResolvedValue(),
    commitTransaction: jest.fn().mockResolvedValue(),
    abortTransaction: jest.fn().mockResolvedValue(),
    endSession: jest.fn().mockResolvedValue(),
  }),
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Post Controller", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- CREATE POST ----------
  describe("createPost", () => {
    it("should fail if title missing", async () => {
      const req = { body: {}, user: { _id: "u1" } };
      const res = mockResponse();

      await createPost(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create a post successfully", async () => {
      const req = {
        body: { title: "New Post" },
        user: { _id: "u1" },
        file: null,
      };
      const res = mockResponse();

      Post.prototype.save = jest
        .fn()
        .mockResolvedValue({ _id: "1", title: "New Post" });

      await createPost(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Post created successfully",
        })
      );
    });
  });

  // ---------- GET ALL POSTS ----------
  describe("getAllPosts", () => {
    it("should return paginated posts", async () => {
      const req = { query: { page: "1", limit: "2" } };
      const res = mockResponse();

      Post.countDocuments.mockResolvedValue(2);
      Post.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "1" }, { _id: "2" }]),
      });

      await getAllPosts(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          posts: expect.any(Array),
          totalPosts: 2,
        })
      );
    });
  });

  // ---------- GET USER POSTS ----------
  describe("getUserPosts", () => {
    it("should fetch all posts of user", async () => {
      const req = { user: { _id: "u1" } };
      const res = mockResponse();

      Post.find.mockResolvedValue([{ _id: "1" }]);
      await getUserPosts(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ---------- GET SINGLE POST ----------
  describe("getPostData", () => {
    it("should return 404 if post not found", async () => {
      const req = { params: { postId: "1" } };
      const res = mockResponse();

      Post.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      await getPostData(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should fetch post successfully", async () => {
      const req = { params: { postId: "1" } };
      const res = mockResponse();

      Post.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: "1", title: "Post" }),
      });

      await getPostData(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------- DELETE ANY POST ----------
  describe("deleteAnyPost", () => {
    it("should delete post and comments", async () => {
      const req = { params: { postId: "1" } };
      const res = mockResponse();

      // Post.findById.mockResolvedValue({ _id: "1" });
      Post.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue({ _id: "1" }),
      });
      Comment.deleteMany.mockReturnValue({
        session: jest.fn().mockResolvedValue(),
      });
      Post.findByIdAndDelete.mockReturnValue({
        session: jest.fn().mockResolvedValue(),
      });

      await deleteAnyPost(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle post not found", async () => {
      const req = { params: { postId: "1" } };
      const res = mockResponse();

      Post.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });
      await deleteAnyPost(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------- DELETE USER POST ----------
  describe("deletePost", () => {
    it("should delete only user’s own post", async () => {
      const req = { params: { postId: "1" }, user: { _id: "u1" } };
      const res = mockResponse();

      Post.findById.mockReturnValue({ session: () => ({ author: "u1" }) });

      Comment.deleteMany.mockReturnValue({
        session: jest.fn().mockResolvedValue(),
      });
      Post.findByIdAndDelete.mockReturnValue({
        session: jest.fn().mockResolvedValue(),
      });

      await deletePost(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should block if trying to delete others’ post", async () => {
      const req = { params: { postId: "1" }, user: { _id: "u1" } };
      const res = mockResponse();

      Post.findById.mockReturnValue({ session: () => ({ author: "u2" }) });
      await deletePost(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------- UPDATE POST ----------
  describe("updatePost", () => {
    it("should return 404 if not found", async () => {
      const req = { params: { postId: "1" }, user: { _id: "u1" } };
      const res = mockResponse();
      Post.findById.mockResolvedValue(null);

      await updatePost(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update post if authorized", async () => {
      const req = {
        params: { postId: "1" },
        user: { _id: "u1" },
        body: { title: "Updated" },
      };
      const res = mockResponse();
      const post = { author: "u1" };

      Post.findById.mockResolvedValue(post);
      Post.findByIdAndUpdate.mockResolvedValue({ _id: "1", title: "Updated" });

      await updatePost(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Post Updated successfully",
        })
      );
    });

    it("should reject unauthorized user", async () => {
      const req = {
        params: { postId: "1" },
        user: { _id: "u2" },
        body: { title: "Bad Update" },
      };
      const res = mockResponse();
      const post = { author: "u1" };

      Post.findById.mockResolvedValue(post);
      await updatePost(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
