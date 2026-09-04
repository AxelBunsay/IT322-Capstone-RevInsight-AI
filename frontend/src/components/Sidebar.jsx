import { Link } from 'react-router-dom';
import useAuth from '../context/useAuth';

const navigationItems = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/revenue', icon: '📈', label: 'Revenue' },
  { href: '/admin/transactions', icon: '📋', label: 'Transactions' },
  { href: '/admin/inventory', icon: '📦', label: 'Inventory' },
  { href: '/admin/mechanics', icon: '🔧', label: 'Mechanics' }
  ,{ href: '/admin/service-requests', icon: '🛠️', label: 'Service Requests' }
];

function Sidebar({ isOpen, activePath = '/admin', onClose }) {
  const { logout } = useAuth();

  return (
    <>
      <div
        className={`sidebar-overlay${isOpen ? ' active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="logo">
          <div className="logo-circle">M</div>
        </div>
        <nav className="nav-menu" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`nav-item${activePath === item.href ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          <Link to="/admin/login" className="nav-item logout" title="Logout" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
