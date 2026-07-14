const token = localStorage.getItem('customerToken');
const formatCurrency = (value) => '₱' + Number(value || 0).toLocaleString('en-PH');

const buildOrderCard = (order) => `
  <article class="order-card">
    <div class="order-header">
      <strong>Order #${order._id.slice(-6).toUpperCase()}</strong>
      <span>${new Date(order.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="order-body">
      <p>Status: <strong>${order.status}</strong></p>
      <p>Total: <strong>${formatCurrency(order.totalPrice)}</strong></p>
      <ul>
        ${(order.items || []).map((item) => `<li>${item.productName} × ${item.quantity}</li>`).join('')}
      </ul>
    </div>
  </article>
`;

const buildServiceCard = (request) => `
  <article class="order-card">
    <div class="order-header">
      <strong>${request.serviceType}</strong>
      <span>${new Date(request.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="order-body">
      <p>Status: <strong>${request.status}</strong></p>
      <p>${request.description}</p>
    </div>
  </article>
`;

const loadOrders = async () => {
  if (!token) {
    window.location.href = '/Customer/userLogin.html';
    return;
  }

  const [ordersRes, servicesRes] = await Promise.all([
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
    fetch('/api/service-requests/my', { headers: { Authorization: `Bearer ${token}` } })
  ]);

  const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
  const servicesData = servicesRes.ok ? await servicesRes.json() : { requests: [] };

  const summary = document.getElementById('orderSummary');
  if (summary) {
    const totalOrders = ordersData.orders?.length || 0;
    const totalServices = servicesData.requests?.length || 0;
    summary.innerHTML = `
      <div class="order-summary-card">
        <h3>Summary</h3>
        <p>Product Orders: <strong>${totalOrders}</strong></p>
        <p>Service Requests: <strong>${totalServices}</strong></p>
      </div>
    `;
  }

  const ordersContainer = document.getElementById('ordersContainer');
  if (ordersContainer) {
    ordersContainer.innerHTML = (ordersData.orders || []).length > 0
      ? (ordersData.orders || []).map(buildOrderCard).join('')
      : '<p>No product orders yet.</p>';
  }

  const servicesContainer = document.getElementById('serviceRequestsContainer');
  if (servicesContainer) {
    servicesContainer.innerHTML = (servicesData.requests || []).length > 0
      ? (servicesData.requests || []).map(buildServiceCard).join('')
      : '<p>No service requests yet.</p>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
});
