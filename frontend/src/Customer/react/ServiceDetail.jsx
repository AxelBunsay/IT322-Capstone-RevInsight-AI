import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import { serviceCatalog } from './serviceData';
import '../styles/customer-flow.css';

const serviceInclusions = {
  'Engine Tune-up': ['Engine performance inspection', 'Idle and throttle adjustment', 'Road-readiness check'],
  'Oil Change': ['Drain and replace engine oil', 'Inspect drain plug and seals', 'Fluid-level check'],
  'Brake Adjustment': ['Brake pad or shoe inspection', 'Lever and cable adjustment', 'Low-speed brake test'],
  'Full Motorcycle Inspection': ['Safety-critical component review', 'Lights, tires, and controls check', 'Written inspection summary']
};

const timeSlots = [
  { label: '9:00 AM', available: true },
  { label: '10:30 AM', available: false },
  { label: '1:00 PM', available: true },
  { label: '3:30 PM', available: true }
];

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addCartItem, vehicles } = useCustomerPrototype();
  const service = serviceCatalog.find((item) => item.id === serviceId);
  const today = localDateString(new Date());
  const [bookingDate, setBookingDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState('9:00 AM');
  const [vehicle, setVehicle] = useState(vehicles[0]?.name || '');
  const [notes, setNotes] = useState('');

  if (!service) return <CustomerPage title="Service unavailable" description="This service could not be found."><Link to="/customer/services">Back to Services</Link></CustomerPage>;

  const inclusions = serviceInclusions[service.name] || ['Pre-service condition check', `${service.duration} of skilled mechanic work`, 'Final quality and safety check'];
  const submitBooking = (event) => {
    event.preventDefault();
    addCartItem({ kind: 'service', id: service.id, name: service.name, price: service.price, category: service.category, duration: service.duration, icon: service.icon, bookingDate, timeSlot, vehicle: vehicle.trim() || 'Motorcycle details to confirm', notes });
    navigate('/customer/cart', { state: { message: `${service.name} booking added to your cart.` } });
  };

  return <CustomerPage title={service.name} description="Service details and reservation availability.">
    <div className="customer-flow-page">
      <nav className="customer-breadcrumbs" aria-label="Breadcrumb"><Link to="/customer/services">Services</Link><span>/</span><span>{service.category}</span><span>/</span><span>{service.name}</span></nav>
      <section className="customer-detail-layout customer-service-detail">
        <div className={`customer-detail-art tone-${service.tone}`} aria-label={`${service.name} service illustration`}><span aria-hidden="true">{service.icon}</span><small>{service.duration}</small></div>
        <div className="customer-detail-copy"><p className="customer-eyebrow">{service.category} · {service.duration}</p><h1>{service.name}</h1><p>{service.description}</p><strong className="customer-detail-price">₱{service.price.toLocaleString('en-PH')}</strong>
          <h2>What&apos;s included</h2><ul className="customer-inclusion-list">{inclusions.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>
      <form className="customer-booking-panel" onSubmit={submitBooking}>
        <div className="customer-flow-section-heading"><div><p className="customer-eyebrow">RESERVE A TIME</p><h2>Choose a booking slot</h2></div><span>{service.duration}</span></div>
        <div className="customer-booking-fields"><label>Preferred date<input type="date" min={today} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} required /></label><label>Motorcycle{vehicles.length ? <select value={vehicle} onChange={(event) => setVehicle(event.target.value)}><option value="">Select a vehicle</option>{vehicles.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select> : <input value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="e.g. Honda Click 160" required />}</label></div>
        <fieldset className="customer-time-slots"><legend>Available times</legend><div>{timeSlots.map((slot) => <button type="button" key={slot.label} disabled={!slot.available} aria-pressed={timeSlot === slot.label} className={`${timeSlot === slot.label ? 'is-selected' : ''}${!slot.available ? ' is-sold-out' : ''}`} onClick={() => setTimeSlot(slot.label)}>{slot.label}{!slot.available && <small>Fully booked</small>}</button>)}</div></fieldset>
        <label className="customer-notes-field">Notes for the mechanic<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" placeholder="Anything the mechanic should know?" /></label>
        <div className="customer-booking-footer"><p>Estimated total <strong>₱{service.price.toLocaleString('en-PH')}</strong></p><button type="submit" className="customer-primary-button">Add booking to cart</button></div>
      </form>
    </div>
  </CustomerPage>;
}