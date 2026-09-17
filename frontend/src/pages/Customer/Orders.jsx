import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { CustomerPage } from './CustomerLayout';
import './customer.css';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reorderingId, setReorderingId] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.getCustomerOrders().then((response) => {
      if (isMounted) setOrders(response.orders || []);
    }).catch((requestError) => {
      if (isMounted) setError(requestError.message || 'Orders could not be loaded.');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const reorder = async (order) => {
    setReorderingId(order._id);
    setError('');
    try {
      const response = await api.reorder(order._id);
      navigate('/customer/cart', { state: { message: response.warnings?.length ? response.warnings.join(' ') : 'Order items added to your cart.' } });
    } catch (requestError) {
      setError(requestError.message || 'Order could not be reordered.');
    } finally {
      setReorderingId('');
    }
  };

  return <CustomerPage title="My Orders" description="Review your current and past orders.">
    {error && <p className="customer-error" role="alert">{error}</p>}
    {isLoading ? <p>Loading orders...</p> : !orders.length ? <p className="customer-empty">You have no orders yet. <Link to="/customer/shop">Start shopping</Link></p> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order._id}><div className="order-card-header"><div><h2>Order #{order._id.slice(-6).toUpperCase()}</h2><p>{new Date(order.createdAt).toLocaleString('en-PH')}</p></div><span className={`order-status status-${order.status}`}>{order.status}</span></div><div className="order-items">{order.items.map((item) => <div className="order-item" key={`${order._id}-${item.productId}`}><span>{item.productName} × {item.quantity}</span><strong>₱{Number(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>)}</div><div className="order-card-footer"><strong>Total: ₱{Number(order.totalPrice ?? order.totalAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong><button type="button" onClick={() => reorder(order)} disabled={reorderingId === order._id}>{reorderingId === order._id ? 'Reordering...' : 'Reorder'}</button></div></article>)}</div>}
  </CustomerPage>;
}
