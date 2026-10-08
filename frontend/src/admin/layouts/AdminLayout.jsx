import { Outlet } from 'react-router-dom';
import useAuth from '../../context/useAuth';
import useDashboardData from '../hooks/useDashboardData';
import AdminNavbar from '../components/layout/AdminNavbar';
import AdminSidebar from '../components/layout/AdminSidebar';
import '../styles/admin.css';
import '../styles/layout.css';
import '../styles/dashboard.css';
import '../styles/management.css';

function AdminLayout() {
  const { user } = useAuth();
  const dashboard = useDashboardData();

  return (
    <div className="admin-root">
      <AdminNavbar />
      <div className="admin-shell">
        <AdminSidebar user={user} badges={dashboard.data?.badges} loading={dashboard.loading} />
        <main className="admin-main" id="admin-main">
          <Outlet context={dashboard} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
