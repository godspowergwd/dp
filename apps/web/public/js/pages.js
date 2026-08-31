/**
 * Page Renderers
 */

// === Login Page ===
App.prototype.renderLogin = function() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-header">
          <div class="login-logo"><i class="ri-rocket-2-fill"></i></div>
          <h1 class="login-title">Welcome Back</h1>
          <p class="login-subtitle">Sign in to your Private Dropshipping OS</p>
        </div>
        <form id="login-form">
          <div class="form-group"><label class="form-label">Email <span class="required">*</span></label><input class="form-input" type="email" name="email" required placeholder="you@example.com"></div>
          <div class="form-group"><label class="form-label">Password <span class="required">*</span></label><input class="form-input" type="password" name="password" required placeholder="••••••••"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">Sign In</button>
        </form>
        <p class="text-center text-muted mt-4">Don't have an account? <a href="/register" data-nav>Register</a></p>
      </div>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Signing in...';
    try {
      const data = Object.fromEntries(new FormData(e.target));
      await window.auth.login(data.email, data.password);
      utils.toast('success', 'Welcome back!', `Signed in as ${window.auth.user.name}`);
      window.app.router.navigate('/');
    } catch (err) {
      utils.toast('error', 'Login failed', err.message);
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });
  document.querySelector('#app [data-nav]')?.addEventListener('click', (e) => { e.preventDefault(); window.app.router.navigate(e.target.getAttribute('href')); });
};

// === Register Page ===
App.prototype.renderRegister = function() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-header">
          <div class="login-logo"><i class="ri-rocket-2-fill"></i></div>
          <h1 class="login-title">Create Account</h1>
          <p class="login-subtitle">Start your private dropshipping journey</p>
        </div>
        <form id="register-form">
          <div class="form-group"><label class="form-label">Full Name <span class="required">*</span></label><input class="form-input" type="text" name="name" required placeholder="John Doe"></div>
          <div class="form-group"><label class="form-label">Email <span class="required">*</span></label><input class="form-input" type="email" name="email" required placeholder="you@example.com"></div>
          <div class="form-group"><label class="form-label">Password <span class="required">*</span></label><input class="form-input" type="password" name="password" required minlength="8" placeholder="Min 8 characters"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">Create Account</button>
        </form>
        <p class="text-center text-muted mt-4">Already have an account? <a href="/login" data-nav>Sign in</a></p>
      </div>
    </div>
  `;
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Creating...';
    try {
      const data = Object.fromEntries(new FormData(e.target));
      await window.auth.register(data);
      utils.toast('success', 'Account created!', 'Welcome to PD OS');
      window.app.router.navigate('/');
    } catch (err) {
      utils.toast('error', 'Registration failed', err.message);
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
  document.querySelector('#app [data-nav]')?.addEventListener('click', (e) => { e.preventDefault(); window.app.router.navigate(e.target.getAttribute('href')); });
};

// === Dashboard ===
App.prototype.renderDashboard = async function() {
  this.renderLayout(`
    <div class="page-header">
      <div><h1 class="page-title">Dashboard</h1><p class="page-subtitle">Welcome back, ${utils.escapeHtml(window.auth.user?.name || 'Operator')}</p></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value" id="stat-products">—</div></div>
      <div class="stat-card"><div class="stat-label">Active Listings</div><div class="stat-value" id="stat-active">—</div></div>
      <div class="stat-card"><div class="stat-label">Pending Orders</div><div class="stat-value" id="stat-orders">—</div></div>
      <div class="stat-card"><div class="stat-label">Revenue (MTD)</div><div class="stat-value" id="stat-revenue">—</div></div>
    </div>
    <div class="card"><div class="card-header"><h3 class="card-title">Recent Activity</h3></div><div class="text-muted">Your recent product and order activity will appear here.</div></div>
  `);
  try {
    const products = await window.api.getProducts();
    document.getElementById('stat-products').textContent = products.data?.length || 0;
    document.getElementById('stat-active').textContent = products.data?.filter(p => p.status === 'published').length || 0;
  } catch { /* ignore */ }
};

// === Inventory (internal product catalog — legacy module, preserved) ===
App.prototype.renderInventory = async function() {
  this.renderLayout(`
    <div class="page-header">
      <div><h1 class="page-title">Inventory</h1><p class="page-subtitle">Internal product catalog and listings</p></div>
      <div class="page-actions"><button class="btn btn-primary" id="add-product-btn"><i class="ri-add-line"></i> Add Product</button></div>
    </div>
    <div class="card"><div id="products-content"><div class="loading-container"><div class="spinner"></div></div></div></div>
  `);
  document.getElementById('add-product-btn').onclick = () => this.showProductModal();
  try {
    const res = await window.api.getProducts();
    const products = res.data || [];
    const content = document.getElementById('products-content');
    if (products.length === 0) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-shopping-bag-3-line"></i></div><h3 class="empty-state-title">No products yet</h3><p class="empty-state-desc">Add your first product to get started.</p><button class="btn btn-primary" id="empty-add-btn"><i class="ri-add-line"></i> Add Product</button></div>`;
      document.getElementById('empty-add-btn').onclick = () => this.showProductModal();
    } else {
      content.innerHTML = `<div class="table-container"><table class="table"><thead><tr><th>Title</th><th>Category</th><th>Cost</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>${products.map(p => `<tr><td><strong>${utils.escapeHtml(p.title)}</strong></td><td>${utils.escapeHtml(p.category || '—')}</td><td>${utils.formatCurrency(p.costPrice)}</td><td>${utils.formatCurrency(p.salePrice)}</td><td>${utils.formatStatus(p.status)}</td><td class="table-actions"><button class="btn btn-sm btn-ghost" onclick="window.app.showProductModal(${p.id})"><i class="ri-edit-line"></i></button><button class="btn btn-sm btn-ghost" onclick="window.app.deleteProduct(${p.id})"><i class="ri-delete-bin-line"></i></button></td></tr>`).join('')}</tbody></table></div>`;
    }
  } catch (err) {
    document.getElementById('products-content').innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
};

App.prototype.showProductModal = function(id = null) {
  const isEdit = !!id;
  utils.showModal(isEdit ? 'Edit Product' : 'Add Product', `
    <form id="product-form">
      <div class="form-group"><label class="form-label">Title <span class="required">*</span></label><input class="form-input" name="title" required placeholder="Product name"></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" name="description" placeholder="Product description"></textarea></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Category</label><input class="form-input" name="category" placeholder="e.g. Electronics"></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status"><option value="discovered">Discovered</option><option value="researching">Researching</option><option value="shortlisted">Shortlisted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Cost Price</label><input class="form-input" name="costPrice" type="number" step="0.01" placeholder="0.00"></div><div class="form-group"><label class="form-label">Sale Price</label><input class="form-input" name="salePrice" type="number" step="0.01" placeholder="0.00"></div></div>
      <div class="form-group"><label class="form-label">Supplier URL</label><input class="form-input" name="supplierUrl" type="url" placeholder="https://..."></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes" placeholder="Internal notes"></textarea></div>
    </form>
  `, `<button class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button> <button class="btn btn-primary" id="save-product-btn">${isEdit ? 'Update' : 'Create'}</button>`);
  document.getElementById('save-product-btn').onclick = async () => {
    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.costPrice) data.costPrice = parseFloat(data.costPrice);
    if (data.salePrice) data.salePrice = parseFloat(data.salePrice);
    try {
      if (isEdit) await window.api.updateProduct(id, data); else await window.api.createProduct(data);
      utils.toast('success', 'Success', isEdit ? 'Product updated' : 'Product created');
      utils.hideModal(); this.renderProducts();
    } catch (err) { utils.toast('error', 'Error', err.message); }
  };
};

App.prototype.deleteProduct = function(id) {
  utils.confirm('Are you sure you want to delete this product?', async () => {
    try { await window.api.deleteProduct(id); utils.toast('success', 'Deleted', 'Product removed'); this.renderProducts(); }
    catch (err) { utils.toast('error', 'Error', err.message); }
  });
};

// === Research ===
App.prototype.renderResearch = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Product Research</h1><p class="page-subtitle">Discover and analyze trending products</p></div></div><div class="card"><div id="research-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getResearch(); document.getElementById('research-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-search-eye-line"></i></div><h3 class="empty-state-title">Research Module</h3><p class="empty-state-desc">Product research tools will appear here.</p></div>`; }
  catch (err) { document.getElementById('research-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Suppliers ===
App.prototype.renderSuppliers = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Suppliers</h1><p class="page-subtitle">Manage your supplier network</p></div></div><div class="card"><div id="suppliers-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getSuppliers(); document.getElementById('suppliers-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-truck-line"></i></div><h3 class="empty-state-title">Supplier Management</h3><p class="empty-state-desc">Your supplier directory will appear here.</p></div>`; }
  catch (err) { document.getElementById('suppliers-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Stores ===
App.prototype.renderStores = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Stores</h1><p class="page-subtitle">Manage your storefront integrations</p></div></div><div class="card"><div id="stores-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getStores(); document.getElementById('stores-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-store-2-line"></i></div><h3 class="empty-state-title">Store Management</h3><p class="empty-state-desc">Connect and manage your storefronts.</p></div>`; }
  catch (err) { document.getElementById('stores-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Orders ===
App.prototype.renderOrders = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Orders</h1><p class="page-subtitle">Track and fulfill customer orders</p></div></div><div class="card"><div id="orders-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getOrders(); document.getElementById('orders-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-file-list-3-line"></i></div><h3 class="empty-state-title">Order Management</h3><p class="empty-state-desc">Your orders and fulfillment tracking will appear here.</p></div>`; }
  catch (err) { document.getElementById('orders-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === AI Studio ===
App.prototype.renderAiStudio = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">AI Studio</h1><p class="page-subtitle">Generate product content with AI</p></div></div><div class="card"><div id="ai-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getAiJobs(); document.getElementById('ai-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-magic-line"></i></div><h3 class="empty-state-title">AI Studio</h3><p class="empty-state-desc">Generate product descriptions, marketing copy, and more with AI.</p></div>`; }
  catch (err) { document.getElementById('ai-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Marketing ===
App.prototype.renderMarketing = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Marketing</h1><p class="page-subtitle">Manage campaigns and social publishing</p></div></div><div class="card"><div id="marketing-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getMarketing(); document.getElementById('marketing-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-megaphone-line"></i></div><h3 class="empty-state-title">Marketing Hub</h3><p class="empty-state-desc">Plan and publish your marketing campaigns.</p></div>`; }
  catch (err) { document.getElementById('marketing-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Analytics ===
App.prototype.renderAnalytics = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Analytics</h1><p class="page-subtitle">Track performance and revenue</p></div></div><div class="card"><div id="analytics-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getAnalytics(); document.getElementById('analytics-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-bar-chart-grouped-line"></i></div><h3 class="empty-state-title">Analytics Dashboard</h3><p class="empty-state-desc">Your sales and performance metrics will appear here.</p></div>`; }
  catch (err) { document.getElementById('analytics-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Integrations ===
App.prototype.renderIntegrations = async function() {
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Integrations</h1><p class="page-subtitle">Connect third-party services</p></div></div><div class="card"><div id="integrations-content"><div class="loading-container"><div class="spinner"></div></div></div></div>`);
  try { await window.api.getIntegrations(); document.getElementById('integrations-content').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="ri-plug-2-line"></i></div><h3 class="empty-state-title">Integrations</h3><p class="empty-state-desc">Connect your stores, suppliers, and marketing platforms.</p></div>`; }
  catch (err) { document.getElementById('integrations-content').innerHTML = `<p class="text-danger">${err.message}</p>`; }
};

// === Settings ===
App.prototype.renderSettings = function() {
  const user = window.auth.user;
  this.renderLayout(`<div class="page-header"><div><h1 class="page-title">Settings</h1><p class="page-subtitle">Manage your account and preferences</p></div></div>
  <div class="card" style="max-width:600px"><div class="card-header"><h3 class="card-title">Account Settings</h3></div>
  <form id="settings-form"><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" name="name" value="${utils.escapeHtml(user?.name || '')}"></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" value="${utils.escapeHtml(user?.email || '')}" disabled></div><div class="form-group"><label class="form-label">Role</label><input class="form-input" value="${utils.escapeHtml(user?.role || 'Operator')}" disabled></div><button type="submit" class="btn btn-primary">Save Changes</button></form>
  <hr style="border-color: var(--border-primary); margin: 1.5rem 0"><h4 class="font-semibold mb-4">Danger Zone</h4><button class="btn btn-danger" id="logout-btn"><i class="ri-logout-box-r-line"></i> Sign Out</button></div>`);
  document.getElementById('settings-form').addEventListener('submit', (e) => { e.preventDefault(); utils.toast('info', 'Info', 'Profile update not yet implemented'); });
  document.getElementById('logout-btn').onclick = () => window.auth.logout();
};

// === 404 ===
App.prototype.render404 = function() {
  this.renderLayout(`<div class="empty-state"><div class="empty-state-icon"><i class="ri-error-warning-line"></i></div><h3 class="empty-state-title">Page Not Found</h3><p class="empty-state-desc">The page you're looking for doesn't exist.</p><a href="/" class="btn btn-primary" data-nav>Go to Dashboard</a></div>`);
};
