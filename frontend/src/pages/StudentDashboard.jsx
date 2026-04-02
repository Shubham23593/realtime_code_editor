import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaCode, FaSignOutAlt, FaUserGraduate, FaDoorOpen, FaLink } from 'react-icons/fa';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [activeTab, setActiveTab] = useState('roomId');
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const joinByRoomId = () => {
    const id = roomId.trim().toUpperCase();
    if (!id) return toast.error('Please enter a Room ID');
    navigate(`/room/${id}`);
  };

  const joinByLink = () => {
    try {
      const url = new URL(inviteLink.trim());
      const parts = url.pathname.split('/');
      const id = parts[parts.length - 1];
      if (!id) throw new Error('Invalid link');
      navigate(`/room/${id}`);
    } catch {
      toast.error('Invalid invite link. Make sure it looks like: https://yourapp.com/room/ROOM123');
    }
  };

  return (
    <div className="cv-dashboard">
      {/* Header */}
      <header className="cv-dash-header">
        <div className="cv-dash-brand">
          <FaCode className="cv-dash-brand-icon" />
          <div>
            <h1 className="cv-dash-brand-name">CodeVerse <span>Classroom</span></h1>
            <p className="cv-dash-brand-role">Student Portal</p>
          </div>
        </div>
        <div className="cv-dash-header-right">
          <div className="cv-user-pill">
            <span className="cv-user-avatar">{user?.name?.[0]?.toUpperCase()}</span>
            <span className="cv-user-name">{user?.name}</span>
            <span className="cv-role-badge cv-role-student">Student</span>
          </div>
          <button onClick={handleLogout} className="cv-logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <main className="cv-dash-main">
        {/* Welcome Card */}
        <div className="cv-welcome-card">
          <div className="cv-welcome-icon">
            <FaUserGraduate />
          </div>
          <div>
            <h2 className="cv-welcome-title">Welcome, {user?.name}! 👋</h2>
            <p className="cv-welcome-sub">Join a coding session using a Room ID or invite link from your teacher.</p>
          </div>
        </div>

        {/* Join Room Section */}
        <div className="cv-section">
          <h2 className="cv-section-title"><FaDoorOpen /> Join a Session</h2>

          <div className="cv-tab-selector">
            <button
              className={`cv-tab ${activeTab === 'roomId' ? 'cv-tab-active' : ''}`}
              onClick={() => setActiveTab('roomId')}
            >
              🔑 By Room ID
            </button>
            <button
              className={`cv-tab ${activeTab === 'link' ? 'cv-tab-active' : ''}`}
              onClick={() => setActiveTab('link')}
            >
              <FaLink /> By Invite Link
            </button>
          </div>

          {activeTab === 'roomId' && (
            <div className="cv-join-panel">
              <p className="cv-join-hint">Enter the 8-character Room ID provided by your teacher:</p>
              <div className="cv-join-row">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinByRoomId()}
                  placeholder="e.g. A1B2C3D4"
                  className="cv-input cv-roomid-input"
                  maxLength={8}
                  autoFocus
                />
                <button onClick={joinByRoomId} className="cv-btn-primary">
                  🚀 Join Room
                </button>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="cv-join-panel">
              <p className="cv-join-hint">Paste the full invite link from your teacher:</p>
              <div className="cv-join-row">
                <input
                  type="text"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinByLink()}
                  placeholder="https://yourapp.com/room/ROOM123"
                  className="cv-input"
                />
                <button onClick={joinByLink} className="cv-btn-primary">
                  🔗 Join
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="cv-section">
          <h2 className="cv-section-title">💡 How it Works</h2>
          <div className="cv-tips-grid">
            <div className="cv-tip-card">
              <span className="cv-tip-icon">1️⃣</span>
              <h3>Get Room ID</h3>
              <p>Ask your teacher for the Room ID or invite link.</p>
            </div>
            <div className="cv-tip-card">
              <span className="cv-tip-icon">2️⃣</span>
              <h3>Join Session</h3>
              <p>Enter Room ID or paste the invite link above.</p>
            </div>
            <div className="cv-tip-card">
              <span className="cv-tip-icon">3️⃣</span>
              <h3>Collaborate</h3>
              <p>Code together, raise your hand to edit, and submit your solution.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
