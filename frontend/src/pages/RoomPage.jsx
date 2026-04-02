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
  FaCheck, FaBan, FaCheckCircle, FaChartBar, FaDesktop
} from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';

const API_BASE = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

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
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

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
    <div className="flex flex-col h-screen bg-[#060912] font-sans transition-colors duration-300 text-slate-100 overflow-hidden relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AnimatedBackground />

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#060912]/80 backdrop-blur-xl border-b border-slate-800/60 flex-shrink-0 z-50 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={leaveRoom} className="p-2 bg-slate-900/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/50 rounded-lg transition" title="Back to Dashboard">
            <FaSignOutAlt />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{roomInfo?.name || roomId}</span>
            <code className="text-[10px] font-mono text-indigo-400 truncate">{roomId}</code>
          </div>
          <div className={`text-[10px] font-bold px-3 py-1 rounded-md border backdrop-blur-md ${modeColors[mode]} hidden sm:block`}>
            {modeLabel[mode]}
          </div>
          {!canEdit && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
              <FaEye /> Read-only
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 relative z-10">
          
          <span className={`w-2 h-2 rounded-full hidden sm:block ${connected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500'}`} title={connected ? 'Connected' : 'Disconnected'} />
          
          <button onClick={() => setShowPanel(!showPanel)} className="md:hidden p-2 text-slate-400 border border-slate-700/50 rounded-lg hover:bg-slate-800/50" title="Settings">
            <FaCog />
          </button>
          
          <span className="text-sm text-slate-400 hidden sm:flex items-center gap-1.5"><FaUsers className="text-indigo-400" /> {users.length}</span>
          
          <button onClick={copyInviteLink} className="p-2 text-slate-400 border border-slate-700/50 rounded-lg hover:text-indigo-400 hover:border-indigo-500/50 transition hidden sm:block bg-slate-900/40" title="Copy invite link">
            <FaLink />
          </button>
          
          <button onClick={() => setShowChat(!showChat)} className={`relative p-2 border ${showChat ? 'border-indigo-500 text-indigo-400' : 'border-slate-700/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50'} rounded-lg transition bg-slate-900/40`} title="Chat">
            <FaComments />
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {isTeacher && (
            <button onClick={() => setShowModePanel(!showModePanel)} className={`p-2 border ${showModePanel ? 'border-indigo-500 text-indigo-400' : 'border-slate-700/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50'} rounded-lg transition bg-slate-900/40`} title="Change Mode">
              <FaChalkboardTeacher />
            </button>
          )}
        </div>
      </header>

      {/* ── Mode Panel (Teacher) ── */}
      {isTeacher && showModePanel && (
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 p-3 flex flex-wrap items-center gap-4 flex-shrink-0 relative z-20">
          <p className="text-xs font-bold text-slate-400 font-mono uppercase">Editor Mode:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(modeLabel).map(([key, label]) => (
              <button key={key} onClick={() => changeMode(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${mode === key ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-inner' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative z-10 w-full">
        
        {/* ── Left Sidebar ── */}
        <aside className={`${showPanel ? 'flex absolute inset-y-0 left-0 shadow-2xl z-40' : 'hidden'} md:flex flex-col w-72 min-w-[18rem] bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/60 overflow-y-auto`}>
          
          {/* Participants */}
          <div className="p-4 border-b border-slate-800/60">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-3 flex items-center gap-2"><FaUsers /> Participants ({users.length})</h3>
            <div className="flex flex-col gap-2">
              {users.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">{u.name?.[0]?.toUpperCase()}</span>
                    <span className="text-xs truncate font-medium text-slate-200">{u.name === user?.name ? `${u.name} (You)` : u.name}</span>
                    {u.role === 'teacher' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">T</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.canEdit ? <FaCode className="text-emerald-400 text-xs" title="Can edit" /> : <FaEye className="text-slate-500 text-xs" title="Read-only" />}
                    {isTeacher && u.name !== user?.name && (
                      <div className="flex gap-1 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                        {!u.canEdit && u.role !== 'teacher' && (
                          <button onClick={() => approveHand(u.name)} className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/40" title="Grant edit"><FaCheck className="text-[10px]" /></button>
                        )}
                        {u.canEdit && u.role !== 'teacher' && (
                          <button onClick={() => revokeEdit(u.name)} className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/40" title="Revoke edit"><FaTimes className="text-[10px]" /></button>
                        )}
                        <button onClick={() => kickUser(u.name)} className="p-1.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40" title="Remove user"><FaBan className="text-[10px]" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {typing && <p className="text-[10px] text-amber-400 italic mt-2 text-center animate-pulse">{typing}</p>}
          </div>

          {/* Pending Hands */}
          {isTeacher && pendingHands.length > 0 && (
            <div className="p-4 border-b border-slate-800/60 bg-blue-900/10 backdrop-blur-md">
              <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono mb-3 flex items-center gap-2"><FaHandPaper /> Raised Hands ({pendingHands.length})</h3>
              {pendingHands.map((name, i) => (
                <div key={i} className="flex flex-col gap-2 text-xs py-2 px-2 bg-slate-900/40 rounded-lg mb-2">
                  <span className="font-semibold">{name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => approveHand(name)} className="flex-1 py-1.5 rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-bold hover:bg-emerald-600/30 transition shadow-inner text-[10px]">Allow</button>
                    <button onClick={() => rejectHand(name)} className="flex-1 py-1.5 rounded-md bg-red-600/20 text-red-400 border border-red-600/30 font-bold hover:bg-red-600/30 transition shadow-inner text-[10px]">Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Language & File Upload */}
          <div className="p-4 border-b border-slate-800/60 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-2 flex items-center gap-2"><FaCode /> Language</h3>
              <select value={language} onChange={handleLanguageChange} className="w-full text-xs px-3 py-2 bg-slate-950/50 border border-slate-700/50 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-200 font-mono font-bold appearance-none">
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
            </div>
            <div>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800/40 border border-dashed border-slate-700 rounded-xl text-xs text-slate-400 font-bold font-mono cursor-pointer hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-800/80 transition-all">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <FaFileUpload className="text-sm" /> Import Local Code
              </label>
              {uploadedFileName && <p className="text-[10px] text-emerald-400 mt-2 truncate text-center font-mono">{uploadedFileName}</p>}
            </div>
          </div>

          {/* Teacher: Post Problem */}
          {isTeacher && (
            <div className="p-4 border-b border-slate-800/60">
              <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-2"><FaChalkboardTeacher /> Post Problem</h3>
              <input
                type="text"
                value={problemTitleInput}
                onChange={(e) => setProblemTitleInput(e.target.value)}
                placeholder="Problem logic title..."
                className="w-full text-xs px-3 py-2.5 mb-2 bg-slate-950/60 border border-slate-700/50 rounded-xl focus:outline-none focus:border-amber-500 placeholder-slate-600 font-mono text-white transition-colors"
              />
              <textarea
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                placeholder="Describe scenario/requirements..."
                rows={3}
                className="w-full text-xs p-3 mb-3 bg-slate-950/60 border border-slate-700/50 rounded-xl resize-y focus:outline-none focus:border-amber-500 placeholder-slate-600 font-mono text-white transition-colors"
              />
              <button onClick={postProblem} className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-500/20">Broadcast Problem</button>
            </div>
          )}

          {/* Teacher: View Submissions */}
          {isTeacher && (
            <div className="p-4 border-b border-slate-800/60">
              <button onClick={loadSubmissions} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition hover:bg-indigo-600/30">
                <FaChartBar className="text-sm" /> Evaluate Submissions
              </button>
            </div>
          )}

          {/* Student: Actions */}
          {!isTeacher && (
            <div className="p-4 border-b border-slate-800/60 space-y-3 mt-auto">
              {(mode === 'raise_hand' || mode === 'group') && !canEdit && (
                <button onClick={raiseHand} disabled={handRaised} className={`w-full flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl text-white transition-all shadow-lg ${handRaised ? 'bg-cyan-500/50 shadow-cyan-500/10 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20'}`}>
                  <FaHandPaper /> {handRaised ? 'Waiting for Approval...' : 'Raise Hand'}
                </button>
              )}
              <button onClick={submitCode} disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed">
                <FaPaperPlane /> {submitting ? 'Submitting Logic...' : 'Submit Code'}
              </button>
            </div>
          )}

        </aside>

        {/* ── Editor & Output Area ── */}
        <div className={`flex flex-col flex-1 min-w-0 bg-[#0a0f1c]/90 rounded-none md:rounded-tl-2xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-slate-800/60 ${showPanel && 'hidden md:flex'}`}>
          
          {/* Problem Banner */}
          {problem && (
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 m-4 rounded-2xl p-4 shrink-0 shadow-lg shadow-amber-500/5">
              <div className="flex items-center justify-between text-xs font-black text-amber-400 uppercase tracking-widest font-mono">
                <span>Task: {problemTitle || 'Exercise Statement'}</span>
                <button onClick={() => setShowProblem(!showProblem)} className="focus:outline-none hover:text-amber-300 py-1 px-3 border border-amber-500/30 rounded-md transition">{showProblem ? 'Minimize' : 'View'}</button>
              </div>
              {showProblem && <p className="text-sm font-mono text-slate-300 mt-3 whitespace-pre-wrap leading-relaxed">{problem}</p>}
            </div>
          )}

          {/* CodeMirror/Monaco Wrapper */}
          <div className="flex-1 relative min-h-0 bg-[#0a0f1c]">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
                readOnly: !canEdit,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: canEdit ? 'all' : 'none',
                padding: { top: 16 },
                lineHeight: 24
              }}
            />
            {!canEdit && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-950/80 backdrop-blur-md border border-red-500/50 rounded-full px-5 py-2 text-xs text-red-300 font-bold uppercase tracking-widest flex items-center gap-2 pointer-events-none shadow-xl shadow-red-500/10 relative z-50">
                <FaEye className="text-red-400" /> Read-only mode — {mode === 'raise_hand' ? 'Raise hand to edit' : 'Awaiting instructor'}
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="h-64 shrink-0 flex flex-col border-t border-slate-800/60 bg-slate-900/80 backdrop-blur-xl relative z-10">
            <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/60 bg-[#060912]/50">
              <button onClick={runCode} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all font-mono tracking-widest uppercase">
                <FaPlay /> Compile & Run
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md font-mono">{language.toUpperCase()}</span>
            </div>
            
            <div className="flex flex-1 min-h-0 divide-x divide-slate-800/60">
              <div className="flex-1 flex flex-col min-w-0 bg-[#030408]/50">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono px-4 py-2 border-b border-slate-800/60 flex items-center gap-2">Standard Input</div>
                <textarea
                  className="flex-1 w-full bg-transparent border-none resize-none px-4 py-3 text-xs font-mono text-slate-300 focus:outline-none placeholder-slate-700 leading-relaxed"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="// Provide stdin parameters here"
                />
              </div>
              <div className="flex-1 flex flex-col min-w-0 bg-[#030408]/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono px-4 py-2 border-b border-slate-800/60 flex items-center gap-2">Terminal Output</div>
                <pre className="flex-1 w-full bg-transparent overflow-y-auto px-4 py-3 text-xs font-mono text-emerald-400 whitespace-pre-wrap break-words leading-relaxed">
                  {output || '> Running execution cycle...'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chat Panel ── */}
        {showChat && (
          <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[340px] bg-slate-900/90 backdrop-blur-2xl border-l border-slate-800/60 flex flex-col z-50 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60 bg-[#060912]/50">
              <h3 className="text-sm font-bold flex items-center gap-2 font-mono uppercase tracking-widest text-slate-200"><FaComments className="text-indigo-400" /> Comm Link</h3>
              <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white bg-slate-800/50 rounded-md p-1.5 transition-colors border border-slate-700/50"><FaTimes /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-transparent">
              {chatMessages.length === 0 ? (
                <div className="text-xs text-slate-600 font-mono text-center flex flex-col items-center justify-center h-full opacity-50">
                  <FaComments className="text-3xl mb-3" />
                  <p>Encrypted channel open.</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col max-w-[90%] ${msg.user === user?.name ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">{msg.user === user?.name ? 'You' : msg.user}</span>
                    <div className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-lg font-mono ${msg.user === user?.name ? 'bg-indigo-600 text-white rounded-xl rounded-tr-sm shadow-indigo-500/20' : 'bg-slate-800/80 border border-slate-700/50 rounded-xl rounded-tl-sm text-slate-200'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 bg-[#060912]/80 border-t border-slate-800/60 flex gap-3 backdrop-blur-md">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Broadcast sequence..."
                className="flex-1 min-w-0 bg-slate-950/80 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono placeholder-slate-600 shadow-inner"
              />
              <button onClick={sendMessage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 shrink-0"><FaPaperPlane /></button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Submissions Modal ── */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-[#060912]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 relative" onClick={() => setShowSubmissions(false)}>
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-black relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-[#060912]/50 rounded-t-3xl">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}><FaCheckCircle className="text-emerald-400" /> Network Submissions</h2>
              <button onClick={() => setShowSubmissions(false)} className="p-2 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/50 transition-colors rounded-xl text-slate-400 hover:text-red-400"><FaTimes /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center opacity-50 py-16">
                   <FaChartBar className="text-4xl text-slate-600 mb-4" />
                   <p className="text-center font-mono text-slate-400 tracking-wider">Awaiting cadet logic sequences.</p>
                </div>
              ) : (
                submissions.map((sub, i) => (
                  <div key={i} className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className="font-bold text-lg text-white font-mono flex-1">{sub.studentName}</span>
                      <span className="text-[10px] font-bold px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20 font-mono uppercase tracking-widest">{sub.language}</span>
                      <span className="text-xs text-slate-500 font-mono tracking-wider">{new Date(sub.createdAt).toLocaleString()}</span>
                      <span className="text-[10px] font-bold px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-mono">{sub.status}</span>
                    </div>
                    <div className="bg-[#0a0f1c] rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">{sub.code}</pre>
                    </div>
                    {sub.output && (
                      <div className="mt-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl overflow-hidden shadow-inner">
                        <pre className="p-4 text-xs font-mono text-emerald-400 max-h-32 overflow-y-auto">OUTPUT:\n{sub.output}</pre>
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
