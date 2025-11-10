/**
 * @file commentController.test.js
 * @description Unit tests for Comment Controller using Jest and Mongoose mocks
 */

const mongoose = require("mongoose");
const {
  createComment,
  deleteComment,
  updateComment,
  getAllComments,
  deleteAnyComment,
} = require("../../../controllers/commentController");

const Comment = require("../../../models/commentSchema");
const Post = require("../../../models/postSchema");

// ---- MOCKS ----
jest.mock("../../../models/commentSchema");
jest.mock("../../../models/postSchema");
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    startSession: jest.fn().mockImplementation(() => ({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    })),
  };
});

// ---- MOCK RESPONSE HELPER ----
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Comment Controller", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- getAllComments ----------
  describe("getAllComments", () => {
    it("should fail if postId is missing", async () => {
      const req = { params: {} };
      const res = mockResponse();

      await getAllComments(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post ID is required",
      });
    });

    it("should fetch all comments successfully", async () => {
      const req = { params: { postId: "1" } };
      const res = mockResponse();

      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "c1" }]),
      });

      await getAllComments(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Comment fetched successfully",
        })
      );
    });
  });

  // ---------- createComment ----------
  describe("createComment", () => {
    it("should fail if postId missing", async () => {
      const req = { params: {}, body: { comment: "Hello" } };
      const res = mockResponse();

      await createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should fail if comment missing", async () => {
      const req = { params: { postId: "1" }, body: {} };
      const res = mockResponse();

      await createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if post not found", async () => {
      const req = {
        params: { postId: "1" },
        body: { comment: "Nice!" },
        user: { _id: "u1" },
      };
      const res = mockResponse();

      Post.findById.mockReturnValue({ session: jest.fn().mockReturnThis(), exec: jest.fn() });
      Post.findById.mockResolvedValue(null);

      await createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should create comment successfully", async () => {
      const req = {
        params: { postId: "1" },
        body: { comment: "Nice Post!" },
        user: { _id: "u1" },
      };
      const res = mockResponse();

      const fakePost = { _id: "1", comments: [], save: jest.fn() };
      const fakeComment = { _id: "c1", save: jest.fn().mockResolvedValue({ _id: "c1" }) };

      Post.findById.mockReturnValue({ session: () => Promise.resolve(fakePost) });
      Post.findById.mockResolvedValue(fakePost);
      Comment.mockImplementation(() => fakeComment);

      await createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Comment created successfully" })
      );
    });
  });

  // ---------- deleteAnyComment ----------
  describe("deleteAnyComment", () => {
    it("should return 404 if comment not found", async () => {
      const req = { params: { commentId: "c1" } };
      const res = mockResponse();

      Comment.findById.mockResolvedValue(null);
      await deleteAnyComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete comment successfully", async () => {
      const req = { params: { commentId: "c1" } };
      const res = mockResponse();

      const fakeComment = { _id: "c1", post: "p1" };
      Comment.findById.mockResolvedValue(fakeComment);
      Post.findById.mockResolvedValue({ _id: "p1" });
      Post.findByIdAndUpdate.mockResolvedValue({});
      Comment.findByIdAndDelete.mockResolvedValue({});

      await deleteAnyComment(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Comment Deleted successfully" })
      );
    });
  });

  // ---------- deleteComment ----------
  describe("deleteComment", () => {
    it("should return 404 if comment not found", async () => {
      const req = { params: { commentId: "c1" }, user: { _id: "u1" } };
      const res = mockResponse();

      Comment.findById.mockResolvedValue(null);
      await deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reject unauthorized user", async () => {
      const req = { params: { commentId: "c1" }, user: { _id: "u1" } };
      const res = mockResponse();

      const fakeComment = { _id: "c1", post: "p1", user: "u2" };
      const fakePost = { _id: "p1", author: "u3" };

      Comment.findById.mockResolvedValue(fakeComment);
      Post.findById.mockResolvedValue(fakePost);

      await deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete comment successfully", async () => {
      const req = { params: { commentId: "c1" }, user: { _id: "u1" } };
      const res = mockResponse();

      const fakeComment = { _id: "c1", post: "p1", user: "u1" };
      const fakePost = { _id: "p1", author: "u1" };

      Comment.findById.mockResolvedValue(fakeComment);
      Post.findById.mockResolvedValue(fakePost);
      Post.findByIdAndUpdate.mockResolvedValue({});
      Comment.findByIdAndDelete.mockResolvedValue({});

      await deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ---------- updateComment ----------
  describe("updateComment", () => {
    it("should return 404 if comment not found", async () => {
      const req = { params: { commentId: "1" }, body: {}, user: { _id: "u1" } };
      const res = mockResponse();

      Comment.findById.mockResolvedValue(null);
      await updateComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reject unauthorized user", async () => {
      const req = {
        params: { commentId: "1" },
        body: { comment: "Updated" },
        user: { _id: "u1" },
      };
      const res = mockResponse();
      const fakeComment = { _id: "1", user: "u2" };
      Comment.findById.mockResolvedValue(fakeComment);

      await updateComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update comment successfully", async () => {
      const req = {
        params: { commentId: "1" },
        body: { comment: "Updated!" },
        user: { _id: "u1" },
      };
      const res = mockResponse();

      const fakeComment = { _id: "1", user: "u1" };
      const updated = { _id: "1", comment: "Updated!" };
      Comment.findById.mockResolvedValue(fakeComment);
      Comment.findByIdAndUpdate.mockResolvedValue(updated);

      await updateComment(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Comment updated successfully" })
      );
    });
  });
});
