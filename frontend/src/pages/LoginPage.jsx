import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaRocket, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('All fields are required');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}! 🚀`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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

        <h1 className="cv-auth-title">Welcome Back</h1>
        <p className="cv-auth-subtitle">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} className="cv-auth-form">
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
                placeholder="Your password"
                className="cv-input"
                autoComplete="current-password"
              />
              <button type="button" className="cv-eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="cv-btn-primary" disabled={loading}>
            {loading ? <span className="cv-btn-spinner" /> : '🔐 Sign In'}
          </button>
        </form>

        <p className="cv-auth-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="cv-auth-link">Create one →</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
