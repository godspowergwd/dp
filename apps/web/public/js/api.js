/**
 * API Client for Private Dropshipping OS
 * Connects directly to the Fastify backend at /api/v1
 */

const API_BASE = 'http://localhost:4000/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const options = { method, headers };
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed: ${response.status}`);
    }
    return data;
  }

  // Auth
  login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
  register(data) { return this.request('POST', '/auth/register', data); }
  getMe() { return this.request('GET', '/auth/me'); }

  // Products
  getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/products${qs ? '?' + qs : ''}`);
  }
  getProduct(id) { return this.request('GET', `/products/${id}`); }
  createProduct(data) { return this.request('POST', '/products', data); }
  updateProduct(id, data) { return this.request('PATCH', `/products/${id}`, data); }
  updateProductStatus(id, status) { return this.request('PATCH', `/products/${id}/status`, { status }); }
  deleteProduct(id) { return this.request('DELETE', `/products/${id}`); }

  // Research
  getResearch() { return this.request('GET', '/research'); }

  // Suppliers
  getSuppliers() { return this.request('GET', '/suppliers'); }

  // Stores
  getStores() { return this.request('GET', '/stores'); }

  // Orders
  getOrders() { return this.request('GET', '/orders'); }

  // AI
  getAiJobs() { return this.request('GET', '/ai'); }

  // Marketing
  getMarketing() { return this.request('GET', '/marketing'); }

  // Analytics
  getAnalytics() { return this.request('GET', '/analytics'); }

  // Integrations
  getIntegrations() { return this.request('GET', '/integrations'); }

  // Audit
  getAuditLogs() { return this.request('GET', '/audit'); }
}

window.api = new ApiClient();
