import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './customer.css';

function CustomerPage({ title, description, children }) {
  return (
    <main className="customer-page">
      <nav aria-label="Customer navigation"><Link to="/customer/shop">Shop</Link><Link to="/customer/services">Services</Link><Link to="/customer/orders">My Orders</Link></nav>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  );
}

function CustomerLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.loginCustomer(credentials);
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customerUser', JSON.stringify(response.user || {}));
      navigate('/customer/shop');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <CustomerPage title="Customer Login" description="Sign in to manage your motorcycle orders and services.">
    <form className="customer-form" onSubmit={submitLogin}>
      {error && <p className="customer-error" role="alert">{error}</p>}
      <label>Email<input type="email" required value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} /></label>
      <label>Password<input type="password" required value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign In'}</button>
    </form>
  </CustomerPage>;
}

function CustomerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.registerCustomer(formData);
      setMessage('OTP sent to your email. Please check your inbox.');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.verifyOtp(formData.email, otp);
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customerUser', JSON.stringify(response.user || {}));
      navigate('/customer/shop');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await api.resendOtp(formData.email);
      setMessage('OTP resent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    }
  };

  if (step === 'register') {
    return <CustomerPage title="Create Account" description="Register to start shopping and booking services.">
      {error && <p className="customer-error" role="alert">{error}</p>}
      {message && <p className="customer-success" role="status">{message}</p>}
      <form className="customer-form" onSubmit={handleRegister}>
        <div className="form-row">
          <label>First Name<input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></label>
          <label>Last Name<input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></label>
        </div>
        <label>Email<input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></label>
        <label>Phone Number<input type="tel" required value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+63 9xx xxx xxxx" /></label>
        <label>Password<input type="password" required minLength="6" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></label>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</button>
      </form>
      <p className="customer-link">Already have an account? <Link to="/customer/login">Sign In</Link></p>
    </CustomerPage>;
  }

  return <CustomerPage title="Verify Email" description="Enter the 6-digit code sent to your email.">
    {error && <p className="customer-error" role="alert">{error}</p>}
    {message && <p className="customer-success" role="status">{message}</p>}
    <form className="customer-form" onSubmit={handleVerify}>
      <label>OTP Code<input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" style={{ letterSpacing: '0.5em', textAlign: 'center' }} /></label>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</button>
    </form>
    <p className="customer-link">Didn't receive the code? <button type="button" onClick={handleResend} disabled={isSubmitting}>Resend OTP</button></p>
    <p className="customer-link"><Link to="/customer/login">Back to Login</Link></p>
  </CustomerPage>;
}

function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getProducts(), api.getCart().catch(() => ({ cart: { items: [] } }))])
      .then(([productResponse, cartResponse]) => {
        if (!isMounted) return;
        setProducts(productResponse.products || productResponse.data || []);
        setCartCount((cartResponse.cart?.items || []).reduce((total, item) => total + item.quantity, 0));
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Products could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const categories = ['All', ...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === 'All' || product.category === category);
  });

  const addProduct = async (product) => {
    setAddingId(product._id);
    setError('');
    try {
      const response = await api.addToCart(product._id);
      setCartCount((response.cart?.items || []).reduce((total, item) => total + item.quantity, 0));
    } catch (requestError) {
      setError(requestError.message || 'Please sign in before adding items to your cart.');
    } finally {
      setAddingId('');
    }
  };

  return <CustomerPage title="Motorcycle Shop" description="Browse available parts and accessories.">
    <div className="shop-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">{categories.map((item) => <option key={item}>{item}</option>)}</select><Link className="cart-link" to="/customer/cart">Cart ({cartCount})</Link></div>
    {error && <p className="customer-error" role="alert">{error}</p>}
    {isLoading ? <p>Loading products...</p> : <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product._id}><div className="product-image">{product.image ? <img src={product.image} alt={product.name} /> : <span>Parts</span>}</div><div className="product-card-body"><h2>{product.name}</h2><p className="product-category">{product.category}</p><p className="product-price">₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p><p className={product.quantity > 0 ? 'product-stock' : 'product-stock out-of-stock'}>{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</p><button type="button" disabled={!product.quantity || addingId === product._id} onClick={() => addProduct(product)}>{addingId === product._id ? 'Adding...' : 'Add to cart'}</button></div></article>)}</div>}
    {!isLoading && !visibleProducts.length && <p className="customer-empty">No products match your search.</p>}
  </CustomerPage>;
}

function Cart() {
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
    try {
      const response = await api.updateCart(item.productId, quantity);
      setCart(response.cart);
    } catch (requestError) {
      setError(requestError.message || 'Cart could not be updated.');
    }
  };

  const removeItem = async (item) => {
    try {
      const response = await api.removeFromCart(item.productId);
      setCart(response.cart || { items: [], totalPrice: 0 });
    } catch (requestError) {
      setError(requestError.message || 'Item could not be removed.');
    }
  };

  const checkout = async () => {
    setIsCheckingOut(true);
    setError('');
    try {
      const response = await api.checkout();
      setCart({ items: [], totalPrice: 0 });
      setMessage(response.message || 'Order created successfully.');
    } catch (requestError) {
      setError(requestError.message || 'Checkout failed.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return <CustomerPage title="Your Cart" description="Review your items before checkout.">
    {error && <p className="customer-error" role="alert">{error}</p>}
    {message && <p className="customer-success" role="status">{message}</p>}
    {isLoading ? <p>Loading cart...</p> : !cart.items.length ? <p className="customer-empty">Your cart is empty. <Link to="/customer/shop">Continue shopping</Link></p> : <div className="cart-layout"><div className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.productId}><div><h2>{item.productName}</h2><p>₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })} each</p></div><div className="cart-item-controls"><input aria-label={`Quantity for ${item.productName}`} min="1" type="number" value={item.quantity} onChange={(event) => updateQuantity(item, Number(event.target.value))} /><button type="button" onClick={() => removeItem(item)}>Remove</button></div></article>)}</div><aside className="cart-summary"><h2>Order Summary</h2><p>Total <strong>₱{Number(cart.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></p><button type="button" onClick={checkout} disabled={isCheckingOut}>{isCheckingOut ? 'Processing...' : 'Checkout'}</button></aside></div>}
  </CustomerPage>;
}

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
  const [form, setForm] = useState({ serviceType: '', description: '', mechanicId: '' });
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
      .catch((requestError) => setError(requestError.message || 'Service requests could not be loaded.'))
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
    setForm((currentForm) => ({ ...currentForm, serviceType: service.title, description: `${service.title} - ${service.description}` }));
  };

  return <CustomerPage title="Motorcycle Services" description="Request a service from our mechanics.">
    {error && <p className="customer-error" role="alert">{error}</p>}
    {message && <p className="customer-success" role="status">{message}</p>}
    <div className="shop-toolbar"><input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search services..." aria-label="Search services" /><select value={category} onChange={(event) => { setCategory(event.target.value); setCurrentPage(1); }} aria-label="Filter services by category">{categories.map((item) => <option key={item}>{item}</option>)}</select><span>{filteredServices.length} services</span></div>
    <div className="category-pills">{categories.map((item) => <button type="button" className={item === category ? 'active' : ''} key={item} onClick={() => { setCategory(item); setCurrentPage(1); }}>{item}</button>)}</div>
    <div className="product-grid">{visibleServices.map((service) => <article className="product-card" key={service.id}><div className="product-image"><span>{service.category}</span></div><div className="product-card-body"><h2>{service.title}</h2><p>{service.description}</p><p className="product-price">₱{service.price.toLocaleString('en-PH')}</p><p className="product-category">Estimated time: {service.duration}</p><button type="button" onClick={() => chooseService(service)}>Book Service</button></div></article>)}</div>
    <div className="service-pagination" aria-label="Service pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === currentPage ? 'active' : ''} key={page} onClick={() => setCurrentPage(page)}>{page}</button>)}</div>
    {selectedService && <p className="customer-success" role="status">Selected: {selectedService.title}. Choose a mechanic below to submit your request.</p>}
    <form className="service-form" onSubmit={submitRequest}><label>Preferred mechanic<select required value={form.mechanicId} onChange={(event) => setForm({ ...form, mechanicId: event.target.value })}><option value="">Choose a mechanic</option>{mechanics.filter((mechanic) => mechanic.isActive !== false).map((mechanic) => <option key={mechanic.id || mechanic._id} value={mechanic.id || mechanic._id}>{mechanic.firstName} {mechanic.lastName} · {mechanic.specialization || 'General service'}</option>)}</select></label><label>Selected service<input readOnly required value={form.serviceType} placeholder="Choose Book Service above" /></label><label>Description<textarea required minLength="10" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add details about the service needed..." /></label><button type="submit" disabled={isSubmitting || !mechanics.length || !form.serviceType}>{isSubmitting ? 'Submitting...' : 'Request Service'}</button></form>
    <h2 className="customer-section-title">Your Requests</h2>
    {isLoading ? <p>Loading service requests...</p> : !requests.length ? <p className="customer-empty">You have no service requests yet.</p> : <div className="service-request-list">{requests.map((request) => <article className="service-request-card" key={request._id}><div><h3>{request.serviceType.replaceAll('-', ' ')}</h3><p>{request.description}</p><small>{request.mechanic ? `Mechanic: ${request.mechanic.firstName || ''} ${request.mechanic.lastName || ''}` : 'Awaiting mechanic confirmation'} · {new Date(request.createdAt).toLocaleString('en-PH')}</small></div><span className={`order-status status-${request.status}`}>{request.status.replaceAll('-', ' ')}</span></article>)}</div>}
  </CustomerPage>;
}

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reorderingId, setReorderingId] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.getCustomerOrders()
      .then((response) => {
        if (isMounted) setOrders(response.orders || []);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Orders could not be loaded.');
      })
      .finally(() => {
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

export { CustomerLogin, CustomerRegister, Shop, Cart, Services, Orders };
