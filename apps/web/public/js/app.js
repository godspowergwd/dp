/**
 * PromoDesk — App shell, navigation & routing
 */

const NAV_SECTIONS = [
  { label: 'Overview', items: [{ path: '/', label: 'Dashboard', icon: 'ri-dashboard-3-line' }] },
  {
    label: 'Marketplace',
    items: [
      { path: '/products', label: 'Products', icon: 'ri-shopping-bag-3-line' },
      { path: '/ai-studio', label: 'AI Studio', icon: 'ri-magic-line' },
      { path: '/promotions', label: 'My Promotions', icon: 'ri-megaphone-line' },
    ],
  },
  { label: 'Earnings', items: [{ path: '/earnings', label: 'Wallet', icon: 'ri-wallet-3-line' }] },
  {
    label: 'Account',
    items: [
      { path: '/integrations', label: 'Connections', icon: 'ri-link' },
      { path: '/settings', label: 'Settings', icon: 'ri-settings-3-line' },
    ],
  },
];

const BOTTOM_NAV = [
  { path: '/', label: 'Home', icon: 'ri-home-5-line' },
  { path: '/products', label: 'Products', icon: 'ri-shopping-bag-3-line' },
  { path: '/ai-studio', label: 'Studio', icon: 'ri-magic-line' },
  { path: '/earnings', label: 'Wallet', icon: 'ri-wallet-3-line' },
  { path: '/promotions', label: 'Promos', icon: 'ri-megaphone-line' },
];

const PAGE_TITLES = {
  '/': ['Dashboard', 'Your business at a glance'],
  '/products': ['Products', 'Browse the affiliate marketplace'],
  '/ai-studio': ['AI Studio', 'Create marketing content in seconds'],
  '/promotions': ['My Promotions', 'Track everything you publish'],
  '/earnings': ['Wallet', 'Commissions, withdrawals & payouts'],
  '/integrations': ['Connections', 'Link your social media accounts'],
  '/settings': ['Settings', 'Manage your account'],
  '/admin': ['Admin', 'Platform management'],
};

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
    if (isAuth && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      this.router.navigate('/');
      return;
    }
    this.router.resolve();
  }

  registerRoutes() {
    const legacy = ['/inventory', '/research', '/suppliers', '/stores', '/orders', '/marketing', '/analytics'];
    this.router
      .add('/login', () => this.renderLogin())
      .add('/register', () => this.renderRegister())
      .add('/', () => this.renderDashboard())
      .add('/products', () => this.renderProducts())
      .add('/ai-studio', () => this.renderAiStudioHome(App.pageParams().promotion || null))
      .add('/promotions', () => this.renderPromotions())
      .add('/earnings', () => this.renderEarnings())
      .add('/integrations', () => this.renderIntegrations())
      .add('/settings', () => this.renderSettings())
      .add('/admin', () => this.renderAdmin())
      .add('/404', () => this.render404());
    legacy.forEach(p => this.router.add(p, () => this.router.navigate('/')));
  }

  static pageParams() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((v, k) => { params[k] = v; });
    return params;
  }

  /** Route guard: only admins/owners may access /admin */
  guardRoute(path) {
    const user = window.auth.user;
    if (path === '/admin' && !['admin', 'owner'].includes(user?.role)) {
      utils.toast('warning', 'Access restricted', 'This area is only available to administrators.');
      this.router.navigate('/');
      return false;
    }
    return true;
  }
renderLayout(content, { pageTitle, crumb } = {}) {
    const app = document.getElementById('app');
    const user = window.auth.user;
    const path = window.location.pathname;
    const t = PAGE_TITLES[path] || [pageTitle || 'PromoDesk', crumb || ''];
    const sections = NAV_SECTIONS.map(sec => {
      const links = sec.items
        .map(it => `<a class="sidebar-link ${this.isActive(it.path)}" href="${it.path}" data-nav>
          <i class="${it.icon}"></i><span>${it.label}</span></a>`)
        .join('');
      return links ? `<div class="sidebar-section">
        <div class="sidebar-section-title">${sec.label}</div>${links}</div>` : '';
    }).join('');
    const adminLink = ['admin', 'owner'].includes(user?.role)
      ? `<div class="sidebar-section"><div class="sidebar-section-title">Management</div>
          <a class="sidebar-link ${this.isActive('/admin')}" href="/admin" data-nav>
            <i class="ri-shield-user-line"></i><span>Admin</span></a></div>`
      : '';
    const bottomNav = BOTTOM_NAV.map(it =>
      `<a class="bottom-nav-item ${path === it.path ? 'active' : ''}" href="${it.path}" data-nav>
        <i class="${it.icon}"></i><span>${it.label}</span></a>`).join('');

    app.innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="brand-logo"><i class="ri-rocket-line"></i></div>
            <div><div class="brand-name">PromoDesk</div><div class="brand-tag">Affiliate Commerce</div></div>
          </div>
          <nav class="sidebar-nav">${sections}${adminLink}</nav>
          <div class="sidebar-footer">
            <div class="sidebar-user">
              <div class="avatar">${user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div class="sidebar-user-info">
                <div class="sidebar-user-name">${utils.escapeHtml(user?.name || 'Member')}</div>
                <div class="sidebar-user-role">${user?.role === 'owner' ? 'Administrator' : 'Creator'}</div>
              </div>
            </div>
          </div>
        </aside>

        <header class="topbar">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu"><i class="ri-menu-line"></i></button>
          <div>
            <div class="topbar-crumb">${t[1] || 'PromoDesk'}</div>
            <div class="topbar-page">${t[0]}</div>
          </div>
        </header>

        <main class="main-content" id="main-content"><div class="page">${content}</div></main>

        <nav class="bottom-nav" id="bottom-nav">${bottomNav}</nav>
      </div>
    `;
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) btn.onclick = () => document.getElementById('sidebar')?.classList.toggle('open');
    app.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('sidebar')?.classList.remove('open');
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