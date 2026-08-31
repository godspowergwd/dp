/**
 * PromoDesk — API client (server-side integrations stay on the backend)
 */

// Same-origin by default; override via window config or query-free deployment
const API_BASE = (window.PROMODESK_CONFIG && window.PROMODESK_CONFIG.apiBase) || '/api/v1';

/** Map internal responses to friendly, product-appropriate messages. */
function friendlyError(status, payload) {
  const raw = (payload && (payload.message || payload.error)) || '';
  const isTechnical = /prisma|constraint|invalid input|column|table|undefined|null|\[object|object html|stack trace| at |error: |sql/i.test(raw);
  if (raw && !isTechnical && raw.length < 160) return raw;

  const fallback = {
    400: 'Please review the information you entered and try again.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You don\'t have permission to perform this action.',
    404: 'We couldn\'t find what you were looking for.',
    409: 'This has already been saved. Refresh the page to see the latest changes.',
    415: 'We couldn\'t process your request. Please try again.',
    422: 'Please review the information you entered and try again.',
    429: 'You\'ve made too many requests. Please wait a moment and try again.',
  };
  if (fallback[status]) return fallback[status];
  if (status >= 500) return 'We\'re experiencing a temporary issue. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
}

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

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, options);
    } catch {
      throw new Error('We couldn\'t reach PromoDesk. Please check your connection and try again.');
    }

    let data = null;
    try { data = await response.json(); } catch { /* no body */ }

    if (!response.ok) {
      throw new Error(friendlyError(response.status, data));
    }
    return data;
  }

  // Auth
  login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
  register(data) { return this.request('POST', '/auth/register', data); }
  getMe() { return this.request('GET', '/auth/me'); }
  updateProfile(data) { return this.request('PATCH', '/auth/me', data); }

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

  // ==================== Affiliate Marketplace ====================
  getAffiliateProducts(params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    return this.request('GET', `/affiliate/products${qs ? '?' + qs : ''}`);
  }
  getAffiliateProduct(id) { return this.request('GET', `/affiliate/products/${id}`); }
  getAffiliateProviders() { return this.request('GET', '/affiliate/providers'); }
  getAffiliateCategories() { return this.request('GET', '/affiliate/products/categories'); }
  syncAffiliate(provider = '') { return this.request('POST', '/affiliate/sync', provider ? { provider } : {}); }

  // ==================== Promotions ====================
  createPromotion(productId) { return this.request('POST', '/promotions', { productId }); }
  getPromotions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/promotions${qs ? '?' + qs : ''}`);
  }
  getPromotion(id) { return this.request('GET', `/promotions/${id}`); }
  generatePromotionContent(id, options = {}) { return this.request('POST', `/promotions/${id}/content`, options); }
  publishPromotion(id, socialAccountId) { return this.request('POST', `/promotions/${id}/publish`, { socialAccountId }); }
  simulatePromotionSale(id) { return this.request('POST', `/promotions/${id}/simulate-sale`); }

  // ==================== AI Studio ====================
  getAiContentTypes() { return this.request('GET', '/ai/content-types'); }
  generateAiContent(data) { return this.request('POST', '/ai/generate', data); }

  // ==================== Social Accounts ====================
  getSocialAccounts() { return this.request('GET', '/social/accounts'); }
  getSocialPlatforms() { return this.request('GET', '/social/platforms'); }
  connectSocial(platform) { return this.request('POST', '/social/connect', { platform }); }
  disconnectSocial(id) { return this.request('POST', `/social/accounts/${id}/disconnect`); }
  reconnectSocial(id) { return this.request('POST', `/social/accounts/${id}/reconnect`); }
  getAdvertisingAccounts() { return this.request('GET', '/social/advertising/accounts'); }

  // ==================== Earnings / Wallet ====================
  getWallet() { return this.request('GET', '/earnings/wallet'); }
  getCommissions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/earnings/commissions${qs ? '?' + qs : ''}`);
  }
  getWalletTransactions() { return this.request('GET', '/earnings/transactions'); }
  getWithdrawals() { return this.request('GET', '/earnings/withdrawals'); }
  requestWithdrawal(data) { return this.request('POST', '/earnings/withdrawals', data); }

  // ==================== Admin ====================
  getAdminDashboard() { return this.request('GET', '/admin/dashboard'); }
  getAdminUsers() { return this.request('GET', '/admin/users'); }
  getAdminCommissions(status = '') {
    return this.request('GET', `/admin/commissions${status ? '?status=' + status : ''}`);
  }
  confirmCommission(id) { return this.request('POST', `/admin/commissions/${id}/confirm`); }
  rejectCommission(id, reason = '') { return this.request('POST', `/admin/commissions/${id}/reject`, { reason }); }
  getAdminWithdrawals(status = '') {
    return this.request('GET', `/admin/withdrawals${status ? '?status=' + status : ''}`);
  }
  reviewWithdrawal(id, action, extra = {}) { return this.request('POST', `/admin/withdrawals/${id}/review`, { action, ...extra }); }
  updateUserStatus(id, isActive) { return this.request('PATCH', `/admin/users/${id}/status`, { isActive }); }
  getAuditLogFeed() { return this.request('GET', '/admin/audit-logs?limit=20'); }
}

window.api = new ApiClient();
