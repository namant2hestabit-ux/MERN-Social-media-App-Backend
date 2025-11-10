const dotenv = require("dotenv");
const { Server } = require("socket.io");
const { createServer } = require("http");

const { connectDB } = require("./config/connectDB");
const app = require("./app");

dotenv.config();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'https://mern-social-media-app-frontend.vercel.app',
    credentials: true,
    methods: ['GET', 'POST'],
  },
});


let users = [];

io.on("connection", (socket) => {
  socket.on("addUser", (userId) => {
    if (!users.some((u) => u.userId === userId)) {
      users.push({ userId, socketId: socket.id });
    }
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", ({ sender, receiver, text }) => {
    const user = users.find((u) => u.userId === receiver);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        sender,
        text,
        delivered: true,
      });
    }
  });

  socket.on("typing", ({ sender, receiver }) => {
    const user = users.find((u) => u.userId === receiver);
    if (user) {
      io.to(user.socketId).emit("typing", sender);
    }
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    const user = users.find((u) => u.userId === receiver);
    if (user) {
      io.to(user.socketId).emit("stopTyping", sender);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((u) => u.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});

const PORT = process.env.PORT || 5000;

const connectServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

connectServer();

