import { Link, useParams } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import '../styles/customer-flow.css';

export default function ReservationDetail() {
  const { reservationId } = useParams();
  const { reservations } = useCustomerPrototype();
  const reservation = reservations.find((item) => item.id === reservationId);

  if (!reservation) return <CustomerPage title="Reservation not found" description="This reservation is not in your activity yet."><Link to="/customer/reservations">Back to My Reservations</Link></CustomerPage>;

  return <CustomerPage title="Reservation details" description="Follow your service reservation from confirmation to pickup.">
    <div className="customer-flow-page"><nav className="customer-breadcrumbs" aria-label="Breadcrumb"><Link to="/customer/reservations">My Reservations</Link><span>/</span><span>{reservation.id}</span></nav>
      <section className="customer-reservation-detail-card"><div className="customer-reservation-card-top"><div><p className="customer-eyebrow">SERVICE RESERVATION · {reservation.id}</p><h1>{reservation.name}</h1><p>{reservation.bookingDate} at {reservation.timeSlot} · {reservation.vehicle}</p></div><span className="customer-status-pill">{reservation.status}</span></div><div className="customer-reservation-detail-meta"><div><span>Estimated total</span><strong>₱{reservation.price.toLocaleString('en-PH')}</strong></div><div><span>Duration</span><strong>{reservation.duration}</strong></div><div><span>Order reference</span><strong>{reservation.orderId}</strong></div></div><h2>Reservation progress</h2><ol className="customer-reservation-timeline">{reservation.timeline.map((event) => <li className={event.complete ? 'is-complete' : ''} key={event.label}><span className="customer-timeline-marker">{event.complete ? '✓' : ''}</span><div><strong>{event.label}</strong><small>{event.complete ? new Date(event.date).toLocaleString('en-PH') : 'Pending update'}</small></div></li>)}</ol><Link className="customer-secondary-button" to="/customer/services">Book another service</Link></section>
    </div>
  </CustomerPage>;
}