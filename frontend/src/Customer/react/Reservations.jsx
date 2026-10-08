import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/customer-flow.css';

const money = (value) => `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export default function Reservations() {
  const { reservations, orders } = useCustomerPrototype();
  const [activeTab, setActiveTab] = useState('items');
  const purchasedItems = orders.flatMap((order) => (order.items || [])
    .filter((item) => item.kind === 'product')
    .map((item, index) => ({
      ...item,
      id: `${order.id}-${item.id}-${index}`,
      orderId: order.id,
      orderStatus: order.status,
      orderDate: order.createdAt,
      fulfillment: order.fulfillment
    })));
  const records = activeTab === 'items' ? purchasedItems : reservations;

  return <CustomerPage title="My Purchases" description="Review the items you bought and services you have availed.">
    <div className="customer-flow-page customer-reservations-page">
      <div className="customer-flow-section-heading"><div><p className="customer-eyebrow">YOUR ACTIVITY</p><h2>Purchase history</h2></div><span>{purchasedItems.length + reservations.length} records</span></div>
      <div className="customer-reservation-tabs" role="tablist" aria-label="Purchase history">
        <button type="button" role="tab" aria-selected={activeTab === 'items'} className={activeTab === 'items' ? 'is-active' : ''} onClick={() => setActiveTab('items')}>Items <span>{purchasedItems.length}</span></button>
        <button type="button" role="tab" aria-selected={activeTab === 'services'} className={activeTab === 'services' ? 'is-active' : ''} onClick={() => setActiveTab('services')}>Services <span>{reservations.length}</span></button>
      </div>
      {!records.length ? <section className="customer-empty-cart"><span aria-hidden="true">{activeTab === 'services' ? '⌁' : '▱'}</span><h2>{activeTab === 'services' ? 'No services availed yet' : 'No items purchased yet'}</h2><p>{activeTab === 'services' ? 'Completed service checkouts will appear here.' : 'Items you buy will appear here after checkout.'}</p><Link className="customer-primary-button" to={activeTab === 'services' ? '/customer/services' : '/customer/shop'}>{activeTab === 'services' ? 'Browse services' : 'Browse the shop'}</Link></section> : <div className="customer-reservation-list">{activeTab === 'services' ? reservations.map((reservation) => <article className="customer-reservation-card" key={reservation.id}><div className="customer-reservation-card-top"><div><span className="customer-cart-item-kind">SERVICE · {reservation.id}</span><h2>{reservation.name}</h2><p>{reservation.bookingDate} at {reservation.timeSlot} · {reservation.vehicle}</p></div><span className="customer-status-pill">{reservation.status}</span></div><div className="customer-reservation-card-bottom"><strong>{money(reservation.price)}</strong><Link to={`/customer/reservations/${reservation.id}`}>View service <span aria-hidden="true">→</span></Link></div></article>) : purchasedItems.map((item) => <article className="customer-reservation-card" key={item.id}><div className="customer-reservation-card-top"><div><span className="customer-cart-item-kind">ITEM · {item.orderId}</span><h2>{item.name}</h2><p>Qty {item.quantity} · {new Date(item.orderDate).toLocaleDateString('en-PH')} · {item.fulfillment}</p></div><span className="customer-status-pill">{item.orderStatus}</span></div><div className="customer-reservation-card-bottom"><strong>{money(item.price * item.quantity)}</strong><span>{item.category}</span></div></article>)}</div>}
    </div>
  </CustomerPage>;
}