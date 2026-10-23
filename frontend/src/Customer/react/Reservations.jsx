import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import ProductImage from './ProductImage';
import '../styles/customer-flow.css';

const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
const statusClass = (status) => `status-${String(status || '').toLowerCase().replaceAll(' ', '-')}`;
const formatDate = (value) => value ? new Date(value).toLocaleString('en-PH') : '';

function ItemReservationCard({ reservation }) {
  const keyDate = reservation.status === 'Pending Down Payment'
    ? `Pay by ${formatDate(reservation.paymentDueAt)}`
    : reservation.status === 'Payment Submitted'
      ? `Payment submitted ${formatDate(reservation.submittedAt)}`
    : reservation.status === 'Reserved'
      ? `Reserved until ${formatDate(reservation.reservedUntil)}`
      : reservation.status === 'Completed'
        ? `Picked up ${formatDate(reservation.completedAt)}`
        : reservation.status === 'Expired'
          ? `Expired ${formatDate(reservation.expiredAt)}`
          : `Cancelled ${formatDate(reservation.cancelledAt)}`;

  return <article className="customer-reservation-card">
    <div className="customer-reservation-card-top">
      <div>
        <span className="customer-cart-item-kind">RESERVATION · {reservation.code}</span>
        <div className="customer-reservation-item-list">{reservation.items.map((item) => <span className="customer-reservation-item-row" key={item.productId}><ProductImage src={item.imageUrl} alt="" className="customer-inline-product-image" fallback={<span className="customer-inline-product-placeholder" aria-hidden="true">▣</span>} /><strong>{item.name} × {item.qty}</strong></span>)}</div>
        <p>{keyDate}</p>
      </div>
      <span className={`customer-status-pill ${statusClass(reservation.status)}`}>{reservation.status}</span>
    </div>
    <div className="customer-reservation-card-finances">
      <span>Total <strong>{money(reservation.total)}</strong></span>
      <span>Paid <strong>{money(reservation.amountPaid)}</strong></span>
      <span>Balance <strong>{money(reservation.balanceDue)}</strong></span>
    </div>
    <div className="customer-reservation-card-bottom">
      <Link to={`/customer/reservations/${reservation._id}`}>View reservation <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}

function ServiceReservationCard({ reservation }) {
  return <article className="customer-reservation-card">
    <div className="customer-reservation-card-top">
      <div>
        <span className="customer-cart-item-kind">SERVICE · {reservation.id}</span>
        <h2>{reservation.name}</h2>
        <p>{reservation.bookingDate} at {reservation.timeSlot} · {reservation.vehicle}</p>
      </div>
      <span className="customer-status-pill">{reservation.status}</span>
    </div>
    <div className="customer-reservation-card-bottom">
      <strong>{money(reservation.price)}</strong>
      <Link to={`/customer/reservations/${reservation.id}`}>View booking <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}

export default function Reservations() {
  const { reservations } = useCustomerPrototype();
  const [activeTab, setActiveTab] = useState('items');
  const [itemReservations, setItemReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.getCustomerReservations().then((response) => {
      if (isMounted) setItemReservations(response.reservations || []);
    }).catch((requestError) => {
      if (isMounted) setError(requestError.message || 'Reservations could not be loaded.');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const records = activeTab === 'items' ? itemReservations : reservations;
  return <CustomerPage title="My Purchases" description="Review item reservations and service bookings separately.">
    <div className="customer-flow-page customer-reservations-page">
      {error && <p className="customer-error" role="alert">{error}</p>}
      <div className="customer-flow-section-heading">
        <div><p className="customer-eyebrow">YOUR ACTIVITY</p><h2>Purchases and bookings</h2></div>
        <span>{records.length} {activeTab === 'services' ? 'bookings' : 'reservations'}</span>
      </div>
      <div className="customer-reservation-tabs" role="tablist" aria-label="Purchases and bookings">
        <button type="button" role="tab" aria-selected={activeTab === 'items'} className={activeTab === 'items' ? 'is-active' : ''} onClick={() => setActiveTab('items')}>Reservations <span>{itemReservations.length}</span></button>
        <button type="button" role="tab" aria-selected={activeTab === 'services'} className={activeTab === 'services' ? 'is-active' : ''} onClick={() => setActiveTab('services')}>My bookings <span>{reservations.length}</span></button>
      </div>
      {isLoading && activeTab === 'items'
        ? <p className="customer-empty">Loading reservations...</p>
        : !records.length
          ? <section className="customer-empty-cart">
            <span aria-hidden="true">{activeTab === 'services' ? '⌁' : '▱'}</span>
            <h2>{activeTab === 'services' ? 'No services availed yet' : 'No item reservations yet'}</h2>
            <p>{activeTab === 'services' ? 'Your service bookings will appear here.' : 'Your item reservations and pickup status will appear here.'}</p>
            <Link className="customer-primary-button" to={activeTab === 'services' ? '/customer/services' : '/customer/shop'}>{activeTab === 'services' ? 'Browse services' : 'Browse the shop'}</Link>
          </section>
          : <div className="customer-reservation-list">
            {activeTab === 'services'
              ? reservations.map((reservation) => <ServiceReservationCard key={reservation.id} reservation={reservation} />)
              : itemReservations.map((reservation) => <ItemReservationCard key={reservation._id} reservation={reservation} />)}
          </div>}
    </div>
  </CustomerPage>;
}
