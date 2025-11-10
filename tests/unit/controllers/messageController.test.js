/**
 * @file messageController.test.js
 * @description Unit tests for messageController.js
 */

const { postMessage, getUserMessage } = require("../../../controllers/messageController");
const Message = require("../../../models/messageSchema");

// Mock Message model
jest.mock("../../../models/messageSchema");

// Mock Response helper
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Message Controller", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- postMessage ----------
  describe("postMessage", () => {
    it("should create message successfully", async () => {
      const req = {
        user: { _id: "u1" },
        body: { receiver: "u2", text: "Hello" },
      };
      const res = mockResponse();

      const fakeMessage = { _id: "m1", sender: "u1", receiver: "u2", text: "Hello" };
      Message.create.mockResolvedValue(fakeMessage);

      await postMessage(req, res);

      expect(Message.create).toHaveBeenCalledWith({
        sender: "u1",
        receiver: "u2",
        text: "Hello",
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        msg: fakeMessage,
      });
    });

    it("should handle errors gracefully", async () => {
      const req = { user: { _id: "u1" }, body: { receiver: "u2", text: "Hi" } };
      const res = mockResponse();

      Message.create.mockRejectedValue(new Error("DB error"));

      await postMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error sending message" });
    });
  });

  // ---------- getUserMessage ----------
  describe("getUserMessage", () => {
    it("should fetch user messages successfully", async () => {
      const req = { user: { _id: "u1" }, params: { user2: "u2" } };
      const res = mockResponse();

      const fakeMessages = [
        { _id: "m1", sender: "u1", receiver: "u2", text: "Hi" },
        { _id: "m2", sender: "u2", receiver: "u1", text: "Hello" },
      ];

      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(fakeMessages),
      });

      await getUserMessage(req, res);

      expect(Message.find).toHaveBeenCalledWith({
        $or: [
          { sender: "u1", receiver: "u2" },
          { sender: "u2", receiver: "u1" },
        ],
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeMessages);
    });

    it("should handle error during fetching messages", async () => {
      const req = { user: { _id: "u1" }, params: { user2: "u2" } };
      const res = mockResponse();

      Message.find.mockImplementation(() => {
        throw new Error("DB failure");
      });

      await getUserMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error fetching message" });
    });
  });
});
