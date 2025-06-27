require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const parser = require("socket.io-msgpack-parser");

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://sketchify-three.vercel.app",
];

const corsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST"],
  credentials: true,
  transports: ['websocket', 'polling']
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  parser,
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("leave", (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  });

  socket.on("getElements", ({ elements, room }) => {
    console.log(`Broadcasting elements to room: ${room}`);
    socket.to(room).emit("setElements", elements);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send(
    `<h1>Sketchify API Server</h1><p>Status: Running</p>`
  );
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
