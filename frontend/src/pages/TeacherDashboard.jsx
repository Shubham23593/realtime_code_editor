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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
              <FaDesktop className="text-xl text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">CodeVerse <span className="font-normal text-indigo-600 dark:text-indigo-400">Classroom</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 uppercase tracking-wide border border-amber-200 dark:border-amber-800">Teacher</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
            <span className="block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">{rooms.length}</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Rooms</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
            <span className="block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">{rooms.filter(r => r.isActive).length}</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Rooms</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center flex flex-col justify-center items-center">
             <span className="block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">∞</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Students Supported</span>
          </div>
        </div>

        {/* Create Room */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FaUsers className="text-slate-400" /> My Classrooms
            </h2>
            <button 
              onClick={() => setShowCreate(!showCreate)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Create Room
            </button>
          </div>

          {showCreate && (
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
              <form onSubmit={createRoom} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., CS101 - Algorithms"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Default Role/Mode</label>
                  <select
                    value={roomMode}
                    onChange={(e) => setRoomMode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
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
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {creating ? <CgSpinner className="animate-spin text-lg" /> : 'Create Room'}
                </button>
              </form>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                  <FaDesktop className="text-2xl" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No rooms yet. Create your first classroom!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => {
                  const modeInfo = modeLabels[room.mode] || modeLabels.free;
                  return (
                    <div key={room._id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-lg truncate" title={room.name}>{room.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100 dark:border-indigo-800">
                              {room.roomId}
                            </code>
                            <button 
                              onClick={() => copyRoomId(room.roomId)} 
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Copy ID"
                            >
                              {copiedId === room.roomId ? <FaCheck className="text-green-500" /> : <FaCopy />}
                            </button>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${modeInfo.style}`}>
                          {modeInfo.icon} {modeInfo.label}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-5 flex-1">
                        Created {new Date(room.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-auto">
                        <button 
                          onClick={() => enterRoom(room.roomId)} 
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium text-sm py-2 px-3 rounded flex justify-center items-center gap-2 transition-colors"
                        >
                          <FaCode /> Enter
                        </button>
                        <button 
                          onClick={() => copyLink(room.roomId)} 
                          className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm py-2 px-3 border border-slate-200 dark:border-slate-600 rounded flex justify-center items-center gap-2 transition-colors"
                        >
                           {copiedId === `${window.location.origin}/room/${room.roomId}` ? <FaCheck className="text-green-500" /> : <FaExternalLinkAlt className="text-xs" />} Link
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
