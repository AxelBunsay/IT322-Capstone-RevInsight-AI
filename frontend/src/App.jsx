import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import { AdminApp } from './admin';
import Cart from './Customer/react/Cart';
import { CustomerLogin, CustomerRegister } from './Customer/react/CustomerAuth';
import CustomerProfile from './Customer/react/Profile';
import Shop from './Customer/react/Shop';
import Services from './Customer/react/Services';
import ProductDetail from './Customer/react/ProductDetail';
import ServiceDetail from './Customer/react/ServiceDetail';
import Checkout from './Customer/react/Checkout';
import OrderConfirmation from './Customer/react/OrderConfirmation';
import Reservations from './Customer/react/Reservations';
import ReservationDetail from './Customer/react/ReservationDetail';
import MechanicLogin from './Mechanic/MechanicLogin';
import MechanicDashboard from './Mechanic/MechanicDashboard';
import MechanicJobs from './Mechanic/MechanicJobs';
import MechanicProfile from './Mechanic/MechanicProfile';
import MechanicAuthGuard from './Mechanic/MechanicAuthGuard';
import { CustomerPrototypeProvider } from './Customer/react/CustomerPrototypeProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomerPrototypeProvider>
          <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Shop />} />
        <Route path="/customer/shop" element={<Shop />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/services" element={<Services />} />
        <Route path="/customer/services/:serviceId" element={<ServiceDetail />} />
        <Route path="/customer/products/:productId" element={<ProductDetail />} />
        <Route path="/customer/orders" element={<Reservations />} />
        <Route path="/customer/purchases" element={<Reservations />} />
        <Route path="/customer/reservations" element={<Reservations />} />
        <Route path="/customer/reservations/:reservationId" element={<ReservationDetail />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/mechanic/login" element={<MechanicLogin />} />
        <Route path="/mechanic/dashboard" element={<MechanicAuthGuard><MechanicDashboard /></MechanicAuthGuard>} />
        <Route path="/mechanic/jobs" element={<MechanicAuthGuard><MechanicJobs /></MechanicAuthGuard>} />
        <Route path="/mechanic/profile" element={<MechanicAuthGuard><MechanicProfile /></MechanicAuthGuard>} />
          </Routes>
        </CustomerPrototypeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;