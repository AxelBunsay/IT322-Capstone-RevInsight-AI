import { Link } from 'react-router-dom';
import './css/LoginRequiredAlert.css';

export default function LoginRequiredAlert({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="login-required-alert-backdrop" role="presentation" onClick={onClose}>
      <div
        className="login-required-alert"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-alert-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="login-required-alert__close"
          aria-label="Close alert"
          onClick={onClose}
        >
          ×
        </button>

        <div className="login-required-alert__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 0 1 0-17Z" />
            <path d="M12 8.3v5.2" />
            <circle cx="12" cy="16.4" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <p className="login-required-alert__eyebrow">Access required</p>
        <h2 id="login-required-alert-title">You need to login first</h2>
        <p className="login-required-alert__message">
          Sign in to access this section and continue shopping with your saved cart and orders.
        </p>

        <div className="login-required-alert__actions">
          <Link to="/customer/login" className="login-required-alert__button login-required-alert__button--primary" onClick={onClose}>
            Login
          </Link>
          <Link to="/customer/register" className="login-required-alert__button login-required-alert__button--secondary" onClick={onClose}>
            Sign up
          </Link>
          <button type="button" className="login-required-alert__button login-required-alert__button--ghost" onClick={onClose}>
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
