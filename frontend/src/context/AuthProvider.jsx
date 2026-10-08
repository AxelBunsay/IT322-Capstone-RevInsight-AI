import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../admin/services/adminApi';
import AuthContext from './authContext';

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem('adminEmail');
    return username ? { username, role: 'admin' } : null;
  });

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('adminEmail');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('admin-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('admin-auth-expired', handleAuthExpired);
  }, []);

  async function login(credentials) {
    const result = await adminApi.loginAdmin(credentials);
    localStorage.setItem('adminToken', result.token);
    localStorage.setItem('adminEmail', result.admin?.username || credentials.username || credentials.email || '');
    setToken(result.token);
    setUser({ ...result.admin, username: result.admin?.username || credentials.username || credentials.email, role: result.admin?.role || 'admin' });
    return result;
  }

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, isAuthenticated: Boolean(token), login, logout }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
