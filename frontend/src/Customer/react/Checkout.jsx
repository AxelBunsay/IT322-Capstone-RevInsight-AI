import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/customer-flow.css';

const money = (value) => `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, promoCode, profile, addresses, placeOrder } = useCustomerPrototype();
  const hasProducts = cart.some((item) => item.kind === 'product');
  const productSubtotal = cart.filter((item) => item.kind === 'product').reduce((total, item) => total + item.price * item.quantity, 0);
  const steps = hasProducts ? ['Delivery', 'Payment', 'Review'] : ['Payment', 'Review'];
  const [step, setStep] = useState(hasProducts ? 'delivery' : 'payment');
  const [fulfillment, setFulfillment] = useState('delivery');
  const [payment, setPayment] = useState('Cash on delivery');
  const [address, setAddress] = useState(addresses[0]?.label || '');
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const serviceTotal = cart.filter((item) => item.kind === 'service').reduce((total, item) => total + item.price, 0);
  const discount = promoCode === 'RIDE10' ? subtotal * 0.1 : promoCode === 'WRENCH15' ? serviceTotal * 0.15 : 0;
  const deliveryFee = hasProducts && fulfillment === 'delivery' && productSubtotal < 1500 ? 99 : 0;
  const total = subtotal - discount + deliveryFee;
  const currentStep = step === 'delivery' ? 0 : step === 'payment' ? (hasProducts ? 1 : 0) : steps.length - 1;

  if (!cart.length) return <CustomerPage title="Checkout" description="Review your cart before checking out."><p className="customer-empty">Your cart is empty. <Link to="/customer/shop">Continue shopping</Link></p></CustomerPage>;

  const completeOrder = () => {
    const order = placeOrder({ subtotal, discount, deliveryFee, total, fulfillment: hasProducts ? fulfillment : 'service reservation', address: fulfillment === 'delivery' ? address || profile.address || 'Address to be confirmed' : '', payment });
    navigate('/customer/order-confirmation', { state: { orderId: order.id } });
  };

  return <CustomerPage title="Checkout" description="A few details, then your order is confirmed.">
    <div className="customer-flow-page customer-checkout-page">
      <div className="customer-checkout-progress" aria-label="Checkout progress">{steps.map((label, index) => <div className={index < currentStep ? 'is-complete' : index === currentStep ? 'is-current' : ''} key={label}><span>{index < currentStep ? '✓' : index + 1}</span><strong>{label}</strong></div>)}</div>
      <div className="customer-checkout-layout"><section className="customer-checkout-panel">
        {step === 'delivery' && <><p className="customer-eyebrow">STEP 1 OF 3</p><h2>Delivery or pickup</h2><div className="customer-choice-grid"><label className={fulfillment === 'delivery' ? 'is-selected' : ''}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /><strong>Deliver to me</strong><small>{productSubtotal >= 1500 ? 'Free delivery' : '₱99 delivery fee, free over ₱1,500'}</small></label><label className={fulfillment === 'pickup' ? 'is-selected' : ''}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /><strong>Pick up in store</strong><small>Manoy&apos;s Motorcycle · Quezon City</small></label></div>{fulfillment === 'delivery' && <label className="customer-checkout-field">Delivery address<select value={address} onChange={(event) => setAddress(event.target.value)}><option value="">Use my account address</option>{addresses.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}{profile.address && <option value={profile.address}>{profile.address}</option>}</select></label>}<button type="button" className="customer-primary-button" onClick={() => setStep('payment')}>Continue to payment</button></>}
        {step === 'payment' && <><p className="customer-eyebrow">STEP {hasProducts ? '2' : '1'} OF {steps.length}</p><h2>Payment method</h2><div className="customer-payment-options">{['Cash on delivery', 'GCash', 'Card on pickup'].map((method) => <label className={payment === method ? 'is-selected' : ''} key={method}><input type="radio" name="payment" value={method} checked={payment === method} onChange={() => setPayment(method)} /><span><strong>{method}</strong><small>{method === 'Cash on delivery' ? 'Pay when your order arrives' : method === 'GCash' ? 'Prototype selection, no charge now' : 'Pay at the shop'}</small></span></label>)}</div><div className="customer-checkout-actions">{hasProducts && <button type="button" className="customer-secondary-button" onClick={() => setStep('delivery')}>Back</button>}<button type="button" className="customer-primary-button" onClick={() => setStep('review')}>Review order</button></div></>}
        {step === 'review' && <><p className="customer-eyebrow">STEP {steps.length} OF {steps.length}</p><h2>Review your order</h2><div className="customer-review-lines">{cart.map((item) => <div key={item.key}><span><strong>{item.name}</strong><small>{item.kind === 'service' ? `${item.bookingDate} · ${item.timeSlot} · ${item.vehicle}` : `Qty ${item.quantity}`}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="customer-review-meta"><p><span>Fulfillment</span><strong>{hasProducts ? fulfillment === 'pickup' ? 'Store pickup' : `Delivery · ${address || profile.address || 'Address to be confirmed'}` : 'Service reservation'}</strong></p><p><span>Payment</span><strong>{payment}</strong></p></div><div className="customer-checkout-actions"><button type="button" className="customer-secondary-button" onClick={() => setStep('payment')}>Back</button><button type="button" className="customer-primary-button" onClick={completeOrder}>Place order · {money(total)}</button></div></>}
      </section><aside className="customer-checkout-summary"><h2>Summary</h2><p><span>Subtotal</span><strong>{money(subtotal)}</strong></p><p><span>Delivery</span><strong>{deliveryFee ? money(deliveryFee) : hasProducts ? fulfillment === 'pickup' ? 'Pickup' : 'Free' : '—'}</strong></p>{discount > 0 && <p><span>Promo</span><strong>−{money(discount)}</strong></p>}<div><span>Total</span><strong>{money(total)}</strong></div></aside></div>
    </div>
  </CustomerPage>;
}