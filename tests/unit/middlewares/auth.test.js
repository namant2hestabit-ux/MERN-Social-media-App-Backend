/**
 * @file authMiddleware.test.js
 * @description Unit tests for userAuth and adminAuth middleware
 */

const { userAuth, adminAuth } = require("../../../middlewares/auth");
const { verifyJWTToken } = require("../../../config/jwtService");
const User = require("../../../models/userSchema");

jest.mock("../../../config/jwtService");
jest.mock("../../../models/userSchema");

// Mock Express response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Auth Middleware", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- userAuth ----------
  describe("userAuth", () => {
    it("should return 401 if no token provided", async () => {
      const req = { cookies: {} };
      const res = mockResponse();
      const next = jest.fn();

      await userAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "User is not logged in",
        expired: true,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token invalid or expired", async () => {
      const req = { cookies: { token: "invalid" } };
      const res = mockResponse();
      const next = jest.fn();

      verifyJWTToken.mockReturnValue({}); // no id
      await userAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access token expired",
        expired: true,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if user not found", async () => {
      const req = { cookies: { token: "valid" } };
      const res = mockResponse();
      const next = jest.fn();

      verifyJWTToken.mockReturnValue({ id: "123" });
      User.findById.mockResolvedValue(null);

      await userAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid token",
        expired: true,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should attach user and call next if valid", async () => {
      const req = { cookies: { token: "valid" } };
      const res = mockResponse();
      const next = jest.fn();

      const fakeUser = { _id: "123", name: "John" };
      verifyJWTToken.mockReturnValue({ id: "123" });
      User.findById.mockResolvedValue(fakeUser);

      await userAuth(req, res, next);

      expect(req.user).toEqual(fakeUser);
      expect(next).toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      const req = { cookies: { token: "valid" } };
      const res = mockResponse();
      const next = jest.fn();

      verifyJWTToken.mockImplementation(() => {
        throw new Error("JWT failure");
      });

      await userAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error in User Auth",
          expired: true,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ---------- adminAuth ----------
  describe("adminAuth", () => {
    it("should return 401 if req.user missing", () => {
      const req = {};
      const res = mockResponse();
      const next = jest.fn();

      adminAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 if role is not admin", () => {
      const req = { user: { role: "user" } };
      const res = mockResponse();
      const next = jest.fn();

      adminAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access denied. Admins only.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next() if user is admin", () => {
      const req = { user: { role: "admin" } };
      const res = mockResponse();
      const next = jest.fn();

      adminAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should handle internal errors", () => {
      const req = null; // force a crash
      const res = mockResponse();
      const next = jest.fn();

      adminAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error in adminAuth middleware" })
      );
    });
  });
});
