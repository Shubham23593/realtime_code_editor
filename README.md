# 🚀 CodeVerse Classroom — Real-Time Collaborative Code Editor

<div align="center">

![CodeVerse Classroom](https://img.shields.io/badge/CodeVerse-Classroom%20Edition-6366f1?style=for-the-badge&logo=code&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

**A full-stack, real-time collaborative coding platform built for classroom environments.**  
Teachers create & manage coding sessions; students join, collaborate, and submit code in real time.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Socket Events](#-socket-events)
- [Editor Modes](#-editor-modes)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

**CodeVerse Classroom Edition** is a real-time collaborative code editor designed for educational environments. It features:

- 🔐 JWT-based authentication with **Teacher** and **Student** roles
- 🏠 Room-based collaboration with shareable invite links
- 💻 Monaco Editor with multi-language support (C, C++, Python, JavaScript, Java)
- ⚡ Server-side code compilation & execution
- 🎓 Teacher-controlled permission modes for live coding sessions
- 💬 Real-time in-room chat ("Comm Link")
- 📊 Code submission & teacher evaluation system

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure JWT-based login & signup
- Role-based access: **Teacher** and **Student**
- Protected routes with persistent sessions via `localStorage`

### 🏠 Room Management
- Teachers can **create, name, and share** coding rooms
- Students join via **unique room ID or invite link**
- Real-time participant list with live connection status
- Teacher can **kick** students from a room

### 💻 Code Editor
- Powered by **Monaco Editor** (VS Code engine)
- Supports: **C, C++, Python, JavaScript, Java**
- Language templates auto-load on switch
- Import local code files directly into the editor
- Read-only overlay for students without edit permission

### ⚡ Real-Time Code Execution
- Server-side compilation via Node.js subprocess (`gcc`, `g++`, `python`, `javac`, `node`)
- Standard input (stdin) support
- Terminal output panel
- Results broadcast to all users in the room

### 🎓 Teacher Controls
- **4 Editor Modes** (see [Editor Modes](#-editor-modes))
- Post problems/tasks directly to the room
- Approve or deny student hand-raise requests
- Grant/revoke individual edit access
- View all student code submissions in a modal

### 💬 Real-Time Chat
- In-room chat panel ("Comm Link")
- Unread message badge counter
- Timestamps on every message

### 📊 Submission System
- Students submit code with one click
- Teacher reviews submissions — includes code, language, output, and timestamp
- Submissions stored persistently in MongoDB

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, TailwindCSS 4 |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Real-Time** | Socket.IO (client + server) |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB with Mongoose |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **3D / Animations** | Three.js, `@react-three/fiber`, `@react-three/drei`, Framer Motion, GSAP |
| **UI Icons** | React Icons |
| **Notifications** | React Toastify |
| **HTTP Client** | Axios |
| **Dev Tools** | Nodemon, Concurrently, ESLint |

---

## 📁 Project Structure

```
realtime_code_editor/
│
├── backend/
│   ├── index.js              # Express server, Socket.IO, code execution engine
│   ├── .env                  # Environment variables (not committed)
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification middleware
│   ├── models/
│   │   ├── User.js           # User schema (name, email, password, role)
│   │   ├── Room.js           # Room schema (name, teacherId, mode, problem)
│   │   └── Submission.js     # Submission schema (code, language, output, status)
│   └── routes/
│       ├── authRoutes.js     # POST /api/auth/register, /api/auth/login
│       ├── roomRoutes.js     # CRUD for rooms + GET room info
│       └── submissionRoutes.js # POST /api/submissions, GET /api/submissions/:roomId
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Routes configuration
│       ├── index.css
│       ├── context/
│       │   └── AuthContext.jsx   # Global auth state
│       ├── components/
│       │   ├── AnimatedBackground.jsx  # Animated particle canvas
│       │   ├── Hero3DModel.jsx         # Three.js 3D landing hero
│       │   ├── Preloader.jsx           # Cinematic loading screen
│       │   └── ProtectedRoute.jsx      # Auth-guarded route wrapper
│       └── pages/
│           ├── LandingPage.jsx         # Public hero / marketing page
│           ├── LoginPage.jsx           # Login form
│           ├── SignupPage.jsx          # Signup form with role selection
│           ├── TeacherDashboard.jsx    # Teacher: create/manage rooms
│           ├── StudentDashboard.jsx    # Student: join rooms, view history
│           └── RoomPage.jsx            # Main collaborative editor room
│
├── temp/                     # Temporary code execution files (auto-cleaned)
├── package.json              # Root scripts (runs backend + frontend concurrently)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Version |
|------|---------|
| Node.js | v18 or higher |
| npm | v9 or higher |
| MongoDB Atlas | (cloud) or local MongoDB |
| GCC / G++ | For C/C++ execution |
| Python | For Python execution |
| Java JDK | For Java execution |

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shubham23593/realtime_code_editor.git
   cd realtime_code_editor
   ```

2. **Install all dependencies** (root + frontend)
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Configure environment variables** (see [Environment Variables](#-environment-variables))
   ```bash
   # Create backend/.env with the required values
   ```

4. **Run in development mode** (starts backend + frontend concurrently)
   ```bash
   npm run dev:all
   ```

5. **Open in browser**
   ```
   Frontend → http://localhost:5173
   Backend  → http://localhost:5000
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend only (with nodemon) |
| `npm run dev:frontend` | Start frontend Vite dev server only |
| `npm run dev:all` | Start **both** backend & frontend concurrently |
| `npm start` | Start backend in production mode |
| `npm run build` | Install deps and build frontend for production |

---

## 🔧 Environment Variables

Create a file at `backend/.env` with the following variables:

```env
# MongoDB connection string (Atlas or local)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT secret key (use a long, random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server port (optional, defaults to 5000)
PORT=5000
```

> ⚠️ **Never commit your `.env` file.** It is included in `.gitignore`.

---

## 📡 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register a new user (name, email, password, role) | ❌ |
| `POST` | `/api/auth/login` | Login and receive a JWT token | ❌ |

### Room Routes — `/api/rooms`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/rooms` | Create a new room (Teacher only) | ✅ |
| `GET` | `/api/rooms` | Get all rooms for the logged-in teacher | ✅ |
| `GET` | `/api/rooms/:id` | Get room details by ID | ✅ |
| `POST` | `/api/rooms/:id/problem` | Post a problem to the room | ✅ Teacher |

### Submission Routes — `/api/submissions`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/submissions` | Submit code (Student) | ✅ |
| `GET` | `/api/submissions/:roomId` | Get all submissions for a room (Teacher) | ✅ |

---

## ⚡ Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ roomId, userName, role, email }` | Join a room |
| `leaveRoom` | `{ roomId, userName }` | Leave a room |
| `codeChange` | `{ roomId, code }` | Broadcast code changes |
| `languageChange` | `{ roomId, language }` | Change editor language |
| `typing` | `{ roomId, userName }` | Typing indicator |
| `chatMessage` | `{ roomId, user, message }` | Send a chat message |
| `compileCode` | `{ roomId, code, language, version, stdin }` | Compile and run code |
| `changeMode` | `{ roomId, mode }` | Change editor permission mode (Teacher) |
| `raiseHand` | `{ roomId, userName }` | Request edit permission (Student) |
| `approveHand` | `{ roomId, targetUser }` | Approve edit request (Teacher) |
| `rejectHand` | `{ roomId, targetUser }` | Reject edit request (Teacher) |
| `revokeEdit` | `{ roomId, targetUser }` | Revoke edit access (Teacher) |
| `kickUser` | `{ roomId, targetUser }` | Remove user from room (Teacher) |
| `postProblem` | `{ roomId, problem, problemTitle }` | Post a problem (Teacher) |
| `submitCode` | `{ roomId, userName, code, language }` | Submit code (Student) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `roomState` | `{ mode, activeEditors, pendingHands }` | Initial room state on join |
| `usersUpdate` | `[ { name, role, canEdit } ]` | Updated participants list |
| `userJoined` | `userName` | A user joined the room |
| `userLeft` | `userName` | A user left the room |
| `codeUpdate` | `code` | Synced code from another user |
| `languageUpdate` | `language` | Language changed by another user |
| `userTyping` | `userName` | Typing indicator from another user |
| `chatMessage` | `{ user, message, timestamp }` | Incoming chat message |
| `codeResponse` | `{ run: { output } }` | Compilation result |
| `modeChanged` | `{ mode, activeEditors }` | Editor mode changed |
| `handRaised` | `{ userName, pendingHands }` | Student raised hand |
| `editApproved` | `{ userName, activeEditors }` | Edit request approved |
| `editRejected` | `{ userName, pendingHands }` | Edit request rejected |
| `editRevoked` | `{ userName, activeEditors }` | Edit access revoked |
| `youWereKicked` | `{ message }` | Kicked from room |
| `userKicked` | `userName` | Another user was kicked |
| `problemPosted` | `{ problem, problemTitle }` | New problem posted |
| `codeSubmitted` | `{ userName }` | A student submitted code |

---

## 🎓 Editor Modes

Teachers can switch between 4 permission modes at any time:

| Mode | Icon | Who can edit? |
|------|------|---------------|
| **Free Mode** | 🟢 | Everyone in the room |
| **Teacher Only** | 🟡 | Teacher only |
| **Raise Hand** | 🔵 | Teacher + students approved by teacher |
| **Group Mode** | 🟣 | Teacher + a limited group of approved students |

Switching modes instantly recalculates and broadcasts edit permissions to all room members.

---

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

This installs all dependencies and builds the React frontend into `frontend/dist/`. The backend serves the static files automatically.

### Start Production Server

```bash
npm start
```

The server serves both the API and the built frontend from a single `PORT` (default: `5000`).

### Environment (Production)

Set the following on your hosting platform (e.g., Render, Railway, Heroku):

```
MONGO_URI=<your_atlas_uri>
JWT_SECRET=<your_secret>
PORT=5000
```

### Frontend Environment (if deploying separately)

Create `frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.com
```

---

## 🖥 Screenshots

> Coming soon — live demo screenshots of the Landing Page, Teacher Dashboard, Collaborative Room, and Submissions panel.

---

## 👨‍💻 Author

**Shubham Dalvi**  
Mini Project — Semester 6  
[![GitHub](https://img.shields.io/badge/GitHub-Shubham23593-181717?style=flat&logo=github)](https://github.com/Shubham23593)

---

## 📄 License

This project is licensed under the **ISC License**.
