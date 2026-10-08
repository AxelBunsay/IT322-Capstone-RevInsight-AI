import dashboardMock from '../data/dashboardMock.json';
import { request } from '../../services/api';

const confirmedStatuses = new Set(['completed', 'paid']);
const useDemoData = import.meta.env.DEV && import.meta.env.VITE_ADMIN_USE_MOCKS !== 'false';

function unwrapRows(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

async function getAllPages(fetchPage) {
  const firstPage = await fetchPage(1, 100);
  const rows = unwrapRows(firstPage);
  const totalPages = Number(firstPage?.pagination?.totalPages || 1);
  if (totalPages <= 1) return rows;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2, 100))
  );
  return rows.concat(...remainingPages.map(unwrapRows));
}

function isConfirmed(order) {
  return confirmedStatuses.has(String(order.status || '').toLowerCase());
}

function getOrderRevenue(order) {
  return Number(order.totalPrice ?? order.totalAmount ?? 0);
}

function getUnitsSold(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function valueInWindow(orders, valueOf, start, end) {
  return orders.reduce((sum, order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= start && createdAt < end ? sum + valueOf(order) : sum;
  }, 0);
}

function getChange(orders, valueOf, durationDays = 30) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - durationDays);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - durationDays);
  return percentChange(
    valueInWindow(orders, valueOf, currentStart, now),
    valueInWindow(orders, valueOf, previousStart, currentStart)
  );
}

function makeSeries(orders, period) {
  const now = new Date();
  const buckets = [];

  if (period === 'daily') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date(today);
      start.setDate(today.getDate() - offset);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      buckets.push({ start, end, label: start.toLocaleDateString('en-PH', { weekday: 'short' }) });
    }
  } else if (period === 'weekly') {
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7));
    for (let offset = 7; offset >= 0; offset -= 1) {
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - offset * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      buckets.push({ start, end, label: start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) });
    }
  } else {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let offset = 11; offset >= 0; offset -= 1) {
      const start = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - offset, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({ start, end, label: start.toLocaleDateString('en-PH', { month: 'short' }) });
    }
  }

  return buckets.map(({ start, end, label }) => ({
    label,
    value: orders.reduce((sum, order) => {
      const createdAt = new Date(order.createdAt);
      return isConfirmed(order) && createdAt >= start && createdAt < end ? sum + getOrderRevenue(order) : sum;
    }, 0)
  }));
}

async function getOrders() {
  return getAllPages((page, limit) => request(`/api/dashboard/transactions?page=${page}&limit=${limit}`));
}

async function getInventoryItems() {
  return getAllPages((page, limit) => request(`/api/dashboard/inventory?page=${page}&limit=${limit}`));
}

function makeDashboardData(stats, orders, inventory) {
  const confirmedOrders = orders.filter(isConfirmed);
  const categoryTotals = new Map();
  confirmedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const name = item.category || item.productName || 'Other';
      categoryTotals.set(name, (categoryTotals.get(name) || 0) + Number(item.price || 0) * Number(item.quantity || 0));
    });
  });

  const inventoryHealth = inventory.reduce((health, item) => {
    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) health.out += 1;
    else if (quantity <= 10) {
      health.low += 1;
      health.lowItems.push({ id: item._id, name: item.name, quantity });
    } else health.inStock += 1;
    return health;
  }, { inStock: 0, low: 0, out: 0, lowItems: [] });

  const itemCount = Number(stats.totalInventoryItems ?? inventory.length);
  const sortedCategories = [...categoryTotals.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((left, right) => right.revenue - left.revenue);

  return {
    stats: {
      itemsSold: {
        value: confirmedOrders.reduce((sum, order) => sum + getUnitsSold(order), 0),
        change: getChange(confirmedOrders, getUnitsSold),
        sparkline: []
      },
      totalTransactions: {
        value: Number(stats.totalTransactions ?? confirmedOrders.length),
        change: getChange(confirmedOrders, () => 1),
        sparkline: []
      },
      inventoryItems: { value: itemCount, change: 0, sparkline: [] },
      revenue: {
        value: Number(stats.totalRevenue ?? confirmedOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0)),
        change: getChange(confirmedOrders, getOrderRevenue),
        sparkline: []
      }
    },
    badges: {
      pendingTransactions: orders.filter((order) => String(order.status).toLowerCase() === 'pending').length,
      lowStock: inventoryHealth.low
    },
    categories: sortedCategories,
    inventoryHealth
  };
}

export const adminApi = {
  loginAdmin: (credentials) => request('/api/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getDashboardStats: () => request('/api/dashboard/dashboard'),
  getDailySales: () => request('/api/dashboard/dashboard/daily'),
  getQuarterlySales: () => request('/api/dashboard/dashboard/quarterly'),
  getRevenueConcentration: () => request('/api/dashboard/analytics/revenue-concentration'),
  getRevenueRisk: () => request('/api/dashboard/analytics/revenue-risk'),
  getDashboardData: async () => {
    if (useDemoData) return dashboardMock;
    const [statsResponse, orders, inventory] = await Promise.all([adminApi.getDashboardStats(), getOrders(), getInventoryItems()]);
    return makeDashboardData(statsResponse.data || {}, orders, inventory);
  },
  getSalesSeries: async (period) => {
    if (useDemoData) return dashboardMock.salesSeries[period] || [];
    return makeSeries(await getOrders(), period);
  },
  getInventory: (page = 1, limit = 15) => request(`/api/dashboard/inventory?page=${page}&limit=${limit}`),
  createInventory: (item) => request('/api/dashboard/inventory', { method: 'POST', body: JSON.stringify(item) }),
  updateInventory: (id, item) => request(`/api/dashboard/inventory/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteInventory: (id) => request(`/api/dashboard/inventory/${id}`, { method: 'DELETE' }),
  getBusinessRecords: (query = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/dashboard/business-records${suffix}`);
  },
  getTransactions: (page = 1, limit = 10, status = '') => request(`/api/dashboard/transactions?page=${page}&limit=${limit}${status ? `&status=${encodeURIComponent(status)}` : ''}`),
  getTransaction: (id) => request(`/api/dashboard/transactions/${id}`),
  updateTransaction: (id, transaction) => request(`/api/dashboard/transactions/${id}`, { method: 'PUT', body: JSON.stringify(transaction) }),
  getMechanics: () => request('/api/mechanics/all'),
  createMechanic: (mechanic) => request('/api/mechanics/create', { method: 'POST', body: JSON.stringify(mechanic) }),
  updateMechanic: (id, mechanic) => request(`/api/mechanics/${id}`, { method: 'PUT', body: JSON.stringify(mechanic) }),
  deleteMechanic: (id) => request(`/api/mechanics/${id}`, { method: 'DELETE' }),
  getAdminServiceRequests: () => request('/api/service-requests'),
  getServiceLaborRates: () => request('/api/service-requests/labor-rates'),
  updateServiceLaborRate: (id, laborFee) => request(`/api/service-requests/labor-rates/${id}`, { method: 'PUT', body: JSON.stringify({ laborFee }) }),
  updateServiceRequestLaborFee: (requestId, laborFee) => request('/api/service-requests/labor-fee', { method: 'PUT', body: JSON.stringify({ requestId, laborFee }) }),
  confirmServiceRequest: (requestId, mechanicId) => request('/api/service-requests/assign', { method: 'PUT', body: JSON.stringify({ requestId, mechanicId }) }),
  updateAdminServiceRequestStatus: (requestId, status) => request('/api/service-requests/status/admin', { method: 'PUT', body: JSON.stringify({ requestId, status }) })
};
