import { io } from "socket.io-client";
import parser from "socket.io-msgpack-parser"

const isDev = import.meta.env.MODE === "development";
const BACKEND_URL = isDev 
  ? "http://localhost:8080"
  : "https://sketchify-three.vercel.app";

export const socket = io(BACKEND_URL, {
    parser,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
    path: "/socket.io/"
});

socket.on("connect", () => {
    console.log("Connected to server");
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
});

socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
});