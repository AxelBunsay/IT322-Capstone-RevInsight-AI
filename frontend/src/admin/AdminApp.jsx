import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Transactions from './pages/Transactions';
import Inventory from './pages/Inventory';
import Mechanics from './pages/Mechanics';
import ServiceRequests from './pages/ServiceRequests';

function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="mechanics" element={<Mechanics />} />
          <Route path="service-requests" element={<ServiceRequests />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AdminApp;
