function Header({ title, onMenuClick }) {
  return (
    <header className="admin-header">
      <div className="header-brand">
        <h1>{title}</h1>
        <p>Mancy&apos;s Motorcycle Parts, Accessories &amp; Services</p>
      </div>
      <div className="header-right">
        <div className="timestamp">
          {new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          })}{' '}
          {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
        <button className="notification-icon" type="button" aria-label="Notifications">
          🔔
        </button>
        <button
          className="hamburger-menu"
          type="button"
          aria-label="Toggle sidebar"
          onClick={onMenuClick}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

export default Header;
