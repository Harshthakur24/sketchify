require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const parser = require("socket.io-msgpack-parser");
const { createClient } = require('redis');

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


const rooms = new Map();


let redis = null;
const connectRedis = async () => {
  try {
    redis = createClient({
      url: 'redis://localhost:6379',
    });
    await redis.connect();
    console.log('Redis connected - room persistence enabled');
  } catch (error) {
    console.log('Redis not available - using memory only:', error.message);
    redis = null;
  }
};


const saveRoomData = async (roomId, elements) => {
  if (redis) {
    try {
      await redis.setEx(`room:${roomId}`, 604800, JSON.stringify(elements)); 
    } catch (error) {
      console.error('Error saving to Redis:', error);
    }
  }
};


const loadRoomData = async (roomId) => {
  if (redis) {
    try {
      const data = await redis.get(`room:${roomId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading from Redis:', error);
    }
  }
  return [];
};

connectRedis();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("join", async (room) => {
    try {
      socket.join(room);

      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room).add(socket.id);
      

      const existingElements = await loadRoomData(room);
      if (existingElements.length > 0) {
        socket.emit("setElements", existingElements);
        console.log(`Sent ${existingElements.length} existing elements to ${socket.id}`);
      }
      
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

  socket.on("getElements", async ({ elements, room }) => {
    try {
      if (!room || !rooms.has(room)) {
        console.error(`Invalid room: ${room}`);
        return;
      }
      
      // Save to Redis for persistence
      await saveRoomData(room, elements);
      
      console.log(`Broadcasting ${elements.length} elements to room: ${room}`);
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
