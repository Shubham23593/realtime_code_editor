import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map(); // roomId -> Set of usernames

io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit("userLeft", Array.from(rooms.get(currentRoom) || []), currentUser);
    }

    // Join new room
    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);

    // Notify room about new user
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)), userName);
  });

  socket.on("leaveRoom", ({ roomId, userName }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(userName);
      io.to(roomId).emit("userLeft", Array.from(rooms.get(roomId)), userName);
    }
    socket.leave(roomId);
    currentRoom = null;
    currentUser = null;
  });

  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("chatMessage", ({ roomId, user, message }) => {
    io.to(roomId).emit("chatMessage", { user, message });
  });

  socket.on("compileCode", async ({ code, roomId, language, version, stdin }) => {
    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language,
        version,
        files: [{ content: code }],
        stdin: stdin || ""
      });
      io.to(roomId).emit("codeResponse", response.data);
    } catch (err) {
      io.to(roomId).emit("codeResponse", {
        run: { output: "❌ Error compiling code" }
      });
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      if (rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(currentUser);
        io.to(currentRoom).emit("userLeft", Array.from(rooms.get(currentRoom)), currentUser);
      }
    }
    console.log("❌ User Disconnected:", socket.id);
  });
});

// Serve frontend from ./frontend/dist
const staticHandler = (req, res, next) => {
  try {
    const basePath = path.resolve("./frontend/dist");
    if (req.path === "/" || req.path === "/index.html") {
      return res.sendFile(path.join(basePath, "index.html"));
    }
    const assetPath = path.join(basePath, req.path);
    if (assetPath.startsWith(basePath)) {
      return res.sendFile(assetPath);
    }
    res.status(404).send("Not found");
  } catch (err) {
    next(err);
  }
};

app.use(staticHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});