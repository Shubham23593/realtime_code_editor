import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaChalkboardTeacher, FaPlus, FaCopy, FaSignOutAlt,
  FaUsers, FaCode, FaCheck, FaExternalLinkAlt, FaGlobe, FaHandPaper, FaDesktop
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import AnimatedBackground from '../components/AnimatedBackground';

const TeacherDashboard = () => {
  const { user, logout, API_BASE, authHeader } = useAuth();
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
      toast.success(`Room "${res.data.room.name}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (roomId) => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(link);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const copyRoomId = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    toast.success('Room ID copied!');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const enterRoom = (roomId) => navigate(`/room/${roomId}`);
  const handleLogout = () => { logout(); navigate('/login'); };

  const modeLabels = {
    free: { label: 'Free Mode', style: 'text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800', icon: <FaGlobe /> },
    teacher: { label: 'Teacher Only', style: 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800', icon: <FaChalkboardTeacher /> },
    raise_hand: { label: 'Raise Hand', style: 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800', icon: <FaHandPaper /> },
    group: { label: 'Group Mode', style: 'text-purple-700 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800', icon: <FaUsers /> },
  };

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col transition-colors duration-300 text-slate-100 relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#060912]/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 border border-indigo-500/30 p-2 rounded-lg">
              <FaDesktop className="text-xl text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                CodeVerse <span className="font-normal text-indigo-400">Classroom</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 px-3 py-1.5 rounded-full shadow-inner">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-200">{user?.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-wide border border-amber-500/30">Teacher</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <span className="block text-4xl font-black text-indigo-400 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{rooms.length}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Total Rooms</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <span className="block text-4xl font-black text-blue-400 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{rooms.filter(r => r.isActive).length}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Active Rooms</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl shadow-xl flex flex-col items-center">
             <span className="block text-4xl font-black text-violet-400 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>∞</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Students Supported</span>
          </div>
        </div>

        {/* Create Room */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <FaUsers className="text-indigo-400" /> My Classrooms
            </h2>
            <button 
              onClick={() => setShowCreate(!showCreate)} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              <FaPlus /> Create Room
            </button>
          </div>

          {showCreate && (
            <div className="p-6 bg-slate-950/50 border-b border-slate-800/60">
              <form onSubmit={createRoom} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., CS101 - Algorithms"
                    className="w-full px-4 py-3 bg-[#060912]/80 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    autoFocus
                  />
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Default Role/Mode</label>
                  <select
                    value={roomMode}
                    onChange={(e) => setRoomMode(e.target.value)}
                    className="w-full px-4 py-3 bg-[#060912]/80 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none font-mono"
                  >
                    <option value="free">Free Mode (everyone edits)</option>
                    <option value="teacher">Teacher Only</option>
                    <option value="raise_hand">Raise Hand Mode</option>
                    <option value="group">Group Mode (max 5)</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {creating ? <CgSpinner className="animate-spin text-lg" /> : 'Create'}
                </button>
              </form>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-slate-800/40 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700/50 text-indigo-400 mb-4 shadow-inner">
                  <FaDesktop className="text-3xl" />
                </div>
                <p className="text-slate-400 font-mono">No rooms yet. Create your first classroom!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => {
                  const modeInfo = modeLabels[room.mode] || modeLabels.free;
                  return (
                    <div key={room._id} className="group bg-slate-950/50 border border-slate-700/50 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all flex flex-col relative overflow-hidden">
                      {/* Subtle background glow on hover */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-xl truncate text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }} title={room.name}>{room.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs font-mono font-bold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                              {room.roomId}
                            </code>
                            <button 
                              onClick={() => copyRoomId(room.roomId)} 
                              className="text-slate-500 hover:text-indigo-400 transition-colors"
                              title="Copy ID"
                            >
                              {copiedId === room.roomId ? <FaCheck className="text-green-400" /> : <FaCopy />}
                            </button>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border backdrop-blur-sm ${modeInfo.style}`}>
                          {modeInfo.icon} {modeInfo.label}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-mono mb-6 flex-1 relative z-10">
                        Created {new Date(room.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-auto relative z-10">
                        <button 
                          onClick={() => enterRoom(room.roomId)} 
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 px-3 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
                        >
                          <FaCode /> Enter
                        </button>
                        <button 
                          onClick={() => copyLink(room.roomId)} 
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm py-2.5 px-3 border border-slate-600 rounded-xl flex justify-center items-center gap-2 transition-colors"
                        >
                           {copiedId === `${window.location.origin}/room/${room.roomId}` ? <FaCheck className="text-green-400" /> : <FaExternalLinkAlt className="text-xs" />} Link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default TeacherDashboard;
