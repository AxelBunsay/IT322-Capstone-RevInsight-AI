import { Link, useLocation } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/customer-flow.css';

export default function OrderConfirmation() {
  const location = useLocation();
  const { orders } = useCustomerPrototype();
  const order = orders.find((item) => item.id === location.state?.orderId) || orders[0];

  return <CustomerPage title="Booking confirmed" description="Your service booking has been submitted.">
    <section className="customer-confirmation-card"><span className="customer-confirmation-check" aria-hidden="true">✓</span><p className="customer-eyebrow">THANK YOU</p><h1>Your booking is confirmed</h1><p>Your service booking has been sent to the shop and saved to your account.</p>{order && <div className="customer-confirmation-order"><span>Booking reference</span><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleString('en-PH')} · Total {`₱${Number(order.total).toLocaleString('en-PH')}`}</small></div>}<div className="customer-detail-actions"><Link className="customer-primary-button" to="/customer/profile">View account</Link><Link className="customer-secondary-button" to="/customer/shop">Continue shopping</Link></div></section>
  </CustomerPage>;
}