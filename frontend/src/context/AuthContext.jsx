import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cv_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('cv_token');
      const savedUser = localStorage.getItem('cv_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    init();
  }, []);

  const signup = async (name, email, password, role) => {
    const res = await axios.post(`${API_BASE}/api/auth/signup`, { name, email, password, role });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('cv_token', t);
    localStorage.setItem('cv_user', JSON.stringify(u));
    return u;
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('cv_token', t);
    localStorage.setItem('cv_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
  };

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, authHeader, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
