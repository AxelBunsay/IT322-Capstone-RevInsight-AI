const token = localStorage.getItem('customerToken');
const formatCurrency = (value) => '₱' + Number(value || 0).toLocaleString('en-PH');

/* ===== TOAST NOTIFICATIONS ===== */
const showToast = (message, type = 'success', duration = 3000) => {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.success}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/* ===== SKELETON LOADERS ===== */
const showOrderSkeleton = (count = 2) => {
  const html = Array(count).fill(0).map(() => `
    <article class="order-card" style="opacity: 0.6;">
      <div class="order-header" style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; height: 16px; border-radius: 4px; margin-bottom: 12px;"></div>
      <div class="order-body">
        <div style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; height: 12px; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; height: 12px; border-radius: 4px; width: 60%;"></div>
      </div>
    </article>
  `).join('');
  return html;
};

/* ===== EMPTY STATE ===== */
const showOrderEmptyState = (container) => {
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1/-1; padding: 40px 20px;">
      <div class="empty-state-icon">📦</div>
      <h3>No Orders Yet</h3>
      <p>Start shopping and track your orders here.</p>
      <a href="/Customer/userShop.html" class="empty-state-btn">Browse Products</a>
    </div>
  `;
};

const showServiceEmptyState = (container) => {
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1/-1; padding: 40px 20px;">
      <div class="empty-state-icon">🔧</div>
      <h3>No Service Requests Yet</h3>
      <p>Schedule a service appointment to get started.</p>
      <a href="/Customer/services.html" class="empty-state-btn">View Services</a>
    </div>
  `;
};

const buildOrderCard = (order) => `
  <article class="order-card">
    <div class="order-header">
      <strong>Order #${order._id.slice(-6).toUpperCase()}</strong>
      <span>${new Date(order.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="order-body">
      <p>Status: <strong style="color: ${order.status === 'completed' ? '#2ecc71' : order.status === 'pending' ? '#ffa500' : '#3498db'}">${order.status}</strong></p>
      <p>Total: <strong>${formatCurrency(order.totalPrice)}</strong></p>
      <ul>
        ${(order.items || []).map((item) => `<li>${item.productName} × ${item.quantity}</li>`).join('')}
      </ul>
      <button class="reorder-btn" onclick="reorderOrder('${order._id}')">🛒 Reorder</button>
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
      <p>Status: <strong style="color: ${request.status === 'completed' ? '#2ecc71' : request.status === 'scheduled' ? '#3498db' : '#ffa500'}">${request.status}</strong></p>
      <p>${request.description}</p>
    </div>
  </article>
`;

const loadOrders = async () => {
  if (!token) {
    window.location.href = '/Customer/userLogin.html';
    return;
  }

  const ordersContainer = document.getElementById('ordersContainer');
  const servicesContainer = document.getElementById('serviceRequestsContainer');

  if (ordersContainer) ordersContainer.innerHTML = showOrderSkeleton(2);
  if (servicesContainer) servicesContainer.innerHTML = showOrderSkeleton(2);

  try {
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

    if (ordersContainer) {
      if ((ordersData.orders || []).length > 0) {
        ordersContainer.innerHTML = (ordersData.orders || []).map(buildOrderCard).join('');
        showToast('Orders loaded successfully', 'success');
      } else {
        showOrderEmptyState(ordersContainer);
      }
    }

    if (servicesContainer) {
      if ((servicesData.requests || []).length > 0) {
        servicesContainer.innerHTML = (servicesData.requests || []).map(buildServiceCard).join('');
      } else {
        showServiceEmptyState(servicesContainer);
      }
    }
  } catch (error) {
    console.error('Failed to load orders:', error);
    showToast('Failed to load orders', 'error');
    if (ordersContainer) showOrderEmptyState(ordersContainer);
    if (servicesContainer) showServiceEmptyState(servicesContainer);
  }
};

const reorderOrder = async (orderId) => {
  if (!token) {
    window.location.href = '/Customer/userLogin.html';
    return;
  }

  try {
    const response = await fetch(`/api/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to reorder this order', 'error');
      return;
    }

    let message = 'Items added to your cart!';
    if (data.warnings && data.warnings.length) {
      message += ' ' + data.warnings.join(' ');
      showToast(message, 'warning', 5000);
    } else {
      showToast(message, 'success');
    }
  } catch (error) {
    console.error('Reorder error:', error);
    showToast('An error occurred while reordering', 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
});
