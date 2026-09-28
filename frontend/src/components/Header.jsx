import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import LoginRequiredAlert from './LoginRequiredAlert';
import './css/Header.css';

const navItems = [
  { label: 'Shop', to: '/customer/shop', icon: 'shop' },
  { label: 'Services', to: '/customer/services', icon: 'services' },
  { label: 'My Orders', to: '/customer/orders', icon: 'orders' }
];

function Icon({ name }) {
  const sharedProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };

  const icons = {
    shop: (
      <svg {...sharedProps}>
        <path d="M3 8.5h18l-1.5 10.5h-15L3 8.5Z" />
        <path d="M8 8.5V6.8A4 4 0 0 1 12 3a4 4 0 0 1 4 3.8v1.7" />
      </svg>
    ),
    services: (
      <svg {...sharedProps}>
        <path d="M14.7 6.3a3.5 3.5 0 0 1-4.6 4.6L5 16l1 1 1 1 5.1-5.1a3.5 3.5 0 0 1 4.6-4.6l-2 2-1.3-.3-.3-1.3 2-2Z" />
      </svg>
    ),
    orders: (
      <svg {...sharedProps}>
        <path d="M7 4.5h10l2 3v10.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" />
        <path d="M9 4.5v3h6v-3M8 12h8M8 15.5h8" />
      </svg>
    ),
    bell: (
      <svg {...sharedProps}>
        <path d="M6 16v-4.5a6 6 0 1 1 12 0V16l1.5 2h-15L6 16Z" />
        <path d="M10.3 20a1.8 1.8 0 0 0 3.4 0" />
      </svg>
    ),
    cart: (
      <svg {...sharedProps}>
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
        <path d="M3.5 4.5h2l2.7 9.1a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.8L19 7H7.2" />
      </svg>
    ),
    logout: (
      <svg {...sharedProps}>
        <path d="M10 17h7a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7" />
        <path d="M13.5 12H4m0 0 2.7-3M4 12l2.7 3" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
    brand: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.5 13.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
        <path d="M15.5 13.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
        <path d="M8.5 13.5h7" />
        <path d="M6 11 8 8h8l2 3" />
      </svg>
    )
  };

  return icons[name] || null;
}

function Header({ title = 'MMPS', subtitle = 'Customer Shop', onMenuClick }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const isSignedIn = Boolean(localStorage.getItem('customerToken'));

  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    window.location.href = '/customer/login';
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((open) => !open);
    if (onMenuClick) onMenuClick();
  };

  const requireLogin = (event) => {
    if (isSignedIn) return;
    event.preventDefault();
    setIsAlertOpen(true);
  };

  return (
    <header className="customer-shell-header">
      <div className="customer-shell-header__inner">
        <Link className="customer-shell-brand" to="/customer/shop" aria-label="Go to shop home">
          <span className="customer-shell-brand__mark">
            <Icon name="brand" />
          </span>
          <span className="customer-shell-brand__meta">
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </span>
        </Link>

        <button
          type="button"
          className={`customer-shell-menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={handleMenuToggle}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`customer-shell-panel ${isMenuOpen ? 'is-open' : ''}`}>
          <nav className="customer-shell-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/customer/shop'}
                className={({ isActive }) => {
                  const currentPath = location.pathname === '/' ? '/customer/shop' : location.pathname;
                  const exactMatch = currentPath === item.to || currentPath === `${item.to}/`;
                  return `customer-shell-nav__link ${isActive || exactMatch ? 'active' : ''}`.trim();
                }}
                onClick={(event) => {
                  if (!isSignedIn && item.to === '/customer/orders') {
                    event.preventDefault();
                    setIsMenuOpen(false);
                    setIsAlertOpen(true);
                    return;
                  }
                  setIsMenuOpen(false);
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="customer-shell-actions">
            <div className="customer-shell-actions__icons">
              <button
                type="button"
                className="customer-shell-icon-button"
                aria-label="Notifications"
                onClick={() => {
                  if (!isSignedIn) {
                    setIsAlertOpen(true);
                    return;
                  }
                }}
              >
                <Icon name="bell" />
              </button>

              <Link to="/customer/cart" className="customer-shell-icon-button" aria-label="Open cart" onClick={requireLogin}>
                <Icon name="cart" />
              </Link>
            </div>

            {isSignedIn && (
              <div className="customer-shell-user" aria-label="User profile">
                <span className="customer-shell-user__avatar">
                  <Icon name="user" />
                </span>
                <span className="customer-shell-user__name">Andrei Comia</span>
              </div>
            )}

            {isSignedIn && (
              <button type="button" className="customer-shell-logout" onClick={logout}>
                <Icon name="logout" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!isSignedIn && (
        <div className="customer-shell-guest-strip">
          <span className="customer-shell-guest-strip__text">
            Sign in to track orders and book services faster.
          </span>
          <div className="customer-shell-guest-strip__actions">
            <Link to="/customer/login" className="customer-shell-guest-strip__link">
              Login
            </Link>
            <span className="customer-shell-guest-strip__divider" aria-hidden="true" />
            <Link to="/customer/register" className="customer-shell-guest-strip__link customer-shell-guest-strip__link--primary">
              Sign up
            </Link>
          </div>
        </div>
      )}

      <LoginRequiredAlert isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} />
    </header>
  );
}

export default Header;