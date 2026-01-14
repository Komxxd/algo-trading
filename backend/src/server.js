require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const marketSocketService = require("./services/marketSocket.service");

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

marketSocketService.setIo(io);

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Frontend disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

