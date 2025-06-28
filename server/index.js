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

// Keep track of room participants
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("join", (room) => {
    try {
      socket.join(room);
      // Add user to room tracking
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room).add(socket.id);
      console.log(`Socket ${socket.id} joined room: ${room}`);
      console.log(`Room ${room} has ${rooms.get(room).size} participants`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", "Failed to join room");
    }
  });

  socket.on("leave", (room) => {
    try {
      socket.leave(room);
      // Remove user from room tracking
      if (rooms.has(room)) {
        rooms.get(room).delete(socket.id);
        if (rooms.get(room).size === 0) {
          rooms.delete(room);
        }
      }
      console.log(`Socket ${socket.id} left room: ${room}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  socket.on("getElements", ({ elements, room }) => {
    try {
      if (!room || !rooms.has(room)) {
        console.error(`Invalid room: ${room}`);
        return;
      }
      console.log(`Broadcasting elements to room: ${room}`);
      socket.to(room).emit("setElements", elements);
    } catch (error) {
      console.error("Error broadcasting elements:", error);
      socket.emit("error", "Failed to broadcast elements");
    }
  });

  socket.on("disconnect", () => {
    try {
      // Clean up room tracking
      for (const [room, participants] of rooms.entries()) {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);
          if (participants.size === 0) {
            rooms.delete(room);
          }
        }
      }
      console.log("Client disconnected:", socket.id);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
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
