const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const token = localStorage.getItem(options.tokenKey || 'adminToken');
  const requestOptions = { ...options };
  delete requestOptions.tokenKey;
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(body?.message || `Request failed with status ${response.status}`);
  }

  return body;
}

export const api = {
  loginAdmin: (credentials) => request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  loginCustomer: (credentials) => request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  loginMechanic: (credentials) => request('/api/mechanics/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  registerCustomer: (userData) => request('/api/users/register-request', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  verifyOtp: (email, otp) => request('/api/users/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  }),
  resendOtp: (email) => request('/api/users/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  getProducts: () => request('/api/products', { tokenKey: 'customerToken' }),
  getCart: () => request('/api/cart', { tokenKey: 'customerToken' }),
  addToCart: (productId, quantity = 1) => request('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }), tokenKey: 'customerToken' }),
  updateCart: (productId, quantity) => request(`/api/cart/update/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }), tokenKey: 'customerToken' }),
  removeFromCart: (productId) => request(`/api/cart/remove/${productId}`, { method: 'DELETE', tokenKey: 'customerToken' }),
  clearCart: () => request('/api/cart/clear', { method: 'DELETE', tokenKey: 'customerToken' }),
  checkout: () => request('/api/orders/checkout', { method: 'POST', tokenKey: 'customerToken' }),
  createPaymentIntent: () => request('/api/payments/create-payment-intent', { method: 'POST', tokenKey: 'customerToken' }),
  confirmPayment: (paymentIntentId) => request('/api/payments/confirm-payment', { method: 'POST', body: JSON.stringify({ paymentIntentId }), tokenKey: 'customerToken' }),
  getCustomerOrders: () => request('/api/orders', { tokenKey: 'customerToken' }),
  reorder: (orderId) => request(`/api/orders/${orderId}/reorder`, { method: 'POST', tokenKey: 'customerToken' }),
  createServiceRequest: (serviceRequest) => request('/api/service-requests', { method: 'POST', body: JSON.stringify(serviceRequest), tokenKey: 'customerToken' }),
  getCustomerServiceRequests: () => request('/api/service-requests/my', { tokenKey: 'customerToken' }),
  getAvailableMechanics: () => request('/api/mechanics/available', { tokenKey: 'customerToken' }),
  getAdminServiceRequests: () => request('/api/service-requests'),
  confirmServiceRequest: (requestId, mechanicId) => request('/api/service-requests/assign', { method: 'PUT', body: JSON.stringify({ requestId, mechanicId }) }),
  getDashboardStats: () => request('/api/dashboard/dashboard'),
  getQuarterlySales: () => request('/api/dashboard/dashboard/quarterly'),
  getDailySales: () => request('/api/dashboard/dashboard/daily'),
  getInventory: (page = 1, limit = 15) => request(`/api/dashboard/inventory?page=${page}&limit=${limit}`),
  createInventory: (item) => request('/api/dashboard/inventory', { method: 'POST', body: JSON.stringify(item) }),
  updateInventory: (id, item) => request(`/api/dashboard/inventory/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteInventory: (id) => request(`/api/dashboard/inventory/${id}`, { method: 'DELETE' }),
  getTransactions: (page = 1, limit = 10, status = '') => request(`/api/dashboard/transactions?page=${page}&limit=${limit}${status ? `&status=${encodeURIComponent(status)}` : ''}`),
  getTransaction: (id) => request(`/api/dashboard/transactions/${id}`),
  updateTransaction: (id, transaction) => request(`/api/dashboard/transactions/${id}`, { method: 'PUT', body: JSON.stringify(transaction) }),
  getMechanics: () => request('/api/mechanics/all'),
  createMechanic: (mechanic) => request('/api/mechanics/create', { method: 'POST', body: JSON.stringify(mechanic) }),
  updateMechanic: (id, mechanic) => request(`/api/mechanics/${id}`, { method: 'PUT', body: JSON.stringify(mechanic) }),
  deleteMechanic: (id) => request(`/api/mechanics/${id}`, { method: 'DELETE' })
  ,getMechanicProfile: () => request('/api/mechanics/profile', { tokenKey: 'mechanicToken' })
  ,updateMechanicProfile: (profile) => request('/api/mechanics/profile', { method: 'PUT', body: JSON.stringify(profile), tokenKey: 'mechanicToken' })
  ,getMechanicJobs: () => request('/api/service-requests/mechanic', { tokenKey: 'mechanicToken' })
  ,acceptMechanicJob: (requestId, startTime) => request('/api/service-requests/accept', { method: 'PUT', body: JSON.stringify({ requestId, startTime }), tokenKey: 'mechanicToken' })
  ,updateMechanicJobStatus: (requestId, status) => request('/api/service-requests/status', { method: 'PUT', body: JSON.stringify({ requestId, status }), tokenKey: 'mechanicToken' })
};
