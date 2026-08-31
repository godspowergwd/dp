/**
 * PromoDesk — Core pages: auth, dashboard, settings
 */

// === Login ===
App.prototype.renderLogin = function() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-header">
          <div class="login-logo"><i class="ri-rocket-line"></i></div>
          <h1 class="login-title">Welcome back</h1>
          <p class="login-subtitle">Sign in to continue to PromoDesk</p>
        </div>
        <form id="login-form" novalidate>
          <div class="form-group"><label class="form-label" for="login-email">Email</label>
            <input class="form-input" type="email" id="login-email" name="email" required placeholder="you@example.com" autocomplete="email"></div>
          <div class="form-group"><label class="form-label" for="login-password">Password</label>
            <input class="form-input" type="password" id="login-password" name="password" required placeholder="Enter your password" autocomplete="current-password"></div>
          <div id="login-error"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-submit">Sign In</button>
        </form>
        <p class="text-center text-muted mt-4 text-sm">New to PromoDesk? <a href="/register" data-nav>Create an account</a></p>
      </div>
    </div>`;
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errBox = document.getElementById('login-error');
    const btn = document.getElementById('login-submit');
    errBox.innerHTML = '';
    if (!email || !password) {
      errBox.innerHTML = `<div class="form-error"><i class="ri-error-warning-line"></i> Please enter your email and password.</div>`;
      return;
    }
    utils.setBtnLoading(btn, 'Signing you in...');
    try {
      await window.auth.login(email, password);
      utils.toast('success', 'Welcome back!', `You're signed in as ${window.auth.user.name || 'you'}.`);
      window.app.router.navigate('/');
    } catch (err) {
      errBox.innerHTML = `<div class="alert alert-danger" style="margin-bottom:0.8rem"><i class="ri-error-warning-line"></i> ${utils.escapeHtml(err.message)}</div>`;
      utils.setBtnIdle(btn);
    }
  });
  document.querySelector('#app [data-nav]')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.closest('a')) window.app.router.navigate(e.target.closest('a').getAttribute('href'));
  });
};

// === Register ===
App.prototype.renderRegister = function() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-header">
          <div class="login-logo"><i class="ri-rocket-line"></i></div>
          <h1 class="login-title">Create your account</h1>
          <p class="login-subtitle">Start discovering products and earning commissions today</p>
        </div>
        <form id="register-form" novalidate>
          <div class="form-group"><label class="form-label" for="reg-name">Full name</label>
            <input class="form-input" type="text" id="reg-name" name="name" required placeholder="Your name" autocomplete="name"></div>
          <div class="form-group"><label class="form-label" for="reg-email">Email</label>
            <input class="form-input" type="email" id="reg-email" name="email" required placeholder="you@example.com" autocomplete="email"></div>
          <div class="form-group"><label class="form-label" for="reg-password">Password</label>
            <input class="form-input" type="password" id="reg-password" name="password" required minlength="8" placeholder="At least 8 characters" autocomplete="new-password">
            <div class="form-hint">Use at least 8 characters.</div></div>
          <div id="register-error"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="register-submit">Create Account</button>
        </form>
        <p class="text-center text-muted mt-4 text-sm">Already have an account? <a href="/login" data-nav>Sign in</a></p>
      </div>
    </div>`;
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errBox = document.getElementById('register-error');
    const btn = document.getElementById('register-submit');
    errBox.innerHTML = '';
    if (password.length < 8) {
      errBox.innerHTML = `<div class="form-error"><i class="ri-error-warning-line"></i> Your password must be at least 8 characters.</div>`;
      return;
    }
    utils.setBtnLoading(btn, 'Creating your account...');
    try {
      await window.auth.register({ name, email, password });
      utils.toast('success', 'Account created!', 'Welcome to PromoDesk.');
      window.app.router.navigate('/');
    } catch (err) {
      errBox.innerHTML = `<div class="alert alert-danger" style="margin-bottom:0.8rem"><i class="ri-error-warning-line"></i> ${utils.escapeHtml(err.message)}</div>`;
      utils.setBtnIdle(btn);
    }
  });
  document.querySelector('#app [data-nav]')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.closest('a')) window.app.router.navigate(e.target.closest('a').getAttribute('href'));
  });
};
// === Dashboard ===
App.prototype.renderDashboard = async function() {
  this.renderLayout(`
    <div class="page-header">
      <div><h1 class="page-title">Welcome back, ${utils.escapeHtml(window.auth.user?.name || 'there')}</h1>
      <p class="page-subtitle">Here is what is happening with your account today.</p></div>
      <div class="page-actions">
        <a class="btn btn-primary" href="/products" data-nav><i class="ri-add-line"></i> Promote a Product</a>
      </div>
    </div>
    <div id="dash-wallet" class="mb-4"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem">
      <div id="dash-promos" class="card"></div>
      <div id="dash-activity" class="card"></div>
    </div>
    <div class="card mt-4" id="dash-connect"></div>`);

  const load = async () => {
    const walletEl = document.getElementById('dash-wallet');
    const promosEl = document.getElementById('dash-promos');
    const activityEl = document.getElementById('dash-activity');
    const connectEl = document.getElementById('dash-connect');
    if (!walletEl) return;
    walletEl.innerHTML = `
      <div class="card" style="padding:0">
        <div class="wallet-hero">
          <h2>Available balance</h2>
          <div class="skeleton" style="height:38px;width:200px;margin-top:0.6rem;border-radius:8px"></div>
          <div class="wallet-note">&nbsp;</div>
        </div>
        <div class="wallet-earnings-grid" id="dash-wallet-grid"></div>
      </div>`;
    const walletGrid = document.getElementById('dash-wallet-grid');
    try {
      const [walletRes, promoRes, accountsRes, txRes] = await Promise.allSettled([
        window.api.getWallet(), window.api.getPromotions({ limit: 4 }),
        window.api.getSocialAccounts(), window.api.getWalletTransactions(),
      ]);
      const w = walletRes.status === 'fulfilled' ? walletRes.value.data : null;
      const promos = promoRes.status === 'fulfilled' ? (promoRes.value.data || []) : [];
      const accounts = accountsRes.status === 'fulfilled' ? (accountsRes.value.data || []) : [];
      const txs = txRes.status === 'fulfilled' ? (txRes.value.data || []) : [];

      if (w) {
        const hero = document.querySelector('.wallet-hero');
        hero.querySelector('.skeleton')?.remove();
        const b = document.createElement('div');
        b.className = 'wallet-balance';
        b.textContent = utils.formatCurrency(w.available);
        const n = hero.querySelector('.wallet-note') || document.createElement('div');
        n.className = 'wallet-note';
        n.textContent = 'Confirmed earnings that are ready to be withdrawn.';
        hero.appendChild(b);
        hero.appendChild(n);
      }
      const cards = [
        ['Estimated earnings', w?.estimated ?? 0, 'ri-lightbulb-flash-line', 'warning'],
        ['Pending', w?.pending ?? 0, 'ri-time-line', 'info'],
        ['Confirmed available', w?.available ?? 0, 'ri-wallet-3-line', 'success'],
        ['Total paid', w?.paid ?? 0, 'ri-bank-line', 'primary'],
      ];
      walletGrid.innerHTML = cards.map(([label, val, icon, tone]) => `
        <div class="card" style="padding:1rem">
          <div class="stat-label">${label}</div>
          <div class="flex-between" style="margin-top:0.3rem">
            <span style="font-size:1.3rem;font-weight:800">${utils.formatCurrency(val)}</span>
            <i class="${icon}" style="color:var(--${tone});font-size:1.3rem"></i>
          </div>
        </div>`).join('');

      promosEl.innerHTML = `
        <div class="card-header"><h3 class="card-title"><i class="ri-megaphone-line"></i> Recent Activity</h3>
          <a class="text-sm" href="/promotions" data-nav>View all</a></div>
        ${promos.length ? promos.slice(0, 4).map(p => {
          const prod = p.product || {};
          return `<div class="flex-between" style="padding:0.55rem 0;border-bottom:1px solid var(--border)">
            <div class="flex" style="gap:0.7rem;align-items:center;min-width:0">
              ${prod.images?.[0] ? `<img src="${utils.escapeHtml(prod.images[0])}" style="width:42px;height:42px;border-radius:9px;object-fit:cover;background:var(--surface-2)">` : ''}
              <div style="min-width:0">
                <div style="font-weight:600;font-size:0.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">${utils.escapeHtml(prod.title || 'Product')}</div>
                <div class="text-muted text-xs">${utils.timeAgo(p.createdAt)} · ${utils.humanStatus(p.socialPlatform) || 'no platform yet'}</div>
              </div>
            </div>${utils.statusBadge(p.status)}</div>`;}).join('')
        : `<div class="empty-state">
            <div class="empty-state-icon"><i class="ri-megaphone-line"></i></div>
            <h3>No campaigns yet</h3>
            <p>Pick a product and start promoting it. Your campaigns will appear here.</p>
            <a class="btn btn-primary" href="/products" data-nav><i class="ri-shopping-bag-3-line"></i> Browse Products</a>
          </div>`}`;

      activityEl.innerHTML = `
        <div class="card-header"><h3 class="card-title"><i class="ri-file-wallet-line"></i> Wallet activity</h3>
          <a class="text-sm" href="/earnings" data-nav>View wallet</a></div>
        ${txs.length ? txs.slice(0, 5).map(t => `
          <div class="flex-between" style="padding:0.55rem 0;border-bottom:1px solid var(--border)">
            <div style="min-width:0">
              <div style="font-weight:600;font-size:0.86rem">${utils.escapeHtml(utils.humanStatus(t.type))}</div>
              <div class="text-muted text-xs" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${utils.escapeHtml(t.description || '')}</div>
            </div>
            <div style="font-weight:700;color:${Number(t.amount) >= 0 ? 'var(--success)' : 'var(--text-2)'}">${Number(t.amount) >= 0 ? '+' : ''}${utils.formatCurrency(t.amount)}</div>
          </div>`).join('')
        : `<div class="empty-state"><div class="empty-state-icon"><i class="ri-file-wallet-line"></i></div>
            <h3>No activity yet</h3><p>Your earnings and transactions will show up here.</p></div>`}`;

      connectEl.innerHTML = `
        <div class="card-header"><h3 class="card-title"><i class="ri-link"></i> Connected accounts</h3>
          <a class="text-sm" href="/integrations" data-nav>Manage connections</a></div>
        <div class="flex flex-wrap gap-2">
          ${['facebook', 'instagram', 'tiktok'].map(pl => {
            const acc = accounts.find(a => a.provider === pl && a.status === 'connected');
            const icon = pl === 'facebook' ? 'ri-facebook-fill' : pl === 'instagram' ? 'ri-instagram-fill' : 'ri-music-2-fill';
            return `<div class="card" style="padding:0.85rem 1rem;display:flex;align-items:center;gap:0.65rem">
              <i class="${icon}" style="font-size:1.4rem;color:${acc ? 'var(--success)' : 'var(--text-3)'}"></i>
              <div><div style="font-weight:600;font-size:0.85rem">${pl.charAt(0).toUpperCase() + pl.slice(1)}</div>
              <div class="text-xs" style="color:${acc ? 'var(--success)' : 'var(--text-3)'}">${acc ? 'Connected' : 'Not connected'}</div></div>
            </div>`;}).join('')}
        </div>`;
    } catch (err) {
      if (walletGrid) walletGrid.innerHTML = `<div class="alert alert-danger">${utils.escapeHtml(err.message)}</div>`;
    }
  };
  await load();
};
// === AI Studio landing (no product selected yet) ===
App.prototype.renderAiStudioHome = async function(promotionId) {
  if (promotionId) {
    await this.renderAiStudio(promotionId);
    return;
  }
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">AI Studio</h1>
    <p class="page-subtitle">Turn any product into ready-to-post content in seconds</p></div></div>
    <div class="card" style="max-width:640px;margin:0 auto">
      <div class="empty-state">
        <div class="empty-state-icon"><i class="ri-magic-line"></i></div>
        <h3>Choose a product to get started</h3>
        <p>Select a product from the marketplace and we will build the marketing content for it — posts, captions, scripts and more.</p>
        <div class="flex flex-wrap gap-2" style="justify-content:center">
          <a class="btn btn-primary" href="/products" data-nav><i class="ri-shopping-bag-3-line"></i> Browse Products</a>
          <a class="btn btn-secondary" href="/promotions" data-nav><i class="ri-megaphone-line"></i> My Promotions</a>
        </div>
      </div>
    </div>`);
};

// === Settings ===
App.prototype.renderSettings = function() {
  const user = window.auth.user;
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Manage your account and security</p></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="ri-user-line"></i> Profile</h3></div>
        <div id="profile-result"></div>
        <form id="profile-form" novalidate>
          <div class="form-group"><label class="form-label">Full name</label>
            <input class="form-input" name="name" value="${utils.escapeHtml(user?.name || '')}"></div>
          <div class="form-group"><label class="form-label">Email</label>
            <input class="form-input" type="email" value="${utils.escapeHtml(user?.email || '')}" disabled>
            <div class="form-hint">Your email cannot be changed.</div></div>
          <button type="submit" class="btn btn-primary" id="profile-submit"><i class="ri-save-line"></i> Save Changes</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="ri-lock-line"></i> Password</h3></div>
        <div id="password-result"></div>
        <form id="password-form" novalidate>
          <div class="form-group"><label class="form-label">Current password</label>
            <input class="form-input" type="password" name="currentPassword" autocomplete="current-password" required></div>
          <div class="form-group"><label class="form-label">New password</label>
            <input class="form-input" type="password" name="newPassword" minlength="8" autocomplete="new-password" required>
            <div class="form-hint">Use at least 8 characters.</div></div>
          <button type="submit" class="btn btn-primary" id="password-submit"><i class="ri-lock-password-line"></i> Update Password</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="ri-shield-check-line"></i> Session</h3></div>
        <p class="text-sm text-muted" style="margin-bottom:1rem">Signing out ends this session on this device. You can sign back in at any time.</p>
        <p class="text-xs text-muted" style="margin-bottom:1rem">Signed in as <strong>${utils.escapeHtml(user?.email || '')}</strong></p>
        <button class="btn btn-danger btn-block" id="settings-logout"><i class="ri-logout-box-r-line"></i> Sign Out</button>
      </div>
    </div>`);

  // Profile save
  const pForm = document.getElementById('profile-form');
  pForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('profile-submit');
    const box = document.getElementById('profile-result');
    utils.setBtnLoading(btn, 'Saving...');
    box.innerHTML = '';
    try {
      const res = await window.api.updateProfile({ name: pForm.name.value.trim() });
      if (res.user) { window.auth.setUser(res.user, res.token || window.auth.token); }
      box.innerHTML = `<div class="alert alert-success"><i class="ri-check-circle-line"></i> Your profile has been updated.</div>`;
      utils.toast('success', 'Saved', 'Your profile has been updated.');
    } catch (err) {
      box.innerHTML = `<div class="alert alert-danger"><i class="ri-error-warning-line"></i> ${utils.escapeHtml(err.message)}</div>`;
    }
    utils.setBtnIdle(btn);
    setTimeout(() => { box.innerHTML = ''; }, 3500);
  });

  // Password change
  const pwForm = document.getElementById('password-form');
  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('password-submit');
    const box = document.getElementById('password-result');
    if (pwForm.newPassword.value.length < 8) {
      box.innerHTML = `<div class="alert alert-danger"><i class="ri-error-warning-line"></i> Your new password must be at least 8 characters.</div>`;
      return;
    }
    utils.setBtnLoading(btn, 'Updating...');
    box.innerHTML = '';
    try {
      const res = await window.api.updateProfile({ currentPassword: pwForm.currentPassword.value, password: pwForm.newPassword.value });
      if (res.token) window.auth.setUser(res.user || window.auth.user, res.token);
      pwForm.reset();
      box.innerHTML = `<div class="alert alert-success"><i class="ri-check-circle-line"></i> Your password has been updated.</div>`;
      utils.toast('success', 'Password updated', 'Your new password is active.');
    } catch (err) {
      box.innerHTML = `<div class="alert alert-danger"><i class="ri-error-warning-line"></i> ${utils.escapeHtml(err.message)}</div>`;
    }
    utils.setBtnIdle(btn);
    setTimeout(() => { box.innerHTML = ''; }, 3500);
  });

  document.getElementById('settings-logout').onclick = () => {
    utils.confirm('Are you sure you want to sign out of PromoDesk?', () => window.auth.logout(), { title: 'Sign out', confirmText: 'Sign Out' });
  };
};

// === 404 ===
App.prototype.render404 = function() {
  this.renderLayout(`
    <div class="empty-state" style="min-height:60vh;justify-content:center">
      <div class="empty-state-icon"><i class="ri-compass-3-line"></i></div>
      <h3>Page not found</h3>
      <p>The page you are looking for does not exist or has moved.</p>
      <a href="/" class="btn btn-primary" data-nav><i class="ri-home-5-line"></i> Go to Dashboard</a>
    </div>`);
};
