import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';
import fs, { existsSync } from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Load .env from backend directory regardless of where server is run from
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";


const app = express();
const server = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ─── REST API Routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/submissions", submissionRoutes);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*" },
});

// roomId -> { users: Map<socketId, {userName, role, email}>, mode, activeEditors: Set, pendingHands: Set }
const rooms = new Map();

function getRoomState(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Map(),       // socketId -> { userName, role, email }
      mode: 'free',
      activeEditors: new Set(),
      pendingHands: new Set(),
    });
  }
  return rooms.get(roomId);
}

function broadcastUsers(roomId) {
  const state = rooms.get(roomId);
  if (!state) return;
  const userList = Array.from(state.users.values()).map(u => ({
    name: u.userName,
    role: u.role,
    canEdit: canUserEdit(u.userName, state),
  }));
  io.to(roomId).emit("usersUpdate", userList);
}

function canUserEdit(userName, state) {
  if (state.mode === 'free') return true;
  if (state.mode === 'teacher') return state.activeEditors.has(userName);
  if (state.mode === 'raise_hand') return state.activeEditors.has(userName);
  if (state.mode === 'group') return state.activeEditors.has(userName);
  return false;
}

io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;
  let currentRole = null;

  // ─── Join Room ──────────────────────────────────────────────────────────────
  socket.on("join", ({ roomId, userName, role, email }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      const prevState = rooms.get(currentRoom);
      if (prevState) {
        prevState.users.delete(socket.id);
        prevState.activeEditors.delete(currentUser);
        prevState.pendingHands.delete(currentUser);
        io.to(currentRoom).emit("userLeft", currentUser);
        broadcastUsers(currentRoom);
      }
    }

    currentRoom = roomId;
    currentUser = userName;
    currentRole = role;
    socket.join(roomId);

    const state = getRoomState(roomId);
    state.users.set(socket.id, { userName, role, email });

    // Teacher automatically gets edit permission
    if (role === 'teacher') {
      state.activeEditors.add(userName);
    }
    // In free mode, everyone can edit
    if (state.mode === 'free') {
      state.activeEditors.add(userName);
    }

    socket.emit("roomState", {
      mode: state.mode,
      activeEditors: Array.from(state.activeEditors),
      pendingHands: Array.from(state.pendingHands),
    });

    io.to(roomId).emit("userJoined", userName);
    broadcastUsers(roomId);
    toast(roomId, `${userName} joined the room 🎉`);
  });

  // ─── Leave Room ─────────────────────────────────────────────────────────────
  socket.on("leaveRoom", ({ roomId, userName }) => {
    const state = rooms.get(roomId);
    if (state) {
      state.users.delete(socket.id);
      state.activeEditors.delete(userName);
      state.pendingHands.delete(userName);
      io.to(roomId).emit("userLeft", userName);
      broadcastUsers(roomId);
    }
    socket.leave(roomId);
    currentRoom = null;
    currentUser = null;
    currentRole = null;
  });

  // ─── Code Sync ──────────────────────────────────────────────────────────────
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  // ─── Chat ───────────────────────────────────────────────────────────────────
  socket.on("chatMessage", ({ roomId, user, message }) => {
    io.to(roomId).emit("chatMessage", { user, message, timestamp: new Date().toISOString() });
  });

  // ─── Compile ────────────────────────────────────────────────────────────────
  socket.on("compileCode", async ({ code, roomId, language, version, stdin }) => {
    try {
      const dir = join(process.cwd(), 'temp');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      
      const fileId = Date.now();
      let output = '';
      
      if (language === 'javascript') {
        const filePath = join(dir, `${fileId}.js`);
        fs.writeFileSync(filePath, code);
        try {
          const { stdout, stderr } = await execPromise(`node "${filePath}"`);
          output = stdout || stderr;
        } catch (execErr) { output = execErr.stdout || execErr.stderr || execErr.message; }
        fs.unlinkSync(filePath);
      } else if (language === 'python') {
        const filePath = join(dir, `${fileId}.py`);
        fs.writeFileSync(filePath, code);
        try {
          const { stdout, stderr } = await execPromise(`python "${filePath}"`);
          output = stdout || stderr;
        } catch (execErr) { 
          try {
            const { stdout, stderr } = await execPromise(`python3 "${filePath}"`);
            output = stdout || stderr;
          } catch (e2) { output = e2.stdout || e2.stderr || e2.message; }
        }
        fs.unlinkSync(filePath);
      } else if (language === 'c' || language === 'cpp') {
        const ext = language === 'c' ? 'c' : 'cpp';
        const compiler = language === 'c' ? 'gcc' : 'g++';
        const filePath = join(dir, `${fileId}.${ext}`);
        const exePath = join(dir, `${fileId}.exe`);
        fs.writeFileSync(filePath, code);
        try {
          await execPromise(`${compiler} "${filePath}" -o "${exePath}"`);
          const { stdout, stderr } = await execPromise(`"${exePath}"`);
          output = stdout || stderr;
          if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
        } catch (execErr) { output = execErr.stdout || execErr.stderr || execErr.message; }
        fs.unlinkSync(filePath);
      } else if (language === 'java') {
        const filePath = join(dir, `Main.java`);
        fs.writeFileSync(filePath, code);
        try {
          await execPromise(`javac "${filePath}"`);
          const { stdout, stderr } = await execPromise(`java -cp "${dir}" Main`);
          output = stdout || stderr;
          if (fs.existsSync(join(dir, 'Main.class'))) fs.unlinkSync(join(dir, 'Main.class'));
        } catch (execErr) { output = execErr.stdout || execErr.stderr || execErr.message; }
        fs.unlinkSync(filePath);
      } else {
        output = "❌ local execution not configured for this language.";
      }
      
      io.to(roomId).emit("codeResponse", { run: { output: output }});
    } catch (err) {
      io.to(roomId).emit("codeResponse", {
        run: { output: "❌ Error compiling code: " + (err.message || "Unknown error") }
      });
    }
  });

  // ─── Permission: Change Mode (Teacher only) ─────────────────────────────────
  socket.on("changeMode", ({ roomId, mode }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    const user = state.users.get(socket.id);
    if (!user || user.role !== 'teacher') return;

    state.mode = mode;
    state.pendingHands.clear();

    // Recalculate who can edit
    if (mode === 'free') {
      // Everyone gets edit access
      state.activeEditors = new Set(Array.from(state.users.values()).map(u => u.userName));
    } else if (mode === 'teacher') {
      // Only teacher
      state.activeEditors = new Set([currentUser]);
    } else {
      // raise_hand or group — only teacher stays, others need permission
      state.activeEditors = new Set([currentUser]);
    }

    io.to(roomId).emit("modeChanged", {
      mode,
      activeEditors: Array.from(state.activeEditors),
    });
    broadcastUsers(roomId);
  });

  // ─── Permission: Raise Hand (Student) ───────────────────────────────────────
  socket.on("raiseHand", ({ roomId, userName }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    state.pendingHands.add(userName);

    // Notify teacher(s)
    io.to(roomId).emit("handRaised", {
      userName,
      pendingHands: Array.from(state.pendingHands),
    });
  });

  // ─── Permission: Approve/Reject Hand (Teacher) ───────────────────────────────
  socket.on("approveHand", ({ roomId, targetUser }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    const user = state.users.get(socket.id);
    if (!user || user.role !== 'teacher') return;

    const maxEditors = state.mode === 'group' ? (state.maxGroupEditors || 5) : Infinity;
    
    if (state.activeEditors.size < maxEditors) {
      state.activeEditors.add(targetUser);
      state.pendingHands.delete(targetUser);
      io.to(roomId).emit("editApproved", {
        userName: targetUser,
        activeEditors: Array.from(state.activeEditors),
      });
      broadcastUsers(roomId);
    } else {
      socket.emit("approvalFailed", { message: `Max ${maxEditors} editors allowed in group mode` });
    }
  });

  socket.on("rejectHand", ({ roomId, targetUser }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    const user = state.users.get(socket.id);
    if (!user || user.role !== 'teacher') return;

    state.pendingHands.delete(targetUser);
    io.to(roomId).emit("editRejected", {
      userName: targetUser,
      pendingHands: Array.from(state.pendingHands),
    });
  });

  // ─── Permission: Revoke Edit Access (Teacher) ────────────────────────────────
  socket.on("revokeEdit", ({ roomId, targetUser }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    const user = state.users.get(socket.id);
    if (!user || user.role !== 'teacher') return;

    state.activeEditors.delete(targetUser);
    io.to(roomId).emit("editRevoked", {
      userName: targetUser,
      activeEditors: Array.from(state.activeEditors),
    });
    broadcastUsers(roomId);
  });

  // ─── Kick User (Teacher) ────────────────────────────────────────────────────
  socket.on("kickUser", ({ roomId, targetUser }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    const user = state.users.get(socket.id);
    if (!user || user.role !== 'teacher') return;

    // Find target socket and disconnect them from room
    for (const [sid, u] of state.users.entries()) {
      if (u.userName === targetUser) {
        io.to(sid).emit("youWereKicked", { message: "You were removed from the room by the teacher." });
        state.users.delete(sid);
        state.activeEditors.delete(targetUser);
        break;
      }
    }

    io.to(roomId).emit("userKicked", targetUser);
    broadcastUsers(roomId);
  });

  // ─── Post Problem (Teacher) ──────────────────────────────────────────────────
  socket.on("postProblem", ({ roomId, problem, problemTitle }) => {
    const state = rooms.get(roomId);
    if (!state) return;
    const user = state.users.get(socket.id);
    if (!user || user.role !== 'teacher') return;

    io.to(roomId).emit("problemPosted", { problem, problemTitle });
  });

  // ─── Submit Code (Student) ───────────────────────────────────────────────────
  socket.on("submitCode", ({ roomId, userName, code, language }) => {
    // Notify teacher(s) in room
    io.to(roomId).emit("codeSubmitted", { userName, code, language, timestamp: new Date().toISOString() });
  });

  // ─── Disconnect ──────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      const state = rooms.get(currentRoom);
      if (state) {
        state.users.delete(socket.id);
        state.activeEditors.delete(currentUser);
        state.pendingHands.delete(currentUser);
        io.to(currentRoom).emit("userLeft", currentUser);
        broadcastUsers(currentRoom);
      }
    }
    console.log("❌ User Disconnected:", socket.id);
  });
});

// Helper to send toast notification to a room
function toast(roomId, message) {
  // No-op helper, client handles toasts via userJoined/userLeft events
}

// ─── Serve Frontend ──────────────────────────────────────────────────────────
const distPath = resolve(process.cwd(), 'frontend', 'dist');

// Serve static assets (JS, CSS, images, etc.) with correct MIME types
app.use(express.static(distPath));

// SPA fallback — only for non-API, non-asset routes, serve index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next(); // frontend not built yet
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 CodeVerse Classroom Server running at http://localhost:${port}`);
});