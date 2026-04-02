import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaGraduationCap, FaSignOutAlt, FaRocket, FaDoorOpen, FaLink, FaKey, FaQuestionCircle, FaCheckCircle, FaLaptopCode, FaUserGraduate } from 'react-icons/fa';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
              <FaGraduationCap className="text-xl text-indigo-600 dark:text-indigo-400" />
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide border border-indigo-200 dark:border-indigo-800">Student</span>
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Welcome Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex items-center gap-6 shadow-sm">
          <div className="hidden md:flex bg-indigo-50 dark:bg-slate-800 w-16 h-16 rounded-2xl items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-slate-700">
            <FaUserGraduate className="text-3xl text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name}!</h2>
            <p className="text-slate-500 dark:text-slate-400">Join a coding session using a Room ID or invite link provided by your instructor.</p>
          </div>
        </div>

        {/* Join Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <FaDoorOpen className="text-slate-400" />
            <h2 className="text-lg font-bold">Join a Classroom Session</h2>
          </div>
          
          <div className="p-6">
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full max-w-sm">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'roomId' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                onClick={() => setActiveTab('roomId')}
              >
                <FaKey /> By Room ID
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'link' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                onClick={() => setActiveTab('link')}
              >
                <FaLink /> By Invite Link
              </button>
            </div>

            {activeTab === 'roomId' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-slate-500 dark:text-slate-400">Enter the 8-character Room ID provided by your teacher.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FaKey />
                    </span>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && joinByRoomId()}
                      placeholder="e.g. A1B2C3D4"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 uppercase font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      maxLength={8}
                      autoFocus
                    />
                  </div>
                  <button 
                    onClick={joinByRoomId} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors sm:w-auto w-full"
                  >
                    <FaRocket /> Join Room
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-slate-500 dark:text-slate-400">Paste the full invite link shared by your teacher.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FaLink />
                    </span>
                    <input
                      type="text"
                      value={inviteLink}
                      onChange={(e) => setInviteLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && joinByLink()}
                      placeholder="https://.../room/ROOM123"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button 
                    onClick={joinByLink} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors sm:w-auto w-full"
                  >
                    <FaDoorOpen /> Join Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How it Works / Tips */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col items-center text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full mb-3">
              <FaQuestionCircle className="text-xl text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1">1. Get Room ID</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ask your teacher for the access code or direct invite link.</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col items-center text-center">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-full mb-3">
              <FaDoorOpen className="text-xl text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold mb-1">2. Join Session</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter the room to access the shared code editor and instructions.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col items-center text-center">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full mb-3">
              <FaLaptopCode className="text-xl text-green-500 dark:text-green-400" />
            </div>
            <h3 className="font-semibold mb-1">3. Collaborate</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Code together in real-time or raise your hand when you need help.</p>
          </div>
        </div>
      </main>

    </div>
  );
};

export default StudentDashboard;
