import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaRocket, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('All fields are required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await signup(name, email, password, role);
      toast.success(`Account created! Welcome, ${user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-auth-page">
      <div className="cv-auth-bg">
        <div className="cv-auth-orb cv-orb-1" />
        <div className="cv-auth-orb cv-orb-2" />
        <div className="cv-auth-orb cv-orb-3" />
      </div>

      <div className="cv-auth-card">
        <div className="cv-auth-logo">
          <FaRocket className="cv-logo-icon" />
          <span className="cv-logo-text">CodeVerse</span>
          <span className="cv-logo-sub">Classroom Edition</span>
        </div>

        <h1 className="cv-auth-title">Create Account</h1>
        <p className="cv-auth-subtitle">Join the next-gen coding classroom</p>

        {/* Role Selector */}
        <div className="cv-role-selector">
          <button
            type="button"
            className={`cv-role-btn ${role === 'student' ? 'cv-role-active' : ''}`}
            onClick={() => setRole('student')}
          >
            <FaUserGraduate /> Student
          </button>
          <button
            type="button"
            className={`cv-role-btn ${role === 'teacher' ? 'cv-role-active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            <FaChalkboardTeacher /> Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cv-auth-form">
          <div className="cv-form-group">
            <label className="cv-form-label">Full Name</label>
            <div className="cv-input-wrap">
              <FaUser className="cv-input-icon" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="cv-input"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="cv-form-group">
            <label className="cv-form-label">Email</label>
            <div className="cv-input-wrap">
              <FaEnvelope className="cv-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="cv-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="cv-form-group">
            <label className="cv-form-label">Password</label>
            <div className="cv-input-wrap">
              <FaLock className="cv-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="cv-input"
                autoComplete="new-password"
              />
              <button type="button" className="cv-eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="cv-btn-primary" disabled={loading}>
            {loading ? <span className="cv-btn-spinner" /> : `🚀 Join as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
          </button>
        </form>

        <p className="cv-auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="cv-auth-link">Sign in →</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
