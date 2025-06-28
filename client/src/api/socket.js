import { io } from "socket.io-client";
import parser from "socket.io-msgpack-parser"

const BACKEND_URL = "https://sketchify-server-7y52.onrender.com";

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
    if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        socket.connect();
    }
});

socket.on("error", (error) => {
    console.error("Socket error:", error);
});

// Reconnection events
socket.on("reconnect", (attemptNumber) => {
    console.log("Reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("Attempting to reconnect:", attemptNumber);
});

socket.on("reconnect_error", (error) => {
    console.error("Reconnection error:", error);
});

socket.on("reconnect_failed", () => {
    console.error("Failed to reconnect after all attempts");
});