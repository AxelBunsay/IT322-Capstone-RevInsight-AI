import { useMemo, useState } from 'react';
import { api } from '../services/api';
import AuthContext from './authContext';

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem('adminEmail');
    return username ? { username } : null;
  });

  async function login(credentials) {
    const result = await api.loginAdmin(credentials);
    localStorage.setItem('adminToken', result.token);
    localStorage.setItem('adminEmail', result.admin?.username || credentials.username || credentials.email || '');
    setToken(result.token);
    setUser(result.admin || { username: credentials.username || credentials.email });
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
