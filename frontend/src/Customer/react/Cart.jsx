import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/customer-flow.css';

const money = (value) => `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export default function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, promoCode, updateCartItem, removeCartItem, applyPromoCode } = useCustomerPrototype();
  const [promoInput, setPromoInput] = useState(promoCode);
  const [promoMessage, setPromoMessage] = useState('');
  const products = cart.filter((item) => item.kind === 'product');
  const productSubtotal = products.reduce((total, item) => total + item.price * item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const eligibleServiceTotal = cart.filter((item) => item.kind === 'service').reduce((total, item) => total + item.price, 0);
  const discount = promoCode === 'RIDE10' ? subtotal * 0.1 : promoCode === 'WRENCH15' ? eligibleServiceTotal * 0.15 : 0;
  const deliveryFee = products.length && productSubtotal < 1500 ? 99 : 0;

  const submitPromo = (event) => {
    event.preventDefault();
    setPromoMessage(applyPromoCode(promoInput) ? 'Promo applied.' : 'Enter RIDE10 or WRENCH15.');
  };

  return <CustomerPage title="Cart" description="Review products and service bookings before checkout.">
    <div className="customer-flow-page customer-cart-page">
      {location.state?.message && <p className="customer-success" role="status">{location.state.message}</p>}
      {cart.length === 0 ? <section className="customer-empty-cart"><span aria-hidden="true">▱</span><h2>Your cart is empty</h2><p>Add a part or reserve a service to get started.</p><div><Link className="customer-primary-button" to="/customer/shop">Browse parts</Link><Link className="customer-secondary-button" to="/customer/services">Explore services</Link></div></section> : <div className="customer-cart-layout">
        <section className="customer-cart-items" aria-label="Cart items">
          {cart.map((item) => <article className="customer-cart-item" key={item.key}>
            <div className={`customer-cart-item-art${item.kind === 'service' ? ' is-service' : ''}`} aria-hidden="true">{item.icon || (item.kind === 'service' ? '🔧' : '▣')}</div>
            <div className="customer-cart-item-copy"><span className="customer-cart-item-kind">{item.kind === 'service' ? 'SERVICE RESERVATION' : item.category}</span><h2>{item.name}</h2><p>{item.kind === 'service' ? `${item.bookingDate} · ${item.timeSlot} · ${item.vehicle}` : `${money(item.price)} each · ${item.stock} in stock`}</p>{item.notes && <small>Note: {item.notes}</small>}</div>
            <div className="customer-cart-item-actions">{item.kind === 'product' && <div className="customer-quantity-control"><div><button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => updateCartItem(item.key, item.quantity - 1)}>−</button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= item.stock} onClick={() => updateCartItem(item.key, item.quantity + 1)}>+</button></div></div>}<strong>{money(item.price * item.quantity)}</strong><button type="button" className="customer-remove-item" onClick={() => removeCartItem(item.key)}>Remove</button></div>
          </article>)}
          <Link className="customer-continue-link" to="/customer/shop">← Continue shopping</Link>
        </section>
        <aside className="customer-cart-summary">
          <h2>Order summary</h2>
          <div className="customer-summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <div className="customer-summary-line"><span>Delivery</span><strong>{products.length ? deliveryFee ? money(deliveryFee) : 'Free' : 'Not required'}</strong></div>
          {discount > 0 && <div className="customer-summary-line is-discount"><span>Promo ({promoCode})</span><strong>−{money(discount)}</strong></div>}
          <div className="customer-summary-total"><span>Estimated total</span><strong>{money(subtotal - discount + deliveryFee)}</strong></div>
          {!!products.length && productSubtotal < 1500 && <p className="customer-delivery-nudge">Add {money(1500 - productSubtotal)} more in parts for free delivery.</p>}
          <form className="customer-promo-form" onSubmit={submitPromo}><label htmlFor="customer-promo">Promo code</label><div><input id="customer-promo" value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Enter code" /><button type="submit">Apply</button></div>{promoMessage && <small role="status">{promoMessage}</small>}</form>
          <button type="button" className="customer-primary-button customer-checkout-button" onClick={() => navigate('/customer/checkout')}>Continue to checkout</button>
        </aside>
      </div>}
    </div>
  </CustomerPage>;
}
