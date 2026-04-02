import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaSignOutAlt, FaPlay, FaCopy, FaFileUpload, FaComments,
  FaHandPaper, FaUsers, FaCode, FaCheck, FaLink, FaEye,
  FaChalkboardTeacher, FaTimes, FaPaperPlane, FaCog
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
  const { user, token, authHeader } = useAuth();

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
  const [showPanel, setShowPanel] = useState(true);

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
    socket.on('userJoined', (name) => { if (name !== user?.name) toast.success(`${name} joined 👋`); });
    socket.on('userLeft', (name) => { if (name !== user?.name) toast.info(`${name} left`); });

    socket.on('codeUpdate', (newCode) => setCode(newCode));
    socket.on('languageUpdate', (lang) => setLanguage(lang));
    socket.on('userTyping', (name) => { setTyping(`${name} is typing...`); setTimeout(() => setTyping(''), 2000); });

    socket.on('chatMessage', ({ user: u, message, timestamp }) => {
      setChatMessages(prev => [...prev, { user: u, message, timestamp }]);
    });

    socket.on('codeResponse', (res) => setOutput(res.run?.output || 'No output'));

    // Permission events
    socket.on('modeChanged', ({ mode: m, activeEditors: ae }) => {
      setMode(m); setActiveEditors(ae);
      toast.info(`Editor mode: ${m.replace('_', ' ').toUpperCase()} 🔁`);
    });

    socket.on('handRaised', ({ userName: un, pendingHands: ph }) => {
      setPendingHands(ph);
      if (isTeacher) toast.info(`✋ ${un} wants to edit!`);
    });

    socket.on('editApproved', ({ userName: un, activeEditors: ae }) => {
      setActiveEditors(ae);
      if (un === user?.name) { toast.success('✅ You can now edit the code!'); setHandRaised(false); }
    });

    socket.on('editRejected', ({ userName: un, pendingHands: ph }) => {
      setPendingHands(ph);
      if (un === user?.name) { toast.error('❌ Edit request rejected'); setHandRaised(false); }
    });

    socket.on('editRevoked', ({ userName: un, activeEditors: ae }) => {
      setActiveEditors(ae);
      if (un === user?.name) toast.warn('⚠️ Your edit access was revoked');
    });

    socket.on('youWereKicked', ({ message }) => {
      toast.error(message); setTimeout(() => navigate('/dashboard'), 2000);
    });

    socket.on('userKicked', (un) => { if (un !== user?.name) toast.warn(`${un} was removed from the room`); });

    socket.on('problemPosted', ({ problem: p, problemTitle: pt }) => {
      setProblem(p); setProblemTitle(pt);
      toast.info('📌 New problem posted by teacher!');
      setShowProblem(true);
    });

    socket.on('codeSubmitted', ({ userName: un, timestamp }) => {
      if (isTeacher) toast.success(`📩 ${un} submitted their code!`);
    });

    return () => {
      socket.emit('leaveRoom', { roomId, userName: user?.name });
      socket.disconnect();
    };
  }, [roomId, user]);

  // ── Load room info ─────────────────────────────────────────────────────────
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
    setOutput('⏳ Compiling...');
    toast.info('🧠 Compiling...');
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { user: user?.name, message: msg }]);
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
    toast.success('Invite link copied! 🔗');
  };

  // Permission actions
  const raiseHand = () => {
    socket.emit('raiseHand', { roomId, userName: user?.name });
    setHandRaised(true);
    toast.info('✋ Hand raised! Waiting for teacher approval...');
  };

  const approveHand = (targetUser) => {
    socket.emit('approveHand', { roomId, targetUser });
  };

  const rejectHand = (targetUser) => {
    socket.emit('rejectHand', { roomId, targetUser });
  };

  const revokeEdit = (targetUser) => {
    socket.emit('revokeEdit', { roomId, targetUser });
  };

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
    // Also save to DB
    axios.post(`${API_BASE}/api/rooms/${roomId}/problem`, {
      problem: problemInput, problemTitle: problemTitleInput
    }, { headers: authHeader() }).catch(() => {});
    setProblemInput(''); setProblemTitleInput('');
    toast.success('📌 Problem posted to all students!');
  };

  const submitCode = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/api/submissions`, {
        roomId, code, language, output
      }, { headers: authHeader() });
      socket.emit('submitCode', { roomId, userName: user?.name, code, language });
      toast.success('📩 Code submitted successfully!');
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

  const modeColors = { free: '#22c55e', teacher: '#f59e0b', raise_hand: '#3b82f6', group: '#8b5cf6' };
  const modeLabel = { free: '🌐 Free', teacher: '👩‍🏫 Teacher Only', raise_hand: '✋ Raise Hand', group: '👥 Group' };

  return (
    <div className="cv-room">
      {/* ── Topbar ── */}
      <header className="cv-room-header">
        <div className="cv-room-header-left">
          <button onClick={leaveRoom} className="cv-back-btn" title="Back to Dashboard">
            <FaSignOutAlt />
          </button>
          <div className="cv-room-title-group">
            <span className="cv-room-label">{roomInfo?.name || roomId}</span>
            <code className="cv-room-code-id">{roomId}</code>
          </div>
          <div className="cv-mode-indicator" style={{ borderColor: modeColors[mode], color: modeColors[mode] }}>
            {modeLabel[mode]}
          </div>
          {!canEdit && (
            <span className="cv-readonly-badge"><FaEye /> Read-only</span>
          )}
        </div>

        <div className="cv-room-header-right">
          <span className={`cv-conn-dot ${connected ? 'cv-conn-on' : 'cv-conn-off'}`} title={connected ? 'Connected' : 'Disconnected'} />
          <span className="cv-users-count"><FaUsers /> {users.length}</span>
          <button onClick={copyInviteLink} className="cv-icon-btn-sm" title="Copy invite link"><FaLink /></button>
          <button onClick={() => setShowChat(!showChat)} className={`cv-icon-btn-sm ${showChat ? 'cv-icon-btn-active' : ''}`} title="Chat"><FaComments /></button>
          {isTeacher && (
            <button onClick={() => setShowModePanel(!showModePanel)} className="cv-icon-btn-sm" title="Change Mode"><FaCog /></button>
          )}
        </div>
      </header>

      {/* ── Mode Panel (Teacher) ── */}
      {isTeacher && showModePanel && (
        <div className="cv-mode-panel">
          <p className="cv-mode-panel-title">Select Editor Mode:</p>
          <div className="cv-mode-btns">
            {Object.entries(modeLabel).map(([key, label]) => (
              <button key={key} onClick={() => changeMode(key)}
                className={`cv-mode-opt ${mode === key ? 'cv-mode-opt-active' : ''}`}
                style={{ '--mode-color': modeColors[key] }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="cv-room-body">
        {/* ── Left Sidebar ── */}
        <aside className={`cv-sidebar ${showPanel ? 'cv-sidebar-open' : ''}`}>
          <div className="cv-sidebar-section">
            <h3 className="cv-sidebar-heading"><FaUsers /> Participants ({users.length})</h3>
            <div className="cv-user-list">
              {users.map((u, i) => (
                <div key={i} className="cv-user-row">
                  <div className="cv-user-left">
                    <span className="cv-avatar-sm">{u.name?.[0]?.toUpperCase()}</span>
                    <span className="cv-user-item-name">{u.name === user?.name ? `${u.name} (You)` : u.name}</span>
                    {u.role === 'teacher' && <span className="cv-badge-teacher">T</span>}
                  </div>
                  <div className="cv-user-right">
                    {u.canEdit ? <span className="cv-edit-on" title="Can edit">✏️</span> : <span className="cv-edit-off" title="Read-only">👁️</span>}
                    {isTeacher && u.name !== user?.name && (
                      <div className="cv-teacher-actions">
                        {!u.canEdit && u.role !== 'teacher' && (
                          <button onClick={() => approveHand(u.name)} className="cv-act-btn cv-act-approve" title="Grant edit">✓</button>
                        )}
                        {u.canEdit && u.role !== 'teacher' && (
                          <button onClick={() => revokeEdit(u.name)} className="cv-act-btn cv-act-revoke" title="Revoke edit">✗</button>
                        )}
                        <button onClick={() => kickUser(u.name)} className="cv-act-btn cv-act-kick" title="Remove user">⊘</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {typing && <p className="cv-typing">{typing}</p>}
          </div>

          {/* Pending Hands */}
          {isTeacher && pendingHands.length > 0 && (
            <div className="cv-sidebar-section cv-hands-section">
              <h3 className="cv-sidebar-heading cv-hands-title">✋ Raised Hands ({pendingHands.length})</h3>
              {pendingHands.map((name, i) => (
                <div key={i} className="cv-hand-row">
                  <span>{name}</span>
                  <div className="cv-hand-actions">
                    <button onClick={() => approveHand(name)} className="cv-btn-approve">✓ Allow</button>
                    <button onClick={() => rejectHand(name)} className="cv-btn-reject">✗ Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Language */}
          <div className="cv-sidebar-section">
            <h3 className="cv-sidebar-heading"><FaCode /> Language</h3>
            <select value={language} onChange={handleLanguageChange} className="cv-input cv-select">
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="cv-sidebar-section">
            <label className="cv-upload-label">
              <input type="file" className="cv-file-input" onChange={handleFileUpload} />
              <FaFileUpload /> Upload File
            </label>
            {uploadedFileName && <p className="cv-uploaded-name">📁 {uploadedFileName}</p>}
          </div>

          {/* Teacher: Post Problem */}
          {isTeacher && (
            <div className="cv-sidebar-section">
              <h3 className="cv-sidebar-heading cv-problem-heading"><FaChalkboardTeacher /> Post Problem</h3>
              <input
                type="text"
                value={problemTitleInput}
                onChange={(e) => setProblemTitleInput(e.target.value)}
                placeholder="Problem title..."
                className="cv-input cv-input-sm"
              />
              <textarea
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                placeholder="Describe the problem..."
                className="cv-problem-area"
                rows={4}
              />
              <button onClick={postProblem} className="cv-btn-post-problem">📌 Post to Students</button>
            </div>
          )}

          {/* Teacher: View Submissions */}
          {isTeacher && (
            <div className="cv-sidebar-section">
              <button onClick={loadSubmissions} className="cv-btn-submissions">
                📊 View Submissions
              </button>
            </div>
          )}

          {/* Student: Raise Hand / Submit */}
          {!isTeacher && (
            <div className="cv-sidebar-section">
              {(mode === 'raise_hand' || mode === 'group') && !canEdit && (
                <button onClick={raiseHand} disabled={handRaised} className={`cv-btn-raise-hand ${handRaised ? 'cv-btn-hand-raised' : ''}`}>
                  <FaHandPaper /> {handRaised ? '✋ Waiting...' : 'Raise Hand to Edit'}
                </button>
              )}
              <button onClick={submitCode} disabled={submitting} className="cv-btn-submit">
                <FaPaperPlane /> {submitting ? 'Submitting...' : 'Submit Code'}
              </button>
            </div>
          )}

          {/* Leave room */}
          <div className="cv-sidebar-section">
            <button onClick={leaveRoom} className="cv-btn-leave">
              <FaSignOutAlt /> Leave Room
            </button>
          </div>
        </aside>

        {/* ── Editor + Output ── */}
        <div className={`cv-editor-area ${showChat ? 'cv-editor-shrink' : ''}`}>
          {/* Problem display */}
          {problem && (
            <div className="cv-problem-banner">
              <div className="cv-problem-banner-header">
                <span>📌 {problemTitle || 'Problem Statement'}</span>
                <button onClick={() => setShowProblem(!showProblem)} className="cv-problem-toggle">
                  {showProblem ? '▲ Hide' : '▼ Show'}
                </button>
              </div>
              {showProblem && <p className="cv-problem-text">{problem}</p>}
            </div>
          )}

          <div className="cv-editor-wrapper">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
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
              <div className="cv-editor-readonly-overlay">
                <span><FaEye /> Read-only — {mode === 'raise_hand' ? 'Raise your hand to edit' : 'Waiting for teacher'}</span>
              </div>
            )}
          </div>

          {/* ── Output / Input ── */}
          <div className="cv-output-panel">
            <div className="cv-output-header">
              <button onClick={runCode} className="cv-btn-run">
                <FaPlay /> Run Code
              </button>
              <span className="cv-lang-badge">{language.toUpperCase()}</span>
            </div>
            <div className="cv-io-grid">
              <div className="cv-io-col">
                <label className="cv-io-label">📥 Input (stdin)</label>
                <textarea
                  className="cv-io-area"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Provide input here..."
                />
              </div>
              <div className="cv-io-col">
                <label className="cv-io-label">📤 Output</label>
                <pre className="cv-io-area cv-output-area">{output || 'Output will appear here...'}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chat Panel ── */}
        {showChat && (
          <aside className="cv-chat-panel">
            <div className="cv-chat-header">
              <h3><FaComments /> Room Chat</h3>
              <button onClick={() => setShowChat(false)} className="cv-icon-btn-sm"><FaTimes /></button>
            </div>
            <div className="cv-chat-messages">
              {chatMessages.length === 0
                ? <p className="cv-chat-empty">No messages yet. Say hello! 👋</p>
                : chatMessages.map((msg, i) => (
                  <div key={i} className={`cv-chat-msg ${msg.user === user?.name ? 'cv-chat-mine' : 'cv-chat-theirs'}`}>
                    <span className="cv-chat-sender">{msg.user === user?.name ? 'You' : msg.user}</span>
                    <span className="cv-chat-bubble">{msg.message}</span>
                  </div>
                ))
              }
              <div ref={chatEndRef} />
            </div>
            <div className="cv-chat-input-row">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="cv-input"
              />
              <button onClick={sendMessage} className="cv-btn-send"><FaPaperPlane /></button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Submissions Modal ── */}
      {showSubmissions && (
        <div className="cv-modal-overlay" onClick={() => setShowSubmissions(false)}>
          <div className="cv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-modal-header">
              <h2>📊 Student Submissions</h2>
              <button onClick={() => setShowSubmissions(false)} className="cv-icon-btn-sm"><FaTimes /></button>
            </div>
            <div className="cv-submissions-list">
              {submissions.length === 0
                ? <p className="cv-empty-msg">No submissions yet.</p>
                : submissions.map((sub, i) => (
                  <div key={i} className="cv-submission-card">
                    <div className="cv-sub-header">
                      <span className="cv-sub-name">{sub.studentName}</span>
                      <span className="cv-sub-lang">{sub.language.toUpperCase()}</span>
                      <span className="cv-sub-time">{new Date(sub.createdAt).toLocaleString()}</span>
                      <span className={`cv-sub-status cv-status-${sub.status}`}>{sub.status}</span>
                    </div>
                    <pre className="cv-sub-code">{sub.code}</pre>
                    {sub.output && <pre className="cv-sub-output">Output: {sub.output}</pre>}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
