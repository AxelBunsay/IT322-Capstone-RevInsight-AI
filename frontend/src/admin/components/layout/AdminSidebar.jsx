import { useNavigate } from 'react-router-dom';
import useAuth from '../../../context/useAuth';
import navigation from '../../config/navigation';
import SidebarItem from './SidebarItem';
import UserCard from './UserCard';

function AdminSidebar({ user, badges, loading }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'admin';
  const allowedItems = navigation.filter((item) => !item.roles?.length || item.roles.includes(role));
  const signOutItem = { id: 'logout', label: 'Log out', icon: 'logout', action: true };
  const signOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        {allowedItems.map((item) => (
          <SidebarItem key={item.id} item={item} badge={loading ? 0 : badges?.[item.badgeKey]} />
        ))}
        <SidebarItem item={signOutItem} onAction={signOut} />
      </nav>
      <UserCard user={user} />
    </aside>
  );
}

export default AdminSidebar;
