import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginMechanic } from './mechanicService';

export default function MechanicLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('miguel@workshop.ph');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await loginMechanic({ email, password });
      localStorage.setItem('mechanicToken', response.token);
      localStorage.setItem('mechanicUser', JSON.stringify(response.mechanic || {}));
      navigate('/mechanic/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="mechanic-login-page"><section className="mechanic-login-wrap">
    <div className="mechanic-login-intro"><div className="mechanic-login-mark" aria-hidden="true">🔧</div><span className="mechanic-eyebrow">Mechanic portal</span><h1>Mechanic Login</h1><p>Sign in to manage assigned service jobs.</p></div>
    <form className="mechanic-login-card" onSubmit={submit}>
      <label className="mechanic-field"><span>Email</span><input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="mechanic-field"><span>Password</span><input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {error && <p className="mechanic-alert" role="alert">{error}</p>}
      <button className="button-primary mechanic-login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      <p className="mechanic-demo-hint">Demo account: <strong>miguel@workshop.ph</strong> · <strong>miguel123</strong><span>Sample data only.</span></p>
    </form>
  </section></main>;
}