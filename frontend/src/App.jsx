import { useEffect, useState } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaSignOutAlt,
  FaPlay,
  FaCopy,
  FaRocket,
  FaCheckCircle,
  FaFileUpload,
  FaComments,
} from "react-icons/fa";

const socket = io("https://realtime-code-editor-ehmj.onrender.com");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("c");
  const [code, setCode] = useState("// Write your C code here");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [inputData, setInputData] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showChat, setShowChat] = useState(false);

  const version = "*";

  useEffect(() => {
    socket.on("userJoined", (users, joiningUser) => {
      setUsers(users);
      if (joiningUser && joiningUser !== userName) {
        toast.success(`${joiningUser} joined the room`);
      }
    });

    socket.on("userLeft", (users, leavingUser) => {
      setUsers(users);
      if (leavingUser && leavingUser !== userName) {
        toast.info(`${leavingUser} left the room`);
      }
    });

    socket.on("codeUpdate", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing`);
      setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLanguage) => setLanguage(newLanguage));
    socket.on("codeResponse", (response) => {
      setInputData(response.run.output);
    });
    socket.on("chatMessage", ({ user, message }) => {
      if (user !== userName) {
        setChatMessages((prev) => [...prev, { user, message }]);
      }
    });

    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
      socket.off("chatMessage");
    };
  }, [userName]);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
      toast.success(`🚀 ${userName} successfully joined the room!`);
    } else {
      toast.error("Please enter Room ID and Username");
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomId, userName });
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Write your C code here");
    setInputData("");
    setLanguage("c");
    setChatMessages([]);
    toast.info(`🚪 ${userName} left the room`);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("languageChange", { roomId, language: newLang });

    const templates = {
      c: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      python: `print("Hello, World!")`,
      javascript: `console.log("Hello, World!");`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    };

    setCode(templates[newLang]);
  };

  const runCode = () => {
    socket.emit("compileCode", {
      code,
      roomId,
      language,
      version,
      stdin: inputData,
    });
    toast.info("🧠 Compiling code...");
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      const message = chatInput;
      setChatMessages((prev) => [...prev, { user: userName, message }]);
      socket.emit("chatMessage", { roomId, user: userName, message });
      setChatInput("");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => setCode(evt.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-900 text-white">
      <ToastContainer />
      {!joined ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="shadow-lg rounded-xl p-8 w-full max-w-md bg-gray-800">
            <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <FaRocket className="text-purple-500" /> Join a Code Room
            </h1>
            <input 
              type="text" 
              placeholder="Room ID" 
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)} 
              className="w-full mb-4 px-4 py-2 rounded border bg-gray-700 border-gray-600" 
            />
            <input 
              type="text" 
              placeholder="Your Name" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              className="w-full mb-6 px-4 py-2 rounded border bg-gray-700 border-gray-600" 
            />
            <button 
              onClick={joinRoom} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex justify-center items-center gap-2"
            >
              <FaCheckCircle /> Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2">
              <span className="font-bold">{roomId}</span>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowChat(!showChat)} 
                className="p-2 rounded-full bg-gray-700"
              >
                <FaComments />
              </button>
              <button 
                onClick={leaveRoom} 
                className="p-2 rounded-full bg-red-600"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <div className={`${showChat ? 'hidden' : 'block'} md:block w-full md:w-72 p-4 border-r border-gray-700 bg-gray-800`}>
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl font-bold">Room Controls</h2>
                <label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                  <FaFileUpload className="text-blue-400 hover:text-blue-300" />
                </label>
              </div>

              {uploadedFileName && (
                <p className="text-sm text-green-500 truncate mb-2">📁 {uploadedFileName}</p>
              )}

              <div className="mb-4">
                <p className="text-sm"><strong>You:</strong> {userName}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm"><strong>Room:</strong> {roomId}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(roomId)} 
                    className="text-sm text-blue-500 hover:text-blue-400"
                  >
                    <FaCopy className="inline" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <strong className="block mb-1">Active Users ({users.length}):</strong>
                <div className="flex flex-wrap gap-2">
                  {users.map((user, i) => (
                    <span key={i} className="bg-gray-700 px-2 py-1 rounded text-sm">
                      {user.slice(0, 8)}...
                    </span>
                  ))}
                </div>
                <p className="italic text-yellow-500 text-xs mt-1">{typing}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-1">Language:</label>
                <select 
                  value={language} 
                  onChange={handleLanguageChange} 
                  className="w-full border rounded px-2 py-1 bg-gray-700 border-gray-600"
                >
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <button 
                onClick={leaveRoom} 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2"
              >
                <FaSignOutAlt /> Leave Room
              </button>
            </div>

            <div className={`${showChat ? 'hidden' : 'block'} md:block flex-1 flex flex-col overflow-hidden`}>
              <div className="h-[50vh] min-h-[300px]">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>

              <div className="p-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={runCode} 
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <FaPlay /> Execute
                  </button>
                  <div className="text-sm">
                    Language: <span className="font-bold">{language.toUpperCase()}</span>
                  </div>
                </div>
                <textarea 
                  className="w-full h-40 p-3 border rounded resize-none font-mono text-sm bg-gray-800 border-gray-700" 
                  value={inputData} 
                  onChange={(e) => setInputData(e.target.value)} 
                  placeholder="Output will appear here..." 
                />
              </div>
            </div>

            <div className={`${showChat ? 'block' : 'hidden'} md:block w-full md:w-72 p-4 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col bg-gray-800`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaComments /> Chat
                </h2>
                <button 
                  onClick={() => setShowChat(false)} 
                  className="md:hidden p-1 rounded-full bg-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-2 space-y-2 pr-2">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No messages yet. Start the conversation!</p>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="text-sm break-words">
                      <span className={`font-bold ${msg.user === userName ? 'text-green-400' : 'text-blue-400'}`}>
                        {msg.user === userName ? 'You' : msg.user.slice(0, 8)}:
                      </span> {msg.message}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
                  className="flex-1 px-3 py-2 border rounded bg-gray-700 border-gray-600" 
                  placeholder="Type a message..." 
                />
                <button 
                  onClick={sendMessage} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
