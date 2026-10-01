import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import { AdminApp } from './admin';
import Cart from './pages/Customer/react/Cart';
import { CustomerLogin, CustomerRegister } from './pages/Customer/react/CustomerAuth';
import CustomerProfile from './pages/Customer/react/Profile';
import Shop from './pages/Customer/react/Shop';
import Services from './pages/Customer/react/Services';
import MechanicLogin from './pages/Mechanic/MechanicLogin';
import MechanicDashboard from './pages/Mechanic/MechanicDashboard';
import MechanicJobs from './pages/Mechanic/MechanicJobs';
import MechanicProfile from './pages/Mechanic/MechanicProfile';
import MechanicAuthGuard from './pages/Mechanic/MechanicAuthGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Shop />} />
        <Route path="/customer/shop" element={<Shop />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/services" element={<Services />} />
        <Route path="/customer/orders" element={<CustomerProfile />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/mechanic/login" element={<MechanicLogin />} />
        <Route path="/mechanic/dashboard" element={<MechanicAuthGuard><MechanicDashboard /></MechanicAuthGuard>} />
        <Route path="/mechanic/jobs" element={<MechanicAuthGuard><MechanicJobs /></MechanicAuthGuard>} />
        <Route path="/mechanic/profile" element={<MechanicAuthGuard><MechanicProfile /></MechanicAuthGuard>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;