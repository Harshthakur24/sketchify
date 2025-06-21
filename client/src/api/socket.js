import { io } from "socket.io-client";
import parser from "socket.io-msgpack-parser"

const BACKEND_URL = "https://sketchify-three.vercel.app:8080";

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