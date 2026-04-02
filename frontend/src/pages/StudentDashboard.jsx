import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaGraduationCap, FaSignOutAlt, FaRocket, FaDoorOpen, FaLink, FaKey, FaQuestionCircle, FaCheckCircle, FaLaptopCode, FaUserGraduate, FaDesktop } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';

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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 uppercase tracking-wide border border-indigo-500/30">Student</span>
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        
        {/* Welcome Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-xl">
          <div className="hidden md:flex bg-indigo-500/20 w-16 h-16 rounded-2xl items-center justify-center flex-shrink-0 border border-indigo-500/30">
            <FaUserGraduate className="text-3xl text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Welcome, {user?.name}!</h2>
            <p className="text-slate-400 font-mono text-sm">Join a coding session using a Room ID or invite link provided by your instructor.</p>
          </div>
        </div>

        {/* Join Section */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-2">
            <FaDoorOpen className="text-indigo-400" />
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Join a Classroom Session</h2>
          </div>
          
          <div className="p-6">
            <div className="flex gap-2 mb-6 p-1.5 bg-slate-950/50 border border-slate-800/50 rounded-xl w-full max-w-sm">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'roomId' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => setActiveTab('roomId')}
              >
                <FaKey /> By Room ID
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'link' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => setActiveTab('link')}
              >
                <FaLink /> By Invite Link
              </button>
            </div>

            {activeTab === 'roomId' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-slate-400 font-mono tracking-wide">Enter the 8-character Room ID provided by your teacher.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <FaKey />
                    </span>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && joinByRoomId()}
                      placeholder="e.g. A1B2C3D4"
                      className="w-full pl-10 pr-4 py-3.5 bg-[#060912]/80 border border-slate-700/50 rounded-xl text-white uppercase font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                      maxLength={8}
                      autoFocus
                    />
                  </div>
                  <button 
                    onClick={joinByRoomId} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 sm:w-auto w-full"
                  >
                    <FaRocket /> Join Room
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-slate-400 font-mono tracking-wide">Paste the full invite link shared by your teacher.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <FaLink />
                    </span>
                    <input
                      type="text"
                      value={inviteLink}
                      onChange={(e) => setInviteLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && joinByLink()}
                      placeholder="https://.../room/ROOM123"
                      className="w-full pl-10 pr-4 py-3.5 bg-[#060912]/80 border border-slate-700/50 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={joinByLink} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 sm:w-auto w-full"
                  >
                    <FaDoorOpen /> Join Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How it Works / Tips */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center">
            <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-2xl mb-4">
              <FaQuestionCircle className="text-2xl text-blue-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>1. Get Room ID</h3>
            <p className="text-sm text-slate-400 font-mono">Ask your teacher for the access code or direct invite link.</p>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center">
            <div className="bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-2xl mb-4">
              <FaDoorOpen className="text-2xl text-indigo-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>2. Join Session</h3>
            <p className="text-sm text-slate-400 font-mono">Enter the room to access the shared code editor and instructions.</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center">
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl mb-4">
              <FaLaptopCode className="text-2xl text-emerald-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>3. Collaborate</h3>
            <p className="text-sm text-slate-400 font-mono">Code together in real-time or raise your hand when you need help.</p>
          </div>
        </div>
      </main>

    </div>
  );
};

export default StudentDashboard;
