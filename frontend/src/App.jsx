import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { Inventory, Mechanics, Revenue, ServiceRequests, Transactions } from './pages/Admin/AdminPages';
import AdminLogin from './pages/Auth/AdminLogin';
import { Cart, CustomerLogin, CustomerRegister, Orders, Services, Shop } from './pages/Customer/CustomerPages';
import { Jobs, MechanicDashboard, MechanicLogin, Profile } from './pages/Mechanic/MechanicPages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<h1>RevInsight AI</h1>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/revenue" element={<Revenue />} />
          <Route path="/admin/transactions" element={<Transactions />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/mechanics" element={<Mechanics />} />
          <Route path="/admin/service-requests" element={<ServiceRequests />} />
        </Route>
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/shop" element={<Shop />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/services" element={<Services />} />
        <Route path="/customer/orders" element={<Orders />} />
        <Route path="/mechanic/login" element={<MechanicLogin />} />
        <Route path="/mechanic/dashboard" element={<MechanicDashboard />} />
        <Route path="/mechanic/jobs" element={<Jobs />} />
        <Route path="/mechanic/profile" element={<Profile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;