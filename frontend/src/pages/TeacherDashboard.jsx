import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaChalkboardTeacher, FaPlus, FaCopy, FaSignOutAlt,
  FaUsers, FaLink, FaTrash, FaCode, FaCheck
} from 'react-icons/fa';

const TeacherDashboard = () => {
  const { user, token, logout, API_BASE, authHeader } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomMode, setRoomMode] = useState('free');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/rooms/my`, { headers: authHeader() });
      setRooms(res.data.rooms);
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return toast.error('Room name is required');
    setCreating(true);
    try {
      const res = await axios.post(`${API_BASE}/api/rooms/create`, {
        name: roomName, mode: roomMode
      }, { headers: authHeader() });
      setRooms(prev => [res.data.room, ...prev]);
      setShowCreate(false);
      setRoomName('');
      toast.success(`Room "${res.data.room.name}" created! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (roomId) => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(roomId);
    toast.success('Invite link copied! 🔗');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied!');
  };

  const enterRoom = (roomId) => navigate(`/room/${roomId}`);

  const handleLogout = () => { logout(); navigate('/login'); };

  const modeLabels = {
    free: { label: 'Free Mode', color: '#22c55e', icon: '🌐' },
    teacher: { label: 'Teacher Only', color: '#f59e0b', icon: '👩‍🏫' },
    raise_hand: { label: 'Raise Hand', color: '#3b82f6', icon: '✋' },
    group: { label: 'Group Mode', color: '#8b5cf6', icon: '👥' },
  };

  return (
    <div className="cv-dashboard">
      {/* Header */}
      <header className="cv-dash-header">
        <div className="cv-dash-brand">
          <FaCode className="cv-dash-brand-icon" />
          <div>
            <h1 className="cv-dash-brand-name">CodeVerse <span>Classroom</span></h1>
            <p className="cv-dash-brand-role">Teacher Dashboard</p>
          </div>
        </div>
        <div className="cv-dash-header-right">
          <div className="cv-user-pill">
            <span className="cv-user-avatar">{user?.name?.[0]?.toUpperCase()}</span>
            <span className="cv-user-name">{user?.name}</span>
            <span className="cv-role-badge cv-role-teacher">Teacher</span>
          </div>
          <button onClick={handleLogout} className="cv-logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <main className="cv-dash-main">
        {/* Stats Row */}
        <div className="cv-stats-row">
          <div className="cv-stat-card">
            <span className="cv-stat-num">{rooms.length}</span>
            <span className="cv-stat-label">Total Rooms</span>
          </div>
          <div className="cv-stat-card">
            <span className="cv-stat-num">{rooms.filter(r => r.isActive).length}</span>
            <span className="cv-stat-label">Active Rooms</span>
          </div>
          <div className="cv-stat-card">
            <span className="cv-stat-num">∞</span>
            <span className="cv-stat-label">Students Supported</span>
          </div>
        </div>

        {/* Create Room */}
        <div className="cv-section">
          <div className="cv-section-header">
            <h2 className="cv-section-title">
              <FaUsers /> My Rooms
            </h2>
            <button onClick={() => setShowCreate(!showCreate)} className="cv-btn-create">
              <FaPlus /> Create Room
            </button>
          </div>

          {showCreate && (
            <form onSubmit={createRoom} className="cv-create-form">
              <div className="cv-create-form-inner">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room name (e.g., CS101 - Algorithms)"
                  className="cv-input"
                  autoFocus
                />
                <select
                  value={roomMode}
                  onChange={(e) => setRoomMode(e.target.value)}
                  className="cv-input cv-select"
                >
                  <option value="free">🌐 Free Mode (everyone edits)</option>
                  <option value="teacher">👩‍🏫 Teacher Only</option>
                  <option value="raise_hand">✋ Raise Hand Mode</option>
                  <option value="group">👥 Group Mode (max 5)</option>
                </select>
                <button type="submit" className="cv-btn-primary" disabled={creating}>
                  {creating ? <span className="cv-btn-spinner" /> : '🚀 Create'}
                </button>
              </div>
            </form>
          )}

          {/* Rooms Grid */}
          {loading ? (
            <div className="cv-loading-grid">
              {[1, 2, 3].map(i => <div key={i} className="cv-room-skeleton" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="cv-empty-state">
              <div className="cv-empty-icon">🏫</div>
              <p>No rooms yet. Create your first classroom!</p>
            </div>
          ) : (
            <div className="cv-rooms-grid">
              {rooms.map(room => {
                const modeInfo = modeLabels[room.mode] || modeLabels.free;
                return (
                  <div key={room._id} className="cv-room-card">
                    <div className="cv-room-card-header">
                      <div className="cv-room-info">
                        <h3 className="cv-room-name">{room.name}</h3>
                        <div className="cv-room-id-row">
                          <code className="cv-room-id">{room.roomId}</code>
                          <button onClick={() => copyRoomId(room.roomId)} className="cv-icon-btn" title="Copy Room ID">
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                      <span className="cv-mode-badge" style={{ background: modeInfo.color + '22', color: modeInfo.color, border: `1px solid ${modeInfo.color}44` }}>
                        {modeInfo.icon} {modeInfo.label}
                      </span>
                    </div>

                    <div className="cv-room-meta">
                      <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="cv-room-actions">
                      <button onClick={() => enterRoom(room.roomId)} className="cv-btn-enter">
                        <FaCode /> Enter Room
                      </button>
                      <button onClick={() => copyLink(room.roomId)} className="cv-btn-link">
                        {copiedId === room.roomId ? <><FaCheck /> Copied!</> : <><FaLink /> Copy Link</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
