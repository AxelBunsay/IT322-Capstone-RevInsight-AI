import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { CustomerHeader, CustomerPage } from './CustomerLayout';
import '../styles/shared.css';
import '../styles/services.css';

const serviceCatalog = [
  { id: 'SVC-01', title: 'Foam Seat Repair', description: 'Professional foam seat repair for worn-out or damaged motorcycle seats. Restores comfort and shape.', price: 250, duration: '1-2 hrs', category: 'Seat Works' },
  { id: 'SVC-02', title: 'Flat/Semi Seat Customization', description: 'Custom flat or semi-flat seat fabrication tailored to your motorcycle.', price: 500, duration: '2-4 hrs', category: 'Seat Works' },
  { id: 'SVC-03', title: 'Indo Seat Customization', description: 'Full indo-style seat customization with premium leatherette and foam.', price: 750, duration: '3-6 hrs', category: 'Seat Works' },
  { id: 'SVC-04', title: 'Change Oil', description: 'Complete oil change service covering front shock oil, engine oil, and gear oil.', price: 150, duration: '30-45 min', category: 'Engine' },
  { id: 'SVC-05', title: 'Chain and Sprocket Replacement', description: 'Full chain and sprocket set replacement with proper tensioning and alignment.', price: 350, duration: '1-2 hrs', category: 'Drive' },
  { id: 'SVC-06', title: 'Tune-up Service', description: 'Comprehensive tune-up including spark plug change, air filter cleaning, and idle adjustment.', price: 300, duration: '1-2 hrs', category: 'Engine' },
  { id: 'SVC-07', title: 'Knuckle Bearing Replacement', description: 'Replacement of worn knuckle bearings for smooth steering and handling.', price: 420, duration: '1-3 hrs', category: 'Drive' },
  { id: 'SVC-08', title: 'Brake Repair/Replacement', description: 'Full brake system inspection, repair, or replacement including pads, shoes, and discs.', price: 280, duration: '45-90 min', category: 'Brakes' },
  { id: 'SVC-09', title: 'Engine Check-up', description: 'Comprehensive engine diagnostic and inspection covering compression, timing, and injector performance.', price: 200, duration: '45-60 min', category: 'Engine' },
  { id: 'SVC-10', title: 'Engine Troubleshooting', description: 'In-depth engine troubleshooting to identify and resolve starting issues and power loss.', price: 380, duration: '1-4 hrs', category: 'Engine' },
  { id: 'SVC-11', title: 'General Check-up', description: 'Full motorcycle general check-up covering engine, brakes, tires, lights, and belts.', price: 180, duration: '45-60 min', category: 'Inspection' },
  { id: 'SVC-12', title: 'Battery Services', description: 'Battery inspection, terminal cleaning, load testing, and replacement service.', price: 150, duration: '30-45 min', category: 'Electrical' }
];

function Services() {
  const [form, setForm] = useState({ serviceType: '', description: '', mechanicId: '', estimatedPrice: 0, scheduledDate: '' });
  const [selectedService, setSelectedService] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pageSize = 8;
  const categories = ['All', ...new Set(serviceCatalog.map((service) => service.category))];
  const filteredServices = serviceCatalog.filter((service) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [service.title, service.description, service.category].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (category === 'All' || service.category === category);
  });
  const pageCount = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const visibleServices = filteredServices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadRequests = () => api.getCustomerServiceRequests().then((response) => setRequests(response.requests || []));

  useEffect(() => {
    Promise.all([loadRequests(), api.getAvailableMechanics().then((response) => setMechanics(response.mechanics || response.data || []))])
      .catch(() => {})
      .finally(() => setIsLoading(false));
    const refreshInterval = window.setInterval(() => loadRequests().catch(() => {}), 15000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  const submitRequest = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await api.createServiceRequest(form);
      setMessage(response.message || 'Service request created.');
      setSelectedService(null);
      setForm({ ...form, description: '' });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message || 'Service request could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const chooseService = (service) => {
    setSelectedService(service);
    setForm((currentForm) => ({ ...currentForm, serviceType: service.title, estimatedPrice: service.price, description: `${service.title} - ${service.description}` }));
  };

  return <CustomerPage title="Motorcycle Services" description="Request a service from our mechanics." includeHeader={false}>
    <CustomerHeader />
    <section className="service-hero" aria-label="Services introduction">
      <div><p>MANOY&apos;S MOTORCYCLE PARTS, ACCESSORIES &amp; SERVICES</p><h2>Mechanic Services <span aria-hidden="true">🔧</span></h2><span>Book a service by adding it to your cart. Our skilled mechanics will handle the rest.</span></div>
      <div className="service-hero-mark" aria-hidden="true">⚙</div>
      <div className="service-hero-stats"><strong>{serviceCatalog.length} Services</strong><strong>Expert Mechanics</strong><strong>Quality Guaranteed</strong></div>
    </section>
    {error && <p className="customer-error" role="alert">{error}</p>}
    {message && <p className="customer-success" role="status">{message}</p>}
    <div className="shop-toolbar"><input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search services..." aria-label="Search services" /><span>{filteredServices.length} services</span></div>
    <div className="category-pills">{categories.map((item) => <button type="button" className={item === category ? 'active' : ''} key={item} onClick={() => { setCategory(item); setCurrentPage(1); }}>{item}<span>{item === 'All' ? serviceCatalog.length : serviceCatalog.filter((service) => service.category === item).length}</span></button>)}</div>
    <div className="product-grid">{visibleServices.map((service, index) => <article className="product-card service-card" key={service.id}><div className={`product-image service-image service-tone-${index % 4}`}><small>{service.id}</small><span className="service-icon" aria-hidden="true">{['✂', '✂', '☆', '♨'][index % 4]}</span><small>◷ {service.duration}</small></div><div className="product-card-body"><h2>{service.title}</h2><p>{service.description}</p><div className="service-card-footer"><p className="product-price">₱{service.price.toLocaleString('en-PH')}</p><span>Available</span></div><button type="button" onClick={() => chooseService(service)}>Book Service</button></div></article>)}</div>
    <div className="service-pagination" aria-label="Service pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === currentPage ? 'active' : ''} key={page} onClick={() => setCurrentPage(page)}>{page}</button>)}</div>
    {selectedService && <div className="service-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedService(null); }}>
      <section className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
        <div className="service-modal-header"><div><p className="service-modal-kicker">SERVICE BOOKING</p><h2 id="service-modal-title">Book {selectedService.title}</h2></div><button type="button" className="service-modal-close" aria-label="Close booking form" onClick={() => setSelectedService(null)}>×</button></div>
        <p className="customer-success" role="status">Choose a mechanic and schedule your service below.</p>
        <form className="service-form" onSubmit={submitRequest}><label>Preferred mechanic<select required value={form.mechanicId} onChange={(event) => setForm({ ...form, mechanicId: event.target.value })}><option value="">Choose a mechanic</option>{mechanics.filter((mechanic) => mechanic.isActive !== false).map((mechanic) => <option key={mechanic.id || mechanic._id} value={mechanic.id || mechanic._id}>{mechanic.firstName} {mechanic.lastName} · {mechanic.specialization || 'General service'}</option>)}</select></label><label>Requested date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} /></label><label>Selected service<input readOnly required value={form.serviceType} /></label><label>Description<textarea required minLength="10" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add details about the service needed..." /></label><button type="submit" disabled={isSubmitting || !mechanics.length || !form.serviceType}>{isSubmitting ? 'Submitting...' : 'Request Service'}</button></form>
      </section>
    </div>}
    <h2 className="customer-section-title">Your Requests</h2>
    {isLoading ? <p>Loading service requests...</p> : !requests.length ? <p className="customer-empty">You have no service requests yet.</p> : <div className="service-request-list">{requests.map((request) => <article className="service-request-card" key={request._id}><div><h3>{request.serviceType.replaceAll('-', ' ')}</h3><p>{request.description}</p><small>{request.mechanic ? `Mechanic: ${request.mechanic.firstName || ''} ${request.mechanic.lastName || ''}` : 'Awaiting mechanic confirmation'} · Requested {new Date(request.createdAt).toLocaleString('en-PH')}{request.scheduledDate ? ` · Scheduled ${new Date(request.scheduledDate).toLocaleDateString('en-PH')}` : ''}</small></div><span className={`order-status status-${request.status}`}>{request.status.replaceAll('-', ' ')}</span></article>)}</div>}
  </CustomerPage>;
}

export default Services;
