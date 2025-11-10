const Message = require("../models/messageSchema");

const postMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    const { receiver, text } = req.body;

    const msg = await Message.create({ sender, receiver, text });

    return res.json({ success: true, msg });
  } catch (err) {
    res.status(500).json({ message: "Error sending message" });
  }
};

const getUserMessage = async (req, res) => {
  try {
    const { user2 } = req.params;

    const sender = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: sender, receiver: user2 },
        { sender: user2, receiver: sender },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching message" });
  }
};

module.exports = { postMessage, getUserMessage };
