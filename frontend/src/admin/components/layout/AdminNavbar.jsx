import { adminTheme } from '../../config/theme';

function AdminNavbar() {
  return (
    <header className="admin-navbar">
      <div className="admin-navbar__brand" aria-label={`${adminTheme.brandName} Admin`}>
        <span className="admin-navbar__mark">{adminTheme.brandMark}</span>
        <span className="admin-navbar__name"><strong>{adminTheme.brandName}</strong><small>Admin</small></span>
      </div>
    </header>
  );
}

export default AdminNavbar;
