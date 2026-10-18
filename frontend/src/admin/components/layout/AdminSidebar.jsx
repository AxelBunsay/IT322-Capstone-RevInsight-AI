import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../../context/useAuth';
import navigation from '../../config/navigation';

const icons = {
  dashboard: '📊',
  transactions: '📄',
  inventory: '📦',
  mechanics: '🔧',
  logout: '🧾'
};

function Icon({ name }) {
  return <span className="nav-icon" aria-hidden="true">{icons[name]}</span>;
}

function AdminSidebar({ badges, loading, isCollapsed, onToggle, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };
  const handleNavigation = () => {
    if (window.matchMedia('(max-width: 760px)').matches) onClose();
  };

  return (
    <>
      {!isCollapsed && <button type="button" className="sidebar-backdrop" aria-label="Close navigation menu" onClick={onClose} />}
      <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`} aria-label="Admin sidebar">
        <div className="sidebar-header">
          <div className="brand-row">
            <div className="brand" aria-label="REVINSIGHT Admin">
              <span className="brand-icon">R</span>
              <div className="brand-text">
                <span className="brand-name">REVINSIGHT</span>
                <span className="brand-role">Admin</span>
              </div>
            </div>
          </div>
          <div className="sidebar-toggle-row">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={onToggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
              aria-controls="admin-sidebar-navigation"
            >
              ☰
            </button>
          </div>
        </div>
        <nav className="sidebar-nav" id="admin-sidebar-navigation" aria-label="Admin navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === 'dashboard'}
              onClick={handleNavigation}
              aria-label={item.label}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
            >
              <Icon name={item.icon} />
              <span className="nav-label">{item.label}</span>
              {!loading && Number(badges?.[item.badgeKey]) > 0 && <span className="nav-badge">{badges[item.badgeKey]}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-item logout" onClick={signOut} aria-label="Logout" title={isCollapsed ? 'Logout' : undefined}>
            <Icon name="logout" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
