const {
  signUpUser,
  loginUser,
  logoutUser,
  editProfile,
  editPassword,
  refreshTokens,
  fetchAllUsers,
  deleteAnyUser,
  editAnyUser,
} = require("../../../controllers/userController");

const User = require("../../../models/userSchema");
const Post = require("../../../models/postSchema");
const Comment = require("../../../models/commentSchema");
const Message = require("../../../models/messageSchema");
const {
  generateJWTToken,
  generateRefreshJWTToken,
  verifyJWTRefreshToken,
} = require("../../../config/jwtService");
const bcrypt = require("bcryptjs");

// Mocks
jest.mock("../../../models/userSchema");
jest.mock("../../../models/postSchema");
jest.mock("../../../models/commentSchema");
jest.mock("../../../models/messageSchema");
jest.mock("../../../config/jwtService");
jest.mock("bcryptjs");

// Mock response helper
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("User Controller", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- SIGN UP ----------
  describe("signUpUser", () => {
    it("should fail if email or password missing", async () => {
      const req = { body: { email: "", password: "" } };
      const res = mockResponse();

      await signUpUser(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error - email or password is missing",
        })
      );
    });

    it("should create user successfully", async () => {
      const req = {
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@test.com",
          password: "12345",
        },
      };
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedpass");
      User.prototype.save = jest
        .fn()
        .mockResolvedValue({ _id: "1", email: "john@test.com" });

      await signUpUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User created successfully",
        })
      );
    });
  });

  // ---------- LOGIN ----------
  describe("loginUser", () => {
    it("should fail if user not found", async () => {
      const req = {
        body: {
          email: "[test@test.com](mailto:test@test.com)",
          password: "pass",
        },
      };
      const res = mockResponse();
      User.findOne.mockResolvedValue(null);

      await loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should login user successfully", async () => {
      const req = { body: { email: "test@test.com", password: "pass" } };
      const res = mockResponse();
      const mockUser = {
        _id: "1",
        email: "test@test.com",
        password: "hashed",
        save: jest.fn(),
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateJWTToken.mockReturnValue("token123");
      generateRefreshJWTToken.mockReturnValue("ref123");

      await loginUser(req, res);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------- LOGOUT ----------
  describe("logoutUser", () => {
    it("should clear cookies and logout", async () => {
      const req = {};
      const res = mockResponse();

      await logoutUser(req, res);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------- EDIT PROFILE ----------
  describe("editProfile", () => {
    it("should reject disallowed fields", async () => {
      const req = { body: { role: "admin" }, user: {} };
      const res = mockResponse();

      await editProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update allowed fields", async () => {
      const req = { body: { firstName: "Jane" }, user: { save: jest.fn() } };
      const res = mockResponse();

      await editProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ---------- EDIT PASSWORD ----------
  describe("editPassword", () => {
    it("should reject same passwords", async () => {
      const req = {
        body: { currentPassword: "123", prevPassword: "123" },
        user: {},
      };
      const res = mockResponse();

      await editPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject if prev password mismatch", async () => {
      const req = {
        body: { currentPassword: "new", prevPassword: "old" },
        user: { password: "hash" },
      };
      const res = mockResponse();
      bcrypt.compare.mockResolvedValue(false);

      await editPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update password successfully", async () => {
      const req = {
        body: { currentPassword: "new", prevPassword: "old" },
        user: { password: "hash", save: jest.fn() },
      };
      const res = mockResponse();
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("newhash");

      await editPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ---------- REFRESH TOKENS ----------
  describe("refreshTokens", () => {
    it("should refresh successfully", async () => {
      const req = { cookies: { refreshToken: "abc" } };
      const res = mockResponse();

      verifyJWTRefreshToken.mockReturnValue({ id: "1" });
      const user = {
        _id: "1",
        refreshToken: "abc",
        refreshTokenExpiry: new Date(Date.now() + 10000),
        save: jest.fn(),
      };
      User.findById.mockResolvedValue(user);
      generateJWTToken.mockReturnValue("newAccess");
      generateRefreshJWTToken.mockReturnValue("newRef");

      await refreshTokens(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should fail if no token", async () => {
      const req = { cookies: {} };
      const res = mockResponse();
      await refreshTokens(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ---------- FETCH USERS ----------
  describe("fetchAllUsers", () => {
    it("should return list of users", async () => {
      const req = {};
      const res = mockResponse();
      User.find.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue([{ email: "[a@b.com](mailto:a@b.com)" }]),
      });

      await fetchAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------- DELETE ANY USER ----------
  describe("deleteAnyUser", () => {
    it("should delete user and related data", async () => {
      const req = { params: { userId: "123" } };
      const res = mockResponse();
      const user = { _id: "123" };
      const posts = [{ _id: "p1" }, { _id: "p2" }];

      User.findById.mockResolvedValue(user);
      Post.find.mockResolvedValue(posts);
      Comment.deleteMany.mockResolvedValue();
      Post.deleteMany.mockResolvedValue();
      Message.deleteMany.mockResolvedValue();
      User.findByIdAndDelete.mockResolvedValue();

      await deleteAnyUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------- EDIT ANY USER ----------
  describe("editAnyUser", () => {
    it("should fail for invalid fields", async () => {
      const req = { params: { userId: "1" }, body: { role: "admin" } };
      const res = mockResponse();

      await editAnyUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should edit user successfully", async () => {
      const req = {
        params: { userId: "1" },
        body: { firstName: "New" },
      };
      const res = mockResponse();
      const user = { save: jest.fn() };
      User.findById.mockResolvedValue(user);

      await editAnyUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
