const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { postMessage ,getUserMessage } = require("../controllers/messageController");

const messageRouter = express.Router();

messageRouter.post("/message", userAuth, postMessage );

messageRouter.get("/message/:user2", userAuth, getUserMessage);

module.exports = messageRouter;
