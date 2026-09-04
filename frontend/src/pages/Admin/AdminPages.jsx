import { useRef, useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../services/api';
import '../../../Admin/css/inventory.css';
import '../../../Admin/css/transactions.css';
import '../../../Admin/css/mechanics.css';
import '../../../Admin/css/revenue.css';

function AdminDialog({ title, children, onClose }) {
  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="admin-dialog-header">
          <h2 id="admin-dialog-title">{title}</h2>
          <button className="admin-dialog-close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Inventory() {
  const [search, setSearch] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', quantity: '', category: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const loadInventory = () => {
      setIsLoading(true);
      api.getInventory(page, 15)
      .then((response) => {
        if (isMounted) {
          const data = response.data || [];
          setInventoryItems(data.map((item) => ({
            ...item,
            id: item._id,
            rawPrice: item.price,
            price: `₱${Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            stock: item.quantity
          })));
          setTotalPages(response.pagination?.totalPages || 1);
        }
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError.message || 'Failed to load inventory');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    loadInventory();
    const refreshInterval = window.setInterval(loadInventory, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [page, refreshKey]);

  const openItemDialog = (item = null) => {
    setEditingItem(item);
    setIsAdding(!item);
    setForm(item ? { name: item.name, price: item.rawPrice, quantity: item.stock, category: item.category || '' } : { name: '', price: '', quantity: '', category: '' });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
      if (editingItem) await api.updateInventory(editingItem.id, payload);
      else await api.createInventory(payload);
      setEditingItem(null);
      setIsAdding(false);
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save inventory item');
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await api.deleteInventory(item.id);
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete inventory item');
    }
  };

  const filteredItems = inventoryItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="INVENTORY" activePath="/admin/inventory">
      <section className="section-content active">
        <div className="inventory-container">
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          <div className="inventory-header">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search items..." />
            <button className="btn-primary" type="button" onClick={() => openItemDialog()}>+ ADD</button>
          </div>
          <div className="inventory-info">{isLoading ? 'Loading...' : filteredItems.length} inventory items</div>
          <table className="inventory-table">
            <thead><tr><th>ITEM ID</th><th>ITEM</th><th>PRICE</th><th>STOCK</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td><td>{item.name}</td><td className="price-text">{item.price}</td>
                  <td className={item.stock < 10 ? 'stock-text low' : 'stock-text'}>{item.stock}</td>
                  <td><button className="btn-small btn-edit" type="button" onClick={() => openItemDialog(item)}>Edit</button><button className="btn-small btn-delete" type="button" onClick={() => removeItem(item)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-container" aria-label="Inventory pagination">
            <button className={`pagination-button${page === 1 ? ' disabled' : ''}`} type="button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Previous</button>
            <span className="pagination-page">Page {page} of {totalPages}</span>
            <button className={`pagination-button${page >= totalPages ? ' disabled' : ''}`} type="button" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Next</button>
          </div>
        </div>
      </section>
      {(isAdding || editingItem) && <AdminDialog title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'} onClose={() => { setEditingItem(null); setIsAdding(false); }}>
        <form className="admin-dialog-form" onSubmit={saveItem}>
          <label>Item name<input required minLength="3" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Price<input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <label>Quantity<input required min="0" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
          <label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          <div className="admin-dialog-actions"><button className="btn-small" type="button" onClick={() => { setEditingItem(null); setIsAdding(false); }}>Cancel</button><button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Item'}</button></div>
        </form>
      </AdminDialog>}
    </AdminLayout>
  );
}

function Transactions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [statusBeingSaved, setStatusBeingSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const loadTransactions = () => {
      setIsLoading(true);
      api.getTransactions(page, 10, statusFilter === 'All' ? '' : statusFilter)
      .then((response) => {
        if (isMounted) {
          const data = response.data || [];
          const formattedData = data.map((item) => ({
            ...item,
            id: item._id,
            customer: item.userId?.name || 'Unknown',
            date: new Date(item.createdAt).toLocaleDateString('en-PH'),
            items: item.items?.map((i) => i.name).join(', ') || 'N/A',
            amount: `₱${Number(item.totalPrice ?? item.totalAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            status: item.status || 'Pending',
            mechanic: item.mechanic || 'Unassigned'
          }));
          setTransactions(formattedData);
          setTotalAmount(data.reduce((sum, t) => sum + (t.totalPrice ?? t.totalAmount ?? 0), 0));
          setTotalPages(response.pagination?.totalPages || 1);
        }
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError.message || 'Failed to load transactions');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    loadTransactions();
    const refreshInterval = window.setInterval(loadTransactions, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [page, statusFilter, refreshKey]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = `${transaction.customer} ${transaction.items}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const viewTransaction = async (transaction) => {
    try {
      const response = await api.getTransaction(transaction.id);
      setSelectedTransaction(response.data || transaction);
    } catch (detailError) {
      setError(detailError.message || 'Failed to load transaction details');
    }
  };

  const updateTransactionStatus = async (status) => {
    if (!selectedTransaction) return;
    setStatusBeingSaved(true);
    try {
      const response = await api.updateTransaction(selectedTransaction._id || selectedTransaction.id, { status });
      setSelectedTransaction(response.data || { ...selectedTransaction, status });
      setRefreshKey((key) => key + 1);
    } catch (updateError) {
      setError(updateError.message || 'Failed to update transaction status');
    } finally {
      setStatusBeingSaved(false);
    }
  };

  return (
    <AdminLayout title="TRANSACTIONS" activePath="/admin/transactions">
      <section className="section-content active">
        <div className="transactions-container">
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          <div className="transactions-header"><button className="btn-primary" type="button" onClick={() => navigate('/admin/revenue')}>View Revenue</button><div className="transactions-info">Total: ₱{Number(totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div></div>
          <div className="search-filter"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by customer, item, mechanic..." /><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="All">All</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option><option value="Paid">Legacy Paid</option></select></div>
          {isLoading ? <p>Loading transactions...</p> : <table className="transactions-table">
            <thead><tr><th>ITEM ID</th><th>PURCHASE DATE</th><th>CUSTOMER NAME</th><th>ITEMS</th><th>TOTAL AMOUNT</th><th>STATUS</th><th>MECHANIC</th><th>ACTION</th></tr></thead>
            <tbody>{filteredTransactions.map((transaction) => <tr key={transaction.id}><td>{transaction.id}</td><td>{transaction.date}</td><td><strong>{transaction.customer}</strong></td><td>{transaction.items}</td><td className="price-text">{transaction.amount}</td><td><span className={`status-badge status-${transaction.status.toLowerCase()}`}>{transaction.status}</span></td><td>{transaction.mechanic}</td><td><button className="btn-small btn-edit" type="button" onClick={() => viewTransaction(transaction)}>View</button></td></tr>)}</tbody>
          </table>}
          <div className="pagination-container" aria-label="Transaction pagination">
            <button className={`pagination-button${page === 1 ? ' disabled' : ''}`} type="button" disabled={page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Previous</button>
            <span className="pagination-page">Page {page} of {totalPages}</span>
            <button className={`pagination-button${page >= totalPages ? ' disabled' : ''}`} type="button" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Next</button>
          </div>
        </div>
      </section>
      {selectedTransaction && <AdminDialog title="Transaction Details" onClose={() => setSelectedTransaction(null)}>
        <div className="transaction-details">
          <p><strong>Order ID:</strong> {selectedTransaction._id || selectedTransaction.id}</p>
          <p><strong>Date:</strong> {new Date(selectedTransaction.createdAt).toLocaleString('en-PH')}</p>
          <p><strong>Customer:</strong> {selectedTransaction.userId?.name || selectedTransaction.customer || 'Unknown'}</p>
          <label><strong>Status:</strong><select value={selectedTransaction.status || 'pending'} disabled={statusBeingSaved} onChange={(event) => updateTransactionStatus(event.target.value)}><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option><option value="Paid">Legacy Paid</option></select></label>
          <p><strong>Total:</strong> ₱{Number(selectedTransaction.totalPrice ?? selectedTransaction.totalAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          <p><strong>Items:</strong> {selectedTransaction.items?.map((item) => item.name || item.productId?.name || 'Item').join(', ') || selectedTransaction.items || 'N/A'}</p>
        </div>
      </AdminDialog>}
    </AdminLayout>
  );
}

function Mechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [totalMechanics, setTotalMechanics] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', specialization: 'general', yearsOfExperience: '' });

  useEffect(() => {
    let isMounted = true;
    api.getMechanics()
      .then((response) => {
        if (isMounted) {
          const data = response.mechanics || response.data || [];
          setMechanics(data);
          setTotalMechanics(data.length);
          setTotalJobs(data.reduce((sum, mechanic) => sum + (mechanic.totalRepairs || 0), 0));
          setCompletedJobs(data.filter((mechanic) => mechanic.isActive).length);
        }
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError.message || 'Failed to load mechanics');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const openMechanicDialog = (mechanic = null) => {
    setEditingMechanic(mechanic);
    setIsAdding(!mechanic);
    setForm(mechanic ? { firstName: mechanic.firstName || '', lastName: mechanic.lastName || '', email: mechanic.email || '', password: '', phoneNumber: '', specialization: mechanic.specialization || 'general', yearsOfExperience: mechanic.yearsOfExperience || 0 } : { firstName: '', lastName: '', email: '', password: '', phoneNumber: '', specialization: 'general', yearsOfExperience: '' });
  };

  const saveMechanic = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = { ...form, yearsOfExperience: Number(form.yearsOfExperience) };
      if (editingMechanic) {
        if (!payload.password) delete payload.password;
        delete payload.email;
        await api.updateMechanic(editingMechanic.id, payload);
      } else {
        await api.createMechanic(payload);
      }
      setEditingMechanic(null);
      setIsAdding(false);
      setRefreshKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save mechanic');
    } finally {
      setIsSaving(false);
    }
  };

  const removeMechanic = async (mechanic) => {
    if (!window.confirm(`Delete ${mechanic.firstName} ${mechanic.lastName}?`)) return;
    try {
      await api.deleteMechanic(mechanic.id);
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete mechanic');
    }
  };

  const getMechanicInitial = (name) => (name || 'U').charAt(0).toUpperCase();
  const getMechanicAvatarColor = (index) => ['orange', 'blue', 'green', 'purple'][index % 4];

  const getAvailabilityStatus = (status) => {
    const statuses = { available: 'Available', busy: 'Busy', 'on-leave': 'On leave' };
    return statuses[status] || status;
  };

  return (
    <AdminLayout title="MECHANICS" activePath="/admin/mechanics">
      <section className="section-content active">
        <div className="mechanics-container">
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          <div className="mechanics-header"><h2>MECHANICS</h2><button className="btn-primary" type="button" onClick={() => openMechanicDialog()}>+ Add Mechanic</button></div>
          <div className="mechanics-stats">
            <div className="stat-box"><div className="stat-number">{isLoading ? '...' : totalMechanics}</div><div className="stat-label">Total Mechanics</div></div>
            <div className="stat-box"><div className="stat-number">{isLoading ? '...' : totalJobs}</div><div className="stat-label">Total Repairs</div></div>
            <div className="stat-box"><div className="stat-number">{isLoading ? '...' : completedJobs}</div><div className="stat-label">Active Mechanics</div></div>
            <div className="stat-box"><div className="stat-number">₱0</div><div className="stat-label">Total Labor Today</div></div>
          </div>
          {mechanics.map((mechanic, index) => (
            <div key={mechanic.id} className="mechanic-card">
              <div className="mechanic-header-row">
                <div className="mechanic-info">
                  <div className={`mechanic-avatar ${getMechanicAvatarColor(index)}`}>{getMechanicInitial(mechanic.firstName)}</div>
                  <div><div className="mechanic-name">{`${mechanic.firstName || ''} ${mechanic.lastName || ''}`.trim() || 'Unknown'}</div><div className="mechanic-specialty">{mechanic.specialization || 'General Service'}</div><div className="mechanic-email">{mechanic.email || 'N/A'}</div></div>
                </div>
                <div className="mechanic-actions"><button className="btn-small btn-edit" type="button" onClick={() => openMechanicDialog(mechanic)}>Edit</button><button className="btn-small btn-delete" type="button" onClick={() => removeMechanic(mechanic)}>Delete</button></div>
              </div>
              <div className="mechanic-stats">
                <div className="mechanic-stat"><div className="mechanic-stat-number">{mechanic.totalRepairs || 0}</div><div className="mechanic-stat-label">Total Repairs</div></div>
                <div className="mechanic-stat"><div className="mechanic-stat-number">{mechanic.averageRating || 0}</div><div className="mechanic-stat-label">Average Rating</div></div>
                <div className="mechanic-stat"><div className="mechanic-stat-number">{getAvailabilityStatus(mechanic.availabilityStatus)}</div><div className="mechanic-stat-label">Status</div></div>
                <div className="mechanic-stat"><div className="mechanic-stat-number">{mechanic.yearsOfExperience || 0}</div><div className="mechanic-stat-label">Years Experience</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {(isAdding || editingMechanic) && <AdminDialog title={editingMechanic ? 'Edit Mechanic' : 'Add Mechanic'} onClose={() => { setEditingMechanic(null); setIsAdding(false); }}>
        <form className="admin-dialog-form" onSubmit={saveMechanic}>
          <div className="admin-dialog-fields"><label>First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label><label>Last name<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label></div>
          {!editingMechanic && <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>}
          <label>{editingMechanic ? 'New password (optional)' : 'Password'}<input required={!editingMechanic} minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label>Phone number<input required={!editingMechanic} value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} /></label>
          <div className="admin-dialog-fields"><label>Specialization<select value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })}><option value="general">General</option><option value="engine">Engine</option><option value="transmission">Transmission</option><option value="electrical">Electrical</option><option value="suspension">Suspension</option><option value="brakes">Brakes</option></select></label><label>Years of experience<input required min="0" type="number" value={form.yearsOfExperience} onChange={(event) => setForm({ ...form, yearsOfExperience: event.target.value })} /></label></div>
          <div className="admin-dialog-actions"><button className="btn-small" type="button" onClick={() => { setEditingMechanic(null); setIsAdding(false); }}>Cancel</button><button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Mechanic'}</button></div>
        </form>
      </AdminDialog>}
    </AdminLayout>
  );
}

function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const loadRequests = () => Promise.all([api.getAdminServiceRequests(), api.getMechanics()])
    .then(([requestResponse, mechanicResponse]) => {
      setRequests(requestResponse.requests || []);
      setMechanics((mechanicResponse.mechanics || mechanicResponse.data || []).filter((mechanic) => mechanic.isActive !== false));
    });

  useEffect(() => {
    loadRequests().catch((loadError) => setError(loadError.message || 'Failed to load service requests')).finally(() => setIsLoading(false));
  }, []);

  const confirmAssignment = async (requestId, mechanicId) => {
    setSavingId(requestId);
    setError('');
    try {
      await api.confirmServiceRequest(requestId, mechanicId);
      await loadRequests();
    } catch (saveError) {
      setError(saveError.message || 'Failed to confirm assignment');
    } finally {
      setSavingId('');
    }
  };

  return <AdminLayout title="SERVICE REQUESTS" activePath="/admin/service-requests"><section className="section-content active"><div className="mechanics-container">{error && <p className="dashboard-error" role="alert">{error}</p>}<div className="mechanics-header"><h2>SERVICE REQUESTS</h2></div>{isLoading ? <p>Loading service requests...</p> : !requests.length ? <p>No service requests found.</p> : requests.map((request) => <article className="mechanic-card" key={request._id}><div className="mechanic-header-row"><div><div className="mechanic-name">{request.serviceType.replaceAll('-', ' ')}</div><div className="mechanic-email">{request.user ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() : 'Customer'}</div><p>{request.description}</p></div><span className={`status-badge status-${request.status}`}>{request.status.replaceAll('-', ' ')}</span></div><div className="mechanic-actions"><select defaultValue={request.mechanic?._id || request.mechanic || ''} disabled={savingId === request._id} onChange={(event) => confirmAssignment(request._id, event.target.value)}><option value="">Select mechanic</option>{mechanics.map((mechanic) => <option key={mechanic.id || mechanic._id} value={mechanic.id || mechanic._id}>{mechanic.firstName} {mechanic.lastName}</option>)}</select></div></article>)}</div></section></AdminLayout>;
}

function RevenueChart({ type, data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const chart = new Chart(canvasRef.current, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });

    return () => chart.destroy();
  }, [type, data]);

  return <canvas ref={canvasRef} role="img" aria-label={`${data.datasets[0].label} chart`} />;
}

function Revenue() {
  const [stats, setStats] = useState({ totalRevenue: 0 });
  const [quarterlyData, setQuarterlyData] = useState({
    labels: [],
    datasets: [{ label: 'Revenue', data: [], borderColor: '#ff6b35', backgroundColor: 'rgba(255, 107, 53, 0.15)', borderWidth: 3, tension: 0.3, fill: true }]
  });
  const [dailyData, setDailyData] = useState({
    labels: [],
    datasets: [{ label: 'Revenue', data: [], backgroundColor: '#4a90e2' }]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRevenue = () => {
      setIsLoading(true);
      Promise.all([api.getDashboardStats(), api.getQuarterlySales(), api.getDailySales()])
      .then(([statsResponse, quarterlyResponse, dailyResponse]) => {
        if (!isMounted) return;

        const quarterlyResult = quarterlyResponse.data || [];
        const dailyResult = dailyResponse.data || [];
        setStats(statsResponse.data || { totalRevenue: 0 });
        setQuarterlyData((currentData) => ({
          ...currentData,
          labels: quarterlyResult.map((item) => `Q${item._id.quarter} ${item._id.year}`),
          datasets: [{ ...currentData.datasets[0], data: quarterlyResult.map((item) => item.revenue || 0) }]
        }));
        setDailyData((currentData) => ({
          ...currentData,
          labels: dailyResult.map((item) => item._id),
          datasets: [{ ...currentData.datasets[0], data: dailyResult.map((item) => item.revenue || 0) }]
        }));
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Revenue data could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    loadRevenue();
    const refreshInterval = window.setInterval(loadRevenue, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  return (
    <AdminLayout title="REVENUE" activePath="/admin/revenue">
      <section className="section-content active">
        <div className="analytics-grid">
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          <div className="stat-card">
            <div className="stat-header"><h3>TOTAL REVENUE</h3><div className="stat-indicator orange"></div></div>
            <div className="stat-value">₱{Number(stats.totalRevenue).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div className="stat-subtitle">{isLoading ? 'Loading...' : 'From confirmed orders'}</div>
          </div>
          <div className="risk-card">
            <div className="risk-header"><h3>TRANSACTIONS</h3></div>
            <div className="risk-indicator">{isLoading ? '...' : Number(stats.totalTransactions || 0).toLocaleString()}</div>
            <div className="risk-description">Confirmed orders contributing to revenue</div>
          </div>
          <div className="ai-card">
            <div className="ai-header">
              <h3>Ask AI for Revenue Insights</h3>
              <button className="btn-clear" type="button" onClick={() => setAiQuestion('')}>Clear</button>
            </div>
            <p className="ai-intro">Hello! I&apos;m your AI revenue analyst. Ask me about your revenue trends, risk levels, or category performance.</p>
            <div className="ai-input-row">
              <input className="ai-input" value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Ask about revenue..." aria-label="Ask about revenue" />
              <button className="btn-send" type="button" aria-label="Send revenue question">Send</button>
            </div>
          </div>
          <div className="revenue-charts">
            <div className="chart-card full-width">
              <h3>QUARTERLY REVENUE</h3>
              <div className="chart-canvas"><RevenueChart type="line" data={quarterlyData} /></div>
            </div>
            <div className="chart-card full-width">
              <h3>DAILY REVENUE</h3>
              <div className="chart-canvas"><RevenueChart type="bar" data={dailyData} /></div>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

export { Inventory, Transactions, Mechanics, ServiceRequests, Revenue };
