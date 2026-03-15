// src/App.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { LogoBook } from './icons';
import './index.css';

export { API_BASE } from './utils/api';
export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hs_token');
    const savedUser = localStorage.getItem('hs_user');
    if (token && savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('hs_token', token);
    localStorage.setItem('hs_user', JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_user');
    setUser(null);
  };

  if (loading) return (
    <div className="splash">
      <div className="splash-mark"><LogoBook /></div>
      <div className="splash-name">Hisa<span>b</span></div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {user ? <Dashboard /> : <Auth />}
    </AuthContext.Provider>
  );
}