import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { CustomerAuthShell } from './CustomerLayout';
import '../styles/shared.css';

export function CustomerLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.loginCustomer(credentials);
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customerUser', JSON.stringify(response.user || {}));
      navigate('/customer/shop');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <CustomerAuthShell activeTab="login">
    <div className="customer-auth-heading"><h2>Welcome back!</h2><p>Sign in to your customer account</p></div>
    <form className="customer-auth-form" onSubmit={submitLogin}>
      {error && <p className="customer-error" role="alert">{error}</p>}
      <label>Email Address<input type="email" required placeholder="you@email.com" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} /></label>
      <label>Password<input type="password" required placeholder="********" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign In'}</button>
    </form>
  </CustomerAuthShell>;
}

export function CustomerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register');
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.registerCustomer(formData);
      setMessage('OTP sent to your email. Please check your inbox.');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.verifyOtp(formData.email, otp);
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customerUser', JSON.stringify(response.user || {}));
      navigate('/customer/shop');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await api.resendOtp(formData.email);
      setMessage('OTP resent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    }
  };

  if (step === 'register') {
    return <CustomerAuthShell activeTab="register">
      <div className="customer-auth-heading"><h2>Create your account</h2><p>Register to shop parts and book services</p></div>
      {error && <p className="customer-error" role="alert">{error}</p>}
      {message && <p className="customer-success" role="status">{message}</p>}
      <form className="customer-auth-form" onSubmit={handleRegister}>
        <div className="form-row"><label>First Name<input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></label><label>Last Name<input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></label></div>
        <label>Email<input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></label>
        <label>Phone Number<input type="tel" required value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+63 9xx xxx xxxx" /></label>
        <label>Password<input type="password" required minLength="6" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></label>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</button>
      </form>
    </CustomerAuthShell>;
  }

  return <CustomerAuthShell activeTab="register">
    <div className="customer-auth-heading"><h2>Verify your email</h2><p>Enter the 6-digit OTP sent to your email</p></div>
    {error && <p className="customer-error" role="alert">{error}</p>}
    {message && <p className="customer-success" role="status">{message}</p>}
    <form className="customer-auth-form" onSubmit={handleVerify}>
      <label>OTP Code<input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" style={{ letterSpacing: '0.5em', textAlign: 'center' }} /></label>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</button>
    </form>
    <p className="customer-link">Didn&apos;t receive the code? <button type="button" onClick={handleResend} disabled={isSubmitting}>Resend OTP</button></p>
    <p className="customer-link"><Link to="/customer/login">Back to Login</Link></p>
  </CustomerAuthShell>;
}
