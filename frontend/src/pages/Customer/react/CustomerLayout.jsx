import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/shared.css';

export function CustomerHeader() {
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isSignedIn = Boolean(localStorage.getItem('customerToken'));

  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    window.location.href = '/customer/login';
  };

  const navigation = [
    { label: 'Shop', path: '/customer/shop' },
    { label: 'Services', path: '/customer/services' }
  ];

  return <header className="customer-header">
    <Link className="customer-brand" to="/customer/shop">Manoy&apos;s Motorcycle Parts, Accessories and Services</Link>
    <nav aria-label="Customer navigation" className="customer-nav">
      {navigation.map((item) => <Link className={location.pathname === item.path ? 'active' : ''} key={item.path} to={item.path}>{item.label}</Link>)}
      {isSignedIn && <div className="customer-profile-menu">
        <button className={`customer-profile-toggle${location.pathname === '/customer/profile' ? ' active' : ''}`} type="button" aria-expanded={isProfileMenuOpen} onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}>
          Profile <span aria-hidden="true">⌄</span>
        </button>
        {isProfileMenuOpen && <div className="customer-profile-dropdown">
          <Link to="/customer/profile" onClick={() => setIsProfileMenuOpen(false)}>Profile</Link>
          <Link to="/customer/profile#purchase-history-title" onClick={() => setIsProfileMenuOpen(false)}>Purchase History</Link>
        </div>}
      </div>}
      <Link className="customer-cart-link" to="/customer/cart">Cart</Link>
      {isSignedIn ? <button type="button" className="customer-logout" onClick={logout}>Sign out</button> : <Link to="/customer/login">Sign in</Link>}
    </nav>
  </header>;
}

export function CustomerPage({ title, description, children, includeHeader = true }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const resetScroll = () => window.scrollTo(0, 0);
    resetScroll();
    window.setTimeout(resetScroll, 0);
    window.setTimeout(resetScroll, 100);
  }, []);

  return (
    <main className={`customer-page ${title === 'Motorcycle Shop' ? 'shop-page' : ''} ${title === 'Motorcycle Services' ? 'services-page' : ''} ${title === 'My Orders' ? 'orders-page' : ''} ${title === 'Profile' ? 'profile-page' : ''}`}>
      {includeHeader && <CustomerHeader />}
      <section className="customer-heading">
        <p className="customer-eyebrow">MOTORCYCLE PARTS, ACCESSORIES &amp; SERVICES</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      {children}
    </main>
  );
}

export function CustomerAuthShell({ activeTab, children }) {
  return <main className="customer-auth-page">
    <section className="customer-auth-showcase">
      <div className="customer-auth-brand"><span className="customer-auth-logo">&#9874;</span><span><strong>MMPS</strong><small>SHOP</small></span></div>
      <div className="customer-auth-copy">
        <p className="customer-auth-eyebrow">MANOY&apos;S MOTORCYCLE PARTS &amp; ACCESSORIES</p>
        <h1>Everything your ride needs.</h1>
        <p>Browse genuine motorcycle parts and accessories. Fast, reliable, and trusted by riders.</p>
        <ul>
          <li><span>&#8594;</span><span><strong>Wide Product Selection</strong><small>Parts, accessories &amp; more</small></span></li>
          <li><span>&#8594;</span><span><strong>Track Your Orders</strong><small>Real-time order status</small></span></li>
          <li><span>&#8594;</span><span><strong>Trusted Service</strong><small>Quality parts and support</small></span></li>
        </ul>
      </div>
    </section>
    <section className="customer-auth-panel">
      <div className="customer-auth-content">
        <nav className="customer-auth-tabs" aria-label="Customer account">
          <Link className={activeTab === 'login' ? 'active' : ''} to="/customer/login">Sign In</Link>
          <Link className={activeTab === 'register' ? 'active' : ''} to="/customer/register">Register</Link>
        </nav>
        {children}
        <p className="customer-auth-footer">&copy; 2026 Manoy&apos;s Motorcycle Parts &amp; Accessories</p>
      </div>
    </section>
  </main>;
}
