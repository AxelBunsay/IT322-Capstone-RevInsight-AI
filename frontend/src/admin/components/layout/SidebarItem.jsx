import { NavLink } from 'react-router-dom';

const iconPaths = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  revenue: <><path d="m3 17 6-6 4 3 8-8" /><path d="M15 6h6v6" /></>,
  transactions: <><path d="M6 3.5h12v17l-2.5-1.7-3.5 1.7-3.5-1.7L6 20.5v-17Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  inventory: <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.4 8.2-4.4M12 12v9" /></>,
  mechanics: <><path d="M14.5 6.2a4.3 4.3 0 0 0-5.7 5.7l-5.2 5.2a1.7 1.7 0 0 0 2.4 2.4l5.2-5.2a4.3 4.3 0 0 0 5.7-5.7l-2.7 2.7-2.5-.6-.6-2.5 3.4-2Z" /></>,
  logout: <><path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" /><path d="M13 8.5 17 12l-4 3.5M17 12H9" /></>
};

function Icon({ name }) {
  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function SidebarItem({ item, badge, onAction }) {
  const content = (
    <>
      <Icon name={item.icon} />
      <span className="admin-sidebar-item__label">{item.label}</span>
      {Number(badge) > 0 && <span className="admin-sidebar-item__badge">{badge}</span>}
    </>
  );

  if (item.action) {
    return <button type="button" className="admin-sidebar-item admin-sidebar-item--action" onClick={onAction}>{content}</button>;
  }

  return (
    <NavLink
      to={item.path}
      end={item.id === 'dashboard'}
      className={({ isActive }) => `admin-sidebar-item${isActive ? ' is-active' : ''}`}
    >
      {content}
    </NavLink>
  );
}

export default SidebarItem;
