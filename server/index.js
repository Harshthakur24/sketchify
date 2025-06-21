require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const parser = require("socket.io-msgpack-parser");

const CLIENT_URL = "https://sketchify-three.vercel.app";
const PORT = process.env.PORT || 8080;

const corsOptions = {
  origin: [CLIENT_URL],
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  parser,
  cors: corsOptions,
});

io.on("connection", (socket) => {
  socket.on("join", (room) => {
    socket.join(room);
  });

  socket.on("leave", (room) => {
    socket.leave(room);
  });

  socket.on("getElements", ({ elements, room }) => {
    socket.to(room).emit("setElements", elements);
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

server.listen(PORT, () => {
  console.log(`Server running in ${isDev ? "development" : "production"} mode on port ${PORT}`);
});
