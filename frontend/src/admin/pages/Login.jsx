import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../context/useAuth';
import '../styles/admin.css';

function AdminLogin() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ username, password });
      const destination = location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-root admin-login">
      <div className="admin-login__card">
        <div className="admin-login__mark">M</div>
        <h1>Admin Login</h1>
        <p>Manoy&apos;s Motorcycle Parts &amp; Services</p>
        <form onSubmit={handleSubmit}>
          <div className="admin-login__field">
            <label htmlFor="admin-username">Username</label>
            <input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" required />
          </div>
          <div className="admin-login__field">
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          </div>
          {error && <p className="admin-login__error" role="alert">{error}</p>}
          <button className="admin-login__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</button>
        </form>
      </div>
    </main>
  );
}

export default AdminLogin;
