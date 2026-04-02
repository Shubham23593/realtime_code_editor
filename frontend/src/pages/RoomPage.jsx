import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaSignOutAlt, FaPlay, FaFileUpload, FaComments,
  FaHandPaper, FaUsers, FaCode, FaLink, FaEye,
  FaChalkboardTeacher, FaTimes, FaPaperPlane, FaCog,
  FaCheck, FaBan, FaCheckCircle, FaChartBar, FaSun, FaMoon
} from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LANG_TEMPLATES = {
  c: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  python: `print("Hello, World!")`,
  javascript: `console.log("Hello, World!");`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
};

let socket;

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, authHeader } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [code, setCode] = useState(LANG_TEMPLATES.c);
  const [language, setLanguage] = useState('c');
  const [output, setOutput] = useState('');
  const [inputData, setInputData] = useState('');
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showPanel, setShowPanel] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState('dark');

  // Permission system
  const [mode, setMode] = useState('free');
  const [activeEditors, setActiveEditors] = useState([]);
  const [pendingHands, setPendingHands] = useState([]);
  const [handRaised, setHandRaised] = useState(false);

  // Problem
  const [problem, setProblem] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [showProblem, setShowProblem] = useState(false);
  const [problemInput, setProblemInput] = useState('');
  const [problemTitleInput, setProblemTitleInput] = useState('');

  // Room info
  const [roomInfo, setRoomInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModePanel, setShowModePanel] = useState(false);
  const [connected, setConnected] = useState(false);

  const chatEndRef = useRef(null);
  const isTeacher = user?.role === 'teacher';

  // ── canEdit logic ──────────────────────────────────────────────────────────
  const canEdit = (() => {
    if (mode === 'free') return true;
    if (mode === 'teacher') return isTeacher;
    if (mode === 'raise_hand') return isTeacher || activeEditors.includes(user?.name);
    if (mode === 'group') return activeEditors.includes(user?.name);
    return false;
  })();

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    socket = io(SOCKET_URL);
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', {
        roomId,
        userName: user?.name,
        role: user?.role,
        email: user?.email,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('roomState', ({ mode: m, activeEditors: ae, pendingHands: ph }) => {
      setMode(m);
      setActiveEditors(ae);
      setPendingHands(ph);
    });

    socket.on('usersUpdate', (userList) => setUsers(userList));
    socket.on('userJoined', (name) => { if (name !== user?.name) toast.success(`${name} joined`); });
    socket.on('userLeft', (name) => { if (name !== user?.name) toast.info(`${name} left`); });

    socket.on('codeUpdate', (newCode) => setCode(newCode));
    socket.on('languageUpdate', (lang) => setLanguage(lang));
    socket.on('userTyping', (name) => { setTyping(`${name} is typing...`); setTimeout(() => setTyping(''), 2000); });

    socket.on('chatMessage', ({ user: u, message, timestamp }) => {
      setChatMessages(prev => [...prev, { user: u, message, timestamp }]);
      if (!showChat) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('codeResponse', (res) => setOutput(res.run?.output || 'No output'));

    // Permission events
    socket.on('modeChanged', ({ mode: m, activeEditors: ae }) => {
      setMode(m); setActiveEditors(ae);
      toast.info(`Editor mode: ${m.replace('_', ' ').toUpperCase()}`);
    });

    socket.on('handRaised', ({ userName: un, pendingHands: ph }) => {
      setPendingHands(ph);
      if (isTeacher) toast.info(`${un} wants to edit!`);
    });

    socket.on('editApproved', ({ userName: un, activeEditors: ae }) => {
      setActiveEditors(ae);
      if (un === user?.name) { toast.success('You can now edit the code!'); setHandRaised(false); }
    });

    socket.on('editRejected', ({ userName: un, pendingHands: ph }) => {
      setPendingHands(ph);
      if (un === user?.name) { toast.error('Edit request rejected'); setHandRaised(false); }
    });

    socket.on('editRevoked', ({ userName: un, activeEditors: ae }) => {
      setActiveEditors(ae);
      if (un === user?.name) toast.warn('Your edit access was revoked');
    });

    socket.on('youWereKicked', ({ message }) => {
      toast.error(message); setTimeout(() => navigate('/dashboard'), 2000);
    });

    socket.on('userKicked', (un) => { if (un !== user?.name) toast.warn(`${un} was removed from the room`); });

    socket.on('problemPosted', ({ problem: p, problemTitle: pt }) => {
      setProblem(p); setProblemTitle(pt);
      toast.info('New problem posted by teacher!');
      setShowProblem(true);
    });

    socket.on('codeSubmitted', ({ userName: un }) => {
      if (isTeacher) toast.success(`${un} submitted their code!`);
    });

    return () => {
      socket.emit('leaveRoom', { roomId, userName: user?.name });
      socket.disconnect();
    };
  }, [roomId, user]);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/rooms/${roomId}`, { headers: authHeader() });
        setRoomInfo(res.data.room);
        setMode(res.data.room.mode);
        if (res.data.room.problem) { setProblem(res.data.room.problem); setProblemTitle(res.data.room.problemTitle); }
      } catch {}
    };
    loadRoom();
  }, [roomId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // for direct tailwind dark mode toggles:
    if(theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCodeChange = (newCode) => {
    if (!canEdit) return;
    setCode(newCode);
    socket.emit('codeChange', { roomId, code: newCode });
    socket.emit('typing', { roomId, userName: user?.name });
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(LANG_TEMPLATES[lang]);
    socket.emit('languageChange', { roomId, language: lang });
  };

  const runCode = () => {
    socket.emit('compileCode', { code, roomId, language, version: '*', stdin: inputData });
    setOutput('Compiling...');
    toast.info('Compiling code...');
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    socket.emit('chatMessage', { roomId, user: user?.name, message: msg });
    setChatInput('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => setCode(evt.target.result);
    reader.readAsText(file);
  };

  const leaveRoom = () => {
    socket.emit('leaveRoom', { roomId, userName: user?.name });
    navigate('/dashboard');
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    toast.success('Invite link copied!');
  };

  const raiseHand = () => {
    socket.emit('raiseHand', { roomId, userName: user?.name });
    setHandRaised(true);
    toast.info('Hand raised! Waiting for approval...');
  };

  const approveHand = (targetUser) => { socket.emit('approveHand', { roomId, targetUser }); };
  const rejectHand = (targetUser) => { socket.emit('rejectHand', { roomId, targetUser }); };
  const revokeEdit = (targetUser) => { socket.emit('revokeEdit', { roomId, targetUser }); };
  const kickUser = (targetUser) => {
    if (confirm(`Remove ${targetUser} from the room?`)) {
      socket.emit('kickUser', { roomId, targetUser });
    }
  };

  const changeMode = (newMode) => {
    socket.emit('changeMode', { roomId, mode: newMode });
    setShowModePanel(false);
    toast.success(`Mode changed to ${newMode.replace('_', ' ')}`);
  };

  const postProblem = () => {
    if (!problemInput.trim()) return toast.error('Problem cannot be empty');
    socket.emit('postProblem', { roomId, problem: problemInput, problemTitle: problemTitleInput });
    axios.post(`${API_BASE}/api/rooms/${roomId}/problem`, { problem: problemInput, problemTitle: problemTitleInput }, { headers: authHeader() }).catch(() => {});
    setProblemInput(''); setProblemTitleInput('');
    toast.success('Problem posted!');
  };

  const submitCode = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/submissions`, { roomId, code, language, output }, { headers: authHeader() });
      socket.emit('submitCode', { roomId, userName: user?.name, code, language });
      toast.success('Code submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/submissions/${roomId}`, { headers: authHeader() });
      setSubmissions(res.data.submissions);
      setShowSubmissions(true);
    } catch { toast.error('Failed to load submissions'); }
  };

  const modeColors = { free: 'border-green-500 text-green-500', teacher: 'border-amber-500 text-amber-500', raise_hand: 'border-blue-500 text-blue-500', group: 'border-purple-500 text-purple-500' };
  const modeLabel = { free: 'Free Mode', teacher: 'Teacher Only', raise_hand: 'Raise Hand', group: 'Group Mode' };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={leaveRoom} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 rounded-md transition" title="Back to Dashboard">
            <FaSignOutAlt />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate">{roomInfo?.name || roomId}</span>
            <code className="text-[10px] font-mono text-indigo-500 truncate">{roomId}</code>
          </div>
          <div className={`text-[10px] font-bold px-3 py-1 rounded-full border ${modeColors[mode]} hidden sm:block`}>
            {modeLabel[mode]}
          </div>
          {!canEdit && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              <FaEye /> Read-only
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition" title="Toggle Theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          
          <span className={`w-2 h-2 rounded-full hidden sm:block ${connected ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-red-500'}`} title={connected ? 'Connected' : 'Disconnected'} />
          
          <button onClick={() => setShowPanel(!showPanel)} className="md:hidden p-2 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Settings">
            <FaCog />
          </button>
          
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5"><FaUsers /> {users.length}</span>
          
          <button onClick={copyInviteLink} className="p-2 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-md hover:text-indigo-500 hover:border-indigo-500 transition hidden sm:block" title="Copy invite link">
            <FaLink />
          </button>
          
          <button onClick={() => setShowChat(!showChat)} className={`relative p-2 border ${showChat ? 'border-indigo-500 text-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-500'} rounded-md transition`} title="Chat">
            <FaComments />
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {isTeacher && (
            <button onClick={() => setShowModePanel(!showModePanel)} className={`p-2 border ${showModePanel ? 'border-indigo-500 text-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-500'} rounded-md transition`} title="Change Mode">
              <FaChalkboardTeacher />
            </button>
          )}
        </div>
      </header>

      {/* ── Mode Panel (Teacher) ── */}
      {isTeacher && showModePanel && (
        <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 flex flex-wrap items-center gap-4 flex-shrink-0 shadow-inner">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Editor Mode:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(modeLabel).map(([key, label]) => (
              <button key={key} onClick={() => changeMode(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${mode === key ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-500' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        
        {/* ── Left Sidebar ── */}
        <aside className={`${showPanel ? 'flex absolute inset-y-0 left-0 z-40 shadow-xl' : 'hidden'} md:flex flex-col w-64 min-w-[16rem] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto`}>
          
          {/* Participants */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FaUsers /> Participants ({users.length})</h3>
            <div className="flex flex-col gap-2">
              {users.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">{u.name?.[0]?.toUpperCase()}</span>
                    <span className="text-xs truncate">{u.name === user?.name ? `${u.name} (You)` : u.name}</span>
                    {u.role === 'teacher' && <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 border border-amber-200 shrink-0">T</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.canEdit ? <FaCode className="text-slate-400 text-xs" title="Can edit" /> : <FaEye className="text-slate-300 text-xs" title="Read-only" />}
                    {isTeacher && u.name !== user?.name && (
                      <div className="flex gap-1 ml-1">
                        {!u.canEdit && u.role !== 'teacher' && (
                          <button onClick={() => approveHand(u.name)} className="p-1 rounded bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100" title="Grant edit"><FaCheck className="text-[10px]" /></button>
                        )}
                        {u.canEdit && u.role !== 'teacher' && (
                          <button onClick={() => revokeEdit(u.name)} className="p-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-100" title="Revoke edit"><FaTimes className="text-[10px]" /></button>
                        )}
                        <button onClick={() => kickUser(u.name)} className="p-1 rounded bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100" title="Remove user"><FaBan className="text-[10px]" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {typing && <p className="text-[10px] text-amber-500 italic mt-2">{typing}</p>}
          </div>

          {/* Pending Hands */}
          {isTeacher && pendingHands.length > 0 && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
              <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><FaHandPaper /> Raised Hands ({pendingHands.length})</h3>
              {pendingHands.map((name, i) => (
                <div key={i} className="flex flex-col gap-2 text-xs py-1">
                  <span>{name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => approveHand(name)} className="flex-1 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-[10px]">Allow</button>
                    <button onClick={() => rejectHand(name)} className="flex-1 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold text-[10px]">Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Language & File Upload */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><FaCode /> Language</h3>
              <select value={language} onChange={handleLanguageChange} className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:border-indigo-500">
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
            </div>
            <div>
              <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-400 dark:border-slate-600 rounded-md text-xs text-slate-500 font-medium cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <FaFileUpload /> Upload File
              </label>
              {uploadedFileName && <p className="text-[10px] text-green-500 mt-1 truncate">{uploadedFileName}</p>}
            </div>
          </div>

          {/* Teacher: Post Problem */}
          {isTeacher && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2"><FaChalkboardTeacher /> Post Problem</h3>
              <input
                type="text"
                value={problemTitleInput}
                onChange={(e) => setProblemTitleInput(e.target.value)}
                placeholder="Problem title..."
                className="w-full text-xs px-2 py-1.5 mb-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:border-amber-500"
              />
              <textarea
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                placeholder="Describe problem..."
                rows={3}
                className="w-full text-xs p-2 mb-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md resize-y focus:outline-none focus:border-amber-500"
              />
              <button onClick={postProblem} className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm">Post to Students</button>
            </div>
          )}

          {/* Teacher: View Submissions */}
          {isTeacher && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <button onClick={loadSubmissions} className="w-full flex items-center justify-center gap-2 py-2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                <FaChartBar /> View Submissions
              </button>
            </div>
          )}

          {/* Student: Actions */}
          {!isTeacher && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2 mt-auto">
              {(mode === 'raise_hand' || mode === 'group') && !canEdit && (
                <button onClick={raiseHand} disabled={handRaised} className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded text-white transition ${handRaised ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}>
                  <FaHandPaper /> {handRaised ? 'Waiting...' : 'Raise Hand'}
                </button>
              )}
              <button onClick={submitCode} disabled={submitting} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded bg-green-600 hover:bg-green-700 text-white transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                <FaPaperPlane /> {submitting ? 'Submitting...' : 'Submit Code'}
              </button>
            </div>
          )}

        </aside>

        {/* ── Editor & Output Area ── */}
        <div className={`flex flex-col flex-1 min-w-0 ${showPanel && 'hidden md:flex'}`}>
          
          {/* Problem Banner */}
          {problem && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/50 p-3 shrink-0">
              <div className="flex items-center justify-between text-xs font-bold text-amber-600">
                <span>Problem: {problemTitle || 'Statement'}</span>
                <button onClick={() => setShowProblem(!showProblem)} className="focus:outline-none hover:text-amber-700">{showProblem ? 'Hide' : 'Show'}</button>
              </div>
              {showProblem && <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{problem}</p>}
            </div>
          )}

          {/* CodeMirror/Monaco Wrapper */}
          <div className="flex-1 relative min-h-0 bg-white dark:bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                readOnly: !canEdit,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: canEdit ? 'all' : 'none',
              }}
            />
            {!canEdit && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm border border-red-500/50 rounded-full px-4 py-1.5 text-xs text-red-400 font-medium flex items-center gap-2 pointer-events-none">
                <FaEye /> Read-only — {mode === 'raise_hand' ? 'Raise hand to edit' : 'Waiting for teacher'}
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="h-48 shrink-0 flex flex-col border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button onClick={runCode} className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition">
                <FaPlay /> Run Code
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded">{language.toUpperCase()}</span>
            </div>
            
            <div className="flex flex-1 min-h-0 divide-x divide-slate-200 dark:divide-slate-800">
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Input (stdin)</div>
                <textarea
                  className="flex-1 w-full bg-white dark:bg-slate-950 border-none resize-none p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Provide input here..."
                />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">Output</div>
                <pre className="flex-1 w-full bg-slate-50 dark:bg-slate-950 overflow-y-auto p-3 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap word-break">
                  {output || 'Output will appear here...'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chat Panel ── */}
        {showChat && (
          <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-40 shadow-2xl sm:relative sm:shadow-none transition-all">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><FaComments className="text-indigo-500" /> Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><FaTimes /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-50 dark:bg-slate-950/50">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-8">No messages yet.</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col max-w-[85%] ${msg.user === user?.name ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-[9px] text-slate-400 mb-0.5 font-medium">{msg.user === user?.name ? 'You' : msg.user}</span>
                    <div className={`px-3 py-1.5 text-xs rounded-lg rounded-tl-sm ${msg.user === user?.name ? 'bg-indigo-600 text-white rounded-br-sm rounded-bl-lg rounded-tr-lg rounded-tl-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm rounded-br-lg rounded-tr-lg rounded-tl-lg text-slate-800 dark:text-slate-200'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type..."
                className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none transition-colors"
              />
              <button onClick={sendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs transition-colors shrink-0"><FaPaperPlane /></button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Submissions Modal ── */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowSubmissions(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Student Submissions</h2>
              <button onClick={() => setShowSubmissions(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><FaTimes /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {submissions.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No submissions yet.</p>
              ) : (
                submissions.map((sub, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex-1">{sub.studentName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded">{sub.language.toUpperCase()}</span>
                      <span className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleString()}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 uppercase">{sub.status}</span>
                    </div>
                    <div className="bg-slate-950 rounded-md border border-slate-800 overflow-hidden">
                      <pre className="p-3 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 overflow-y-auto">{sub.code}</pre>
                    </div>
                    {sub.output && (
                      <div className="mt-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-md overflow-hidden">
                        <pre className="p-2 text-xs font-mono text-green-700 dark:text-green-400 max-h-24 overflow-y-auto">{sub.output}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
