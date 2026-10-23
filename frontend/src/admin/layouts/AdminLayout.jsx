import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import useDashboardData from '../hooks/useDashboardData';
import AdminSidebar from '../components/layout/AdminSidebar';
import AdminNotifications from '../components/layout/AdminNotifications';
import '../styles/admin.css';
import '../styles/layout.css';
import '../styles/dashboard.css';
import '../styles/management.css';

const SIDEBAR_STORAGE_KEY = 'revinsightAdminSidebarCollapsed';

function AdminLayout() {
  const dashboard = useDashboardData();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    if (!isMobile) return false;

    const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return savedState === null ? true : savedState === 'true';
  });

  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    const syncSidebarForViewport = (event) => {
      if (event.matches) {
        const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        setIsSidebarCollapsed(savedState === null ? true : savedState === 'true');
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    mobileQuery.addEventListener('change', syncSidebarForViewport);
    return () => mobileQuery.removeEventListener('change', syncSidebarForViewport);
  }, []);

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <AdminSidebar
          badges={dashboard.data?.badges}
          loading={dashboard.loading}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          onClose={() => setIsSidebarCollapsed(true)}
        />
        <main className="admin-main" id="admin-main">
          <header className="admin-topbar"><span>Administration</span><AdminNotifications /></header>
          <Outlet context={dashboard} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
