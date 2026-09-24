import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { CustomerPage } from './CustomerLayout';
import '../styles/profile.css';

function CustomerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('items');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState('');
  const [error, setError] = useState('');
  const customer = JSON.parse(localStorage.getItem('customerUser') || '{}');

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getCustomerOrders(), api.getCustomerServiceRequests()])
      .then(([ordersResponse, servicesResponse]) => {
        if (!isMounted) return;
        setOrders(ordersResponse.orders || []);
        setServices(servicesResponse.requests || []);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Purchase history could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (window.location.hash === '#purchase-history-title') {
      window.setTimeout(() => document.getElementById('purchase-history-title')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
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

  const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || 'Customer';
  const customerEmail = customer.email || customer.username || '';
  const normalizedSearch = historySearch.trim().toLowerCase();
  const visibleOrders = orders.filter((order) => {
    const orderText = `${order._id} ${order.items?.map((item) => item.productName).join(' ') || ''}`.toLowerCase();
    return (historyStatus === 'all' || order.status === historyStatus) && (!normalizedSearch || orderText.includes(normalizedSearch));
  });
  const visibleServices = services.filter((service) => {
    const serviceText = `${service.serviceType} ${service.description}`.toLowerCase();
    return (historyStatus === 'all' || service.status === historyStatus) && (!normalizedSearch || serviceText.includes(normalizedSearch));
  });

  return (
    <CustomerPage title="Profile" description="Manage and protect your account.">
      <div className="profile-account-layout">
        <aside className="profile-account-sidebar" aria-label="Account navigation">
          <div className="profile-account-identity">
            <div className="customer-profile-avatar">{customerName.charAt(0).toUpperCase()}</div>
            <div><strong>{customerName}</strong><span>Edit Profile</span></div>
          </div>
          <div className="profile-account-group">
            <p>My Account</p>
            <button className="active" type="button">Profile</button>
            <button type="button" onClick={() => document.getElementById('purchase-history-title')?.scrollIntoView({ behavior: 'smooth' })}>Purchase History</button>
          </div>
        </aside>

        <div className="profile-account-main">
          <section className="profile-details-card">
            <div className="profile-details-heading">
              <h2>My Profile</h2>
              <p>Manage and protect your account</p>
            </div>
            <div className="profile-details-body">
              <div className="profile-details-fields">
                <div className="profile-detail-row"><span>Username</span><strong>{customer.username || customerEmail || 'Customer'}</strong></div>
                <div className="profile-detail-row"><span>Name</span><input value={customerName} readOnly aria-label="Customer name" /></div>
                <div className="profile-detail-row"><span>Email</span><strong>{customerEmail || 'Not provided'}</strong><button type="button">Change</button></div>
                <div className="profile-detail-row"><span>Phone Number</span><strong>{customer.phoneNumber || 'Not provided'}</strong><button type="button">Change</button></div>
                <div className="profile-detail-row"><span>Account Type</span><strong>Customer</strong></div>
                <button className="profile-save-button" type="button">Save</button>
              </div>
              <div className="profile-photo-panel">
                <div className="profile-photo-placeholder">{customerName.charAt(0).toUpperCase()}</div>
                <button type="button">Select Image</button>
                <small>File size: maximum 1 MB<br />File extension: .JPEG, .PNG</small>
              </div>
            </div>
          </section>

          <section className="purchase-history" aria-labelledby="purchase-history-title">
            <div className="purchase-history-heading">
              <div><p className="customer-eyebrow">ACCOUNT ACTIVITY</p><h2 id="purchase-history-title">Purchase History</h2></div>
              <span>{orders.length + services.length} records</span>
            </div>
            <div className="purchase-history-tabs" role="tablist" aria-label="Purchase history type">
              <button type="button" role="tab" aria-selected={activeTab === 'items'} className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>Items <span>{orders.length}</span></button>
              <button type="button" role="tab" aria-selected={activeTab === 'services'} className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>Services <span>{services.length}</span></button>
            </div>
            <div className="purchase-history-toolbar">
              <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder={activeTab === 'items' ? 'Search by order or item name' : 'Search by service name'} aria-label="Search purchase history" />
              <select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)} aria-label="Filter purchase history by status">
                <option value="all">All status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {error && <p className="customer-error" role="alert">{error}</p>}
            {isLoading ? <p>Loading purchase history...</p> : activeTab === 'items' ? (
              !visibleOrders.length ? <p className="customer-empty">{orders.length ? 'No item orders match your search.' : <>No purchased items yet. <Link to="/customer/shop">Browse the shop</Link></>}</p> : <div className="purchase-history-table-wrap"><div className="purchase-history-table purchase-items-table"><div className="purchase-table-head"><span>ORDER</span><span>ITEMS</span><span>DATE</span><span>STATUS</span><span>TOTAL</span><span>ACTION</span></div>{visibleOrders.map((order) => <article className="purchase-table-row" key={order._id}><div><strong>#{order._id.slice(-6).toUpperCase()}</strong><small>Product order</small></div><div className="purchase-table-items">{order.items?.map((item) => <span key={`${order._id}-${item.productId}`}>{item.productName} × {item.quantity}</span>)}</div><span>{new Date(order.createdAt).toLocaleDateString('en-PH')}</span><span className={`order-status status-${order.status}`}>{order.status}</span><strong className="purchase-table-total">₱{Number(order.totalPrice ?? order.totalAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong><button type="button" className="purchase-table-action" onClick={() => reorder(order)} disabled={reorderingId === order._id}>{reorderingId === order._id ? 'Adding...' : 'Reorder'}</button></article>)}</div></div>
            ) : (
              !visibleServices.length ? <p className="customer-empty">{services.length ? 'No service records match your search.' : <>No services have been availed yet. <Link to="/customer/services">Book a service</Link></>}</p> : <div className="purchase-history-table-wrap"><div className="purchase-history-table purchase-services-table"><div className="purchase-table-head"><span>SERVICE</span><span>DETAILS</span><span>DATE</span><span>STATUS</span><span>PRICE</span></div>{visibleServices.map((service) => <article className="purchase-table-row" key={service._id}><div><strong>{service.serviceType}</strong><small>Service booking</small></div><div className="purchase-table-items">{service.description}</div><span>{new Date(service.createdAt).toLocaleDateString('en-PH')}</span><span className={`order-status status-${service.status}`}>{service.status.replaceAll('-', ' ')}</span><strong className="purchase-table-total">₱{Number(service.estimatedPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></article>)}</div></div>
            )}
          </section>
        </div>
      </div>
    </CustomerPage>
  );
}

export default CustomerProfile;
