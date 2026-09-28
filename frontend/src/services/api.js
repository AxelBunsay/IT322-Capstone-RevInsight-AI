const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function request(path, options = {}) {
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

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers });
  } catch (error) {
    throw new Error(`Unable to reach the backend at ${API_URL}. Start the backend server and check its database connection.`, { cause: error });
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(options.tokenKey || 'adminToken');
      if (options.tokenKey === undefined) {
        window.dispatchEvent(new Event('admin-auth-expired'));
      }
    }

    const message = typeof body === 'string' ? body : body?.message;
    const requestError = new Error(message || `Request failed with status ${response.status}`);
    requestError.status = response.status;
    throw requestError;
  }

  return body;
}

export const api = {
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
  getProducts: (page = 1, limit = 10) => request(`/api/products?page=${page}&limit=${limit}`, { tokenKey: 'customerToken' }),
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
  getMechanicProfile: () => request('/api/mechanics/profile', { tokenKey: 'mechanicToken' })
  ,updateMechanicProfile: (profile) => request('/api/mechanics/profile', { method: 'PUT', body: JSON.stringify(profile), tokenKey: 'mechanicToken' })
  ,getMechanicJobs: () => request('/api/service-requests/mechanic', { tokenKey: 'mechanicToken' })
  ,acceptMechanicJob: (requestId, startTime) => request('/api/service-requests/accept', { method: 'PUT', body: JSON.stringify({ requestId, startTime }), tokenKey: 'mechanicToken' })
  ,updateMechanicJobStatus: (requestId, status) => request('/api/service-requests/status', { method: 'PUT', body: JSON.stringify({ requestId, status }), tokenKey: 'mechanicToken' })
};
