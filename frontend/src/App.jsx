import { useEffect, useState } from "react";
import "./index.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000/");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("userJoined", (users) => setUsers(users));
    socket.on("codeUpdate", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing`);
      setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLanguage) => setLanguage(newLanguage));

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => socket.emit("leaveRoom");
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start code here");
    setLanguage("javascript");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 px-4">
        <div className="bg-gray-800 shadow-xl rounded-xl p-8 w-full max-w-md backdrop-blur-md bg-opacity-70">
          <h1 className="text-3xl font-extrabold text-white text-center mb-6 tracking-wide">
            🚀 Join a Code Room
          </h1>
          <input
            className="w-full mb-4 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button
            onClick={joinRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-300 shadow-md"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-gray-900 text-white p-4 md:p-6 flex flex-col justify-between shadow-lg">
        <div>
          <h2 className="text-xl font-bold mb-2">Room: <span className="text-blue-400">{roomId}</span></h2>
          <button
            onClick={copyRoomId}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded mb-2 text-sm w-full"
          >
            Copy ID
          </button>
          {copySuccess && <p className="text-green-400 text-xs">{copySuccess}</p>}

          <h3 className="mt-6 font-semibold text-lg">👥 Users</h3>
          <ul className="text-sm list-disc list-inside mb-4">
            {users.map((user, index) => (
              <li key={index}>{user.slice(0, 8)}...</li>
            ))}
          </ul>

          <p className="text-yellow-400 text-sm italic mb-4">{typing}</p>

          <label className="block mt-4 mb-1 text-sm font-medium">Language:</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-full"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <button
          onClick={leaveRoom}
          className="bg-red-600 hover:bg-red-700 text-white mt-6 py-2 px-4 rounded w-full shadow-md"
        >
          🚪 Leave Room
        </button>
      </div>

      {/* Code Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
};

export default App;
