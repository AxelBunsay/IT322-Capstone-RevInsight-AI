import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../context/useAuth';
import '../../../Admin/css/adminLogin.css';

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
    <main className="login-container">
      <div className="login-card">
        <div className="login-logo"><div className="logo-circle">M</div></div>
        <h1>Admin Login</h1>
        <p className="subtitle">Mancy&apos;s Motorcycle Parts, Accessories &amp; Services</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="admin-username">Username</label>
            <input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" required />
          </div>
          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          </div>
          <div className="form-options">
            <label className="remember-me"><input type="checkbox" /> <span>Remember me</span></label>
            <a className="forgot-password" href="/admin/login">Forgot password?</a>
          </div>
          {error && <p className="error-message show" role="alert">{error}</p>}
          <button className="btn-login" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</button>
        </form>
        <div className="login-footer"><p></p></div>
      </div>
      <div className="login-background" aria-hidden="true"><div className="bg-circle circle-1"></div><div className="bg-circle circle-2"></div><div className="bg-circle circle-3"></div></div>
    </main>
  );
}

export default AdminLogin;
