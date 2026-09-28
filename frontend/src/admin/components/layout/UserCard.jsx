import { useNavigate } from 'react-router-dom';
import useAuth from '../../../context/useAuth';

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" /><path d="M13 8.5 17 12l-4 3.5M17 12H9" /></svg>;
}

function UserCard({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.name || user?.username || 'Admin';
  const role = user?.role || 'admin';

  const signOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-user-card">
      <span className="admin-user-card__avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <span className="admin-user-card__meta"><strong>{name}</strong><small>{role.replaceAll('-', ' ')}</small></span>
      <button className="admin-user-card__logout" type="button" onClick={signOut} aria-label="Log out"><LogoutIcon /></button>
    </div>
  );
}

export default UserCard;
