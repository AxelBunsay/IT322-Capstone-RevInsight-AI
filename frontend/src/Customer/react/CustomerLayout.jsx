import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/shared.css';
import '../styles/customer-flow.css';

export function CustomerHeader() {
  const location = useLocation();
  const { cart } = useCustomerPrototype();
  const customerToken = localStorage.getItem('customerToken');
  const isSignedIn = Boolean(customerToken);
  const hasCustomerAccount = isSignedIn && customerToken !== 'prototype-guest';
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    window.location.href = '/customer/login';
  };

  const navigation = [
    { label: 'Shop', path: '/customer/shop' },
    { label: 'Services', path: '/customer/services' },
    { label: 'My Purchases', path: '/customer/purchases' }
  ];

  return <header className="customer-header">
    <Link className="customer-brand" to="/customer/shop"><span className="customer-brand__mark" aria-hidden="true">🔧</span><span className="customer-brand__copy"><strong>Manoy&apos;s Motorcycle</strong><small>Parts, Accessories &amp; Services</small></span></Link>
    <nav aria-label="Customer navigation" className="customer-nav">
      {navigation.map((item) => {
        const isActive = location.pathname === item.path
          || (item.path === '/customer/shop' && location.pathname.startsWith('/customer/products/'))
          || (item.path === '/customer/services' && location.pathname.startsWith('/customer/services/'))
          || (item.path === '/customer/purchases' && ['/customer/orders', '/customer/reservations'].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`)));
        return <Link className={isActive ? 'active' : ''} key={item.path} to={item.path}>{item.label}</Link>;
      })}
      {hasCustomerAccount && <Link className={location.pathname === '/customer/profile' ? 'active' : ''} to="/customer/profile">Account</Link>}
      <Link className={`customer-cart-link${location.pathname === '/customer/cart' ? ' active' : ''}`} to="/customer/cart">Cart <span className="customer-cart-count">{cartCount}</span></Link>
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
    <main className={`customer-page ${title === 'Motorcycle Shop' ? 'shop-page' : ''} ${title === 'Motorcycle Services' ? 'services-page' : ''} ${title === 'My Purchases' || title === 'My Reservations' ? 'orders-page reservations-page' : ''} ${title === 'Profile' || title === 'Account' ? 'profile-page' : ''}`}>
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
      <Link className="customer-auth-brand" to="/customer/shop"><span className="customer-auth-logo">🔧</span><span><strong>Manoy&apos;s Motorcycle</strong><small>Parts, Accessories &amp; Services</small></span></Link>
      <div className="customer-auth-copy">
        <p className="customer-auth-eyebrow">MANOY&apos;S MOTORCYCLE PARTS &amp; ACCESSORIES</p>
        <h1>Everything your ride needs.</h1>
        <p>Browse genuine motorcycle parts and accessories. Fast, reliable, and trusted by riders.</p>
        <ul>
          <li><span>▤</span><span><strong>Wide product selection</strong><small>Parts, accessories &amp; more</small></span></li>
          <li><span>▣</span><span><strong>Track your reservations</strong><small>Booking and order progress</small></span></li>
          <li><span>⌁</span><span><strong>Trusted service</strong><small>Quality parts and expert mechanics</small></span></li>
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
