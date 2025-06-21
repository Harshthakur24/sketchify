import { io } from "socket.io-client";
import parser from "socket.io-msgpack-parser"

const BACKEND_URL = "https://sketchify-three.vercel.app";

export const socket = io(BACKEND_URL, {
    parser,
    withCredentials: true,
    transports: ['websocket', 'polling']
});