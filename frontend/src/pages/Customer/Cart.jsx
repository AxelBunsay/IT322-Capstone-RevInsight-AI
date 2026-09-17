import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { CustomerPage } from './CustomerLayout';
import './customer.css';

export default function Cart() {
  const location = useLocation();
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const loadCart = () => api.getCart().then((response) => setCart(response.cart || { items: [], totalPrice: 0 }));

  useEffect(() => {
    loadCart().catch((requestError) => setError(requestError.message || 'Cart could not be loaded.')).finally(() => setIsLoading(false));
  }, []);

  const updateQuantity = async (item, quantity) => {
    try { setCart((await api.updateCart(item.productId, quantity)).cart); } catch (requestError) { setError(requestError.message || 'Cart could not be updated.'); }
  };
  const removeItem = async (item) => {
    try { setCart((await api.removeFromCart(item.productId)).cart || { items: [], totalPrice: 0 }); } catch (requestError) { setError(requestError.message || 'Item could not be removed.'); }
  };
  const checkout = async () => {
    setIsCheckingOut(true);
    setError('');
    try { const response = await api.checkout(); setCart({ items: [], totalPrice: 0 }); setMessage(response.message || 'Order created successfully.'); } catch (requestError) { setError(requestError.message || 'Checkout failed.'); } finally { setIsCheckingOut(false); }
  };

  return <CustomerPage title="Your Cart" description="Review your items before checkout.">
    {error && <p className="customer-error" role="alert">{error}</p>}
    {message && <p className="customer-success" role="status">{message}</p>}
    {isLoading ? <p>Loading cart...</p> : !cart.items.length ? <p className="customer-empty">Your cart is empty. <Link to="/customer/shop">Continue shopping</Link></p> : <div className="cart-layout"><div className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.productId}><div><h2>{item.productName}</h2><p>₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })} each</p></div><div className="cart-item-controls"><input aria-label={`Quantity for ${item.productName}`} min="1" type="number" value={item.quantity} onChange={(event) => updateQuantity(item, Number(event.target.value))} /><button type="button" onClick={() => removeItem(item)}>Remove</button></div></article>)}</div><aside className="cart-summary"><h2>Order Summary</h2><p>Total <strong>₱{Number(cart.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></p><button type="button" onClick={checkout} disabled={isCheckingOut}>{isCheckingOut ? 'Processing...' : 'Checkout'}</button></aside></div>}
  </CustomerPage>;
}
