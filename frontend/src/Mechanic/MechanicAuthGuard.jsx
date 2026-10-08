import { Navigate } from 'react-router-dom';

export default function MechanicAuthGuard({ children }) {
  return localStorage.getItem('mechanicToken')
    ? children
    : <Navigate to="/mechanic/login" replace />;
}