/**
 * App Initialization & Layout
 */

class App {
  constructor() {
    this.router = window.router;
  }

  async init() {
    const isAuth = await window.auth.checkAuth();
    this.registerRoutes();
    if (!isAuth && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      this.router.navigate('/login');
      return;
    }
    this.router.resolve();
  }

  registerRoutes() {
    this.router
      .add('/login', () => this.renderLogin())
      .add('/register', () => this.renderRegister())
      .add('/', () => this.renderDashboard())
      .add('/products', () => this.renderProducts())
      .add('/research', () => this.renderResearch())
      .add('/suppliers', () => this.renderSuppliers())
      .add('/stores', () => this.renderStores())
      .add('/orders', () => this.renderOrders())
      .add('/ai-studio', () => this.renderAiStudio())
      .add('/marketing', () => this.renderMarketing())
      .add('/analytics', () => this.renderAnalytics())
      .add('/integrations', () => this.renderIntegrations())
      .add('/settings', () => this.renderSettings())
      .add('/404', () => this.render404());
  }

  renderLayout(content) {
    const app = document.getElementById('app');
    const user = window.auth.user;
    app.innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo"><i class="ri-rocket-2-fill"></i></div>
            <span class="sidebar-brand">PD OS</span>
          </div>
          <nav class="sidebar-nav">
            <div class="sidebar-section">
              <div class="sidebar-section-title">Overview</div>
              <a class="sidebar-link ${this.isActive('/')}" href="/" data-nav><i class="ri-dashboard-3-line"></i><span>Dashboard</span></a>
            </div>
            <div class="sidebar-section">
              <div class="sidebar-section-title">Operations</div>
              <a class="sidebar-link ${this.isActive('/products')}" href="/products" data-nav><i class="ri-shopping-bag-3-line"></i><span>Products</span></a>
              <a class="sidebar-link ${this.isActive('/research')}" href="/research" data-nav><i class="ri-search-eye-line"></i><span>Research</span></a>
              <a class="sidebar-link ${this.isActive('/suppliers')}" href="/suppliers" data-nav><i class="ri-truck-line"></i><span>Suppliers</span></a>
              <a class="sidebar-link ${this.isActive('/stores')}" href="/stores" data-nav><i class="ri-store-2-line"></i><span>Stores</span></a>
              <a class="sidebar-link ${this.isActive('/orders')}" href="/orders" data-nav><i class="ri-file-list-3-line"></i><span>Orders</span></a>
            </div>
            <div class="sidebar-section">
              <div class="sidebar-section-title">Growth</div>
              <a class="sidebar-link ${this.isActive('/ai-studio')}" href="/ai-studio" data-nav><i class="ri-magic-line"></i><span>AI Studio</span></a>
              <a class="sidebar-link ${this.isActive('/marketing')}" href="/marketing" data-nav><i class="ri-megaphone-line"></i><span>Marketing</span></a>
              <a class="sidebar-link ${this.isActive('/analytics')}" href="/analytics" data-nav><i class="ri-bar-chart-grouped-line"></i><span>Analytics</span></a>
            </div>
            <div class="sidebar-section">
              <div class="sidebar-section-title">System</div>
              <a class="sidebar-link ${this.isActive('/integrations')}" href="/integrations" data-nav><i class="ri-plug-2-line"></i><span>Integrations</span></a>
              <a class="sidebar-link ${this.isActive('/settings')}" href="/settings" data-nav><i class="ri-settings-3-line"></i><span>Settings</span></a>
            </div>
          </nav>
          <div class="sidebar-footer">
            <div class="sidebar-user">
              <div class="sidebar-avatar">${user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div class="sidebar-user-info">
                <div class="sidebar-user-name">${utils.escapeHtml(user?.name || 'User')}</div>
                <div class="sidebar-user-role">${user?.role || 'Operator'}</div>
              </div>
            </div>
          </div>
        </aside>
        <main class="main-content" id="main-content">${content}</main>
      </div>
    `;
    app.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.router.navigate(link.getAttribute('href'));
      });
    });
  }

  isActive(path) {
    return window.location.pathname === path ? 'active' : '';
  }
}

window.app = new App();
window.addEventListener('DOMContentLoaded', () => window.app.init());
