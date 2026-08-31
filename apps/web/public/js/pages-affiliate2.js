/**
 * Affiliate Commerce Pages (2/2)
 * Earnings/Wallet · Integrations · Advertising · Admin
 */

// ==================== EARNINGS / WALLET ====================
App.prototype.renderEarnings = async function() {
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Earnings</h1>
    <p class="page-subtitle">Your affiliate commission wallet</p></div></div>
    <div id="earnings-content"><div class="text-center" style="padding:2rem"><div class="spinner"></div></div></div>
  `);
  const root = document.getElementById('earnings-content');
  try {
    const [walletRes, commRes, wdRes] = await Promise.all([
      window.api.getWallet(), window.api.getCommissions(), window.api.getWithdrawals(),
    ]);
    const w = walletRes.data;
    const commissions = commRes.data || [];
    const withdrawals = wdRes.data || [];
    const cards = [
      ['Estimated', w.estimated, '#6c757d', 'ri-lightbulb-line', 'Potential earnings from product commission data'],
      ['Pending', w.pending, '#b8860b', 'ri-time-line', 'Detected sales awaiting network confirmation'],
      ['Available', w.available, '#1a7f4b', 'ri-wallet-3-line', 'Confirmed earnings ready for withdrawal'],
      ['Total Paid', w.paid, '#1565c0', 'ri-bank-card-line', 'Earnings paid out to you'],
    ];
    root.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
        ${cards.map(([label, val, color, icon, tip]) => `
          <div class="card" title="${tip}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="text-muted" style="font-size:0.85rem">${label}</span><i class="${icon}" style="color:${color}"></i></div>
            <div style="font-size:1.5rem;font-weight:700;color:${color}">${utils.formatCurrency(val)}</div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="earnings-grid">
        <div class="card">
          <h3 style="margin-bottom:0.7rem"><i class="ri-arrow-down-circle-line"></i> Request Withdrawal</h3>
          <p class="text-muted" style="font-size:0.85rem">Available balance: <strong>${utils.formatCurrency(w.available)}</strong></p>
          <label class="form-label">Amount</label>
          <input class="form-input" id="wd-amount" type="number" min="1" step="0.01" placeholder="0.00">
          <label class="form-label">Payout Method</label>
          <select class="form-select" id="wd-method">
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <label class="form-label">Payout Details</label>
          <input class="form-input" id="wd-details" placeholder="e.g. account number / mobile number">
          <button class="btn btn-primary btn-block" id="wd-btn" style="margin-top:0.8rem"><i class="ri-bank-line"></i> Request Withdrawal</button>
          <p class="text-muted" style="font-size:0.75rem;margin-top:0.5rem">Requests are reviewed by admins during weekly payout processing.</p>
        </div>
        <div class="card">
          <h3 style="margin-bottom:0.7rem"><i class="ri-history-line"></i> Withdrawal History</h3>
          ${withdrawals.length ? withdrawals.map(x => `
            <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border-color,#e5e7eb)">
              <span>${utils.formatCurrency(x.amount)} · ${x.payoutMethod}</span>
              <span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${x.status}</span></div>`).join('')
          : '<p class="text-muted">No withdrawals yet.</p>'}
        </div>
      </div>
      <style>@media(max-width:800px){.earnings-grid{grid-template-columns:1fr !important}}</style>
      <div id="commissions-section"></div>`;
    this.renderCommissionsTable(document.getElementById('commissions-section'), commissions);
    document.getElementById('wd-btn').onclick = async () => {
      const amount = parseFloat(document.getElementById('wd-amount').value);
      const payoutMethod = document.getElementById('wd-method').value;
      const details = document.getElementById('wd-details').value.trim();
      if (!amount || amount <= 0) return utils.toast('error', 'Invalid amount', 'Enter a valid withdrawal amount');
      if (!details) return utils.toast('error', 'Missing details', 'Enter your payout details');
      try {
        await window.api.requestWithdrawal({ amount, payoutMethod, payoutDetails: { [payoutMethod]: details } });
        utils.toast('success', 'Withdrawal requested', 'An admin will review your request');
        this.renderEarnings();
      } catch (err) { utils.toast('error', 'Request failed', err.message); }
    };
  } catch (err) { root.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`; }
};

// Commission history table (shared by user earnings + admin)
App.prototype.renderCommissionsTable = function(el, commissions, withUser = false) {
  el.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:0.7rem"><i class="ri-coins-line"></i> Commission History</h3>
      ${commissions.length ? `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="text-align:left;border-bottom:2px solid var(--border-color,#e5e7eb)">
          <th style="padding:0.5rem">Date</th>${withUser ? '<th>User</th>' : ''}<th>Sale</th><th>Commission</th><th>Status</th></tr></thead>
        <tbody>${commissions.map(c => `
          <tr style="border-bottom:1px solid var(--border-color,#e5e7eb)">
            <td style="padding:0.5rem">${new Date(c.createdAt).toLocaleDateString()}</td>
            ${withUser ? `<td>${utils.escapeHtml(c.user ? c.user.name || c.user.email : '')}</td>` : ''}
            <td>${utils.formatCurrency(c.saleAmount)}</td>
            <td><strong>${utils.formatCurrency(c.commissionAmount)}</strong></td>
            <td><span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${c.status}</span></td></tr>`).join('')}</tbody>
      </table></div>` : '<p class="text-muted">No commissions recorded yet.</p>'}
    </div>`;
};

// ==================== INTEGRATIONS (Social + Advertising) ====================
App.prototype.renderIntegrations = async function() {
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Integrations</h1>
    <p class="page-subtitle">Connect your social media accounts for publishing</p></div></div>
    <div id="integrations-content"><div class="text-center" style="padding:2rem"><div class="spinner"></div></div></div>
  `);
  const root = document.getElementById('integrations-content');
  try {
    const [accountsRes, platformsRes, adsRes] = await Promise.all([
      window.api.getSocialAccounts(), window.api.getSocialPlatforms(), window.api.getAdvertisingAccounts(),
    ]);
    const accounts = accountsRes.data || [];
    const platforms = platformsRes.data || [];
    const ads = adsRes.data || [];
    const statusBadge = (connected) => connected
      ? '<span class="badge" style="background:#e8f7ee;color:#1a7f4b">CONNECTED</span>'
      : '<span class="badge" style="background:var(--bg-tertiary,#eef0f3)">NOT CONNECTED</span>';
    const icons = { facebook: 'ri-facebook-circle-fill', instagram: 'ri-instagram-fill', tiktok: 'ri-music-2-fill', x: 'ri-twitter-x-fill', linkedin: 'ri-linkedin-fill', youtube: 'ri-youtube-fill', pinterest: 'ri-pinterest-fill' };
    root.innerHTML = `
      <h3 style="margin-bottom:0.8rem"><i class="ri-share-line"></i> Social Media Accounts</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-bottom:2rem">
        ${platforms.filter(pl => pl.status === 'available').map(pl => {
          const acct = accounts.find(a => a.provider === pl.platform);
          const connected = acct && acct.status === 'connected';
          return `<div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">
              <div style="display:flex;gap:0.6rem;align-items:center">
                <i class="${icons[pl.platform] || 'ri-share-line'}" style="font-size:1.6rem"></i>
                <strong>${pl.name}</strong></div>
              ${statusBadge(connected)}
            </div>
            ${connected ? `<p class="text-muted" style="font-size:0.85rem">@${utils.escapeHtml(acct.accountUsername || acct.accountName || 'account')}</p>` : '<p class="text-muted" style="font-size:0.85rem">Connect to publish promotions directly.</p>'}
            <div style="display:flex;gap:0.5rem;margin-top:0.6rem">
              ${connected
                ? `<button class="btn btn-sm btn-secondary" data-reconn="${acct.id}"><i class="ri-refresh-line"></i> Reconnect</button>
                   <button class="btn btn-sm btn-danger" data-disc="${acct.id}"><i class="ri-link-unlink"></i> Disconnect</button>`
                : `<button class="btn btn-sm btn-primary" data-conn="${pl.platform}"><i class="ri-plug-line"></i> Connect</button>`}
            </div>
          </div>`;
        }).join('')}
      </div>
      <h3 style="margin-bottom:0.8rem"><i class="ri-advertisement-line"></i> Advertising Accounts</h3>
      <div class="alert alert-info" style="font-size:0.85rem;margin-bottom:0.8rem">
        <i class="ri-information-line"></i> Advertising integrations are coming soon. You will connect your own ad accounts — the platform will not handle ad billing.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">
        ${ads.map(a => `<div class="card" style="opacity:0.75">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;gap:0.6rem;align-items:center"><i class="ri-advertisement-line" style="font-size:1.4rem"></i><strong>${a.name}</strong></div>
            <span class="badge" style="background:#e3f2fd;color:#1565c0">COMING SOON</span></div>
        </div>`).join('')}
      </div>
      <p class="text-muted" style="font-size:0.78rem;margin-top:1.5rem">
        <i class="ri-shield-check-line"></i> Access tokens are encrypted and stored securely server-side — they are never exposed to your browser.</p>`;
    root.querySelectorAll('[data-conn]').forEach(b => b.onclick = async () => {
      try {
        await window.api.connectSocial(b.dataset.conn);
        utils.toast('success', 'Account connected', b.dataset.conn + ' is ready for publishing (demo mode)');
        this.renderIntegrations();
      } catch (err) { utils.toast('error', 'Connect failed', err.message); }
    });
    root.querySelectorAll('[data-disc]').forEach(b => b.onclick = async () => {
      try { await window.api.disconnectSocial(b.dataset.disc); utils.toast('success', 'Disconnected', ''); this.renderIntegrations(); }
      catch (err) { utils.toast('error', 'Disconnect failed', err.message); }
    });
    root.querySelectorAll('[data-reconn]').forEach(b => b.onclick = async () => {
      try { await window.api.reconnectSocial(b.dataset.reconn); utils.toast('success', 'Reconnected', ''); this.renderIntegrations(); }
      catch (err) { utils.toast('error', 'Reconnect failed', err.message); }
    });
  } catch (err) { root.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`; }
};

// ==================== ADMIN DASHBOARD ====================
App.prototype.renderAdmin = async function() {
  const user = this.store.get('user');
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    this.renderLayout(`<div class="empty-state"><i class="ri-lock-line"></i><p>Admin access required.</p></div>`);
    return;
  }
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Admin Dashboard</h1>
    <p class="page-subtitle">Platform management — providers, commissions, withdrawals, users</p></div></div>
    <div id="admin-content"><div class="text-center" style="padding:2rem"><div class="spinner"></div></div></div>
  `);
  const root = document.getElementById('admin-content');
  try {
    const [dashRes, commRes, wdRes, usersRes, logsRes] = await Promise.all([
      window.api.getAdminDashboard(), window.api.getAdminCommissions(),
      window.api.getAdminWithdrawals(), window.api.getAdminUsers(), window.api.getAuditLogFeed(),
    ]);
    const d = dashRes.data;
    const commissions = commRes.data || [];
    const withdrawals = wdRes.data || [];
    const users = usersRes.data || [];
    const logs = logsRes.data || [];
    const confirmedTotal = ((d.commissions || {}).confirmed || {}).total || 0;
    const pendingWdCount = ((d.withdrawals || {}).pending || {}).count || 0;
    root.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1rem;margin-bottom:1.5rem">
        ${[['Users', d.users], ['Affiliate Products', d.products], ['Promotions', d.promotions],
           ['Confirmed Earnings', utils.formatCurrency(confirmedTotal)],
           ['Pending Withdrawals', pendingWdCount]]
          .map(([l, v]) => `<div class="card"><span class="text-muted" style="font-size:0.82rem">${l}</span>
            <div style="font-size:1.4rem;font-weight:700">${v}</div></div>`).join('')}
      </div>
      <div id="admin-withdrawals" style="margin-bottom:1.2rem"></div>
      <div id="admin-commissions" style="margin-bottom:1.2rem"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="admin-grid">
        <div class="card"><h3 style="margin-bottom:0.6rem"><i class="ri-user-line"></i> Users</h3>
          <div id="admin-users"></div></div>
        <div class="card"><h3 style="margin-bottom:0.6rem"><i class="ri-file-shield-line"></i> Audit Log</h3>
          <div style="max-height:300px;overflow-y:auto;font-size:0.82rem">${logs.length ? logs.map(l => `
            <div style="padding:0.4rem 0;border-bottom:1px solid var(--border-color,#e5e7eb)">
              <strong>${utils.escapeHtml(l.action)}</strong>
              <span class="text-muted">· ${l.actor ? utils.escapeHtml(l.actor.name || l.actor.email) : 'system'} · ${new Date(l.createdAt).toLocaleString()}</span></div>`).join('') : '<p class="text-muted">No audit entries yet.</p>'}</div></div>
      </div>
      <style>@media(max-width:800px){.admin-grid{grid-template-columns:1fr !important}}</style>`;
    this.renderAdminWithdrawals(document.getElementById('admin-withdrawals'), withdrawals);
    this.renderAdminCommissions(document.getElementById('admin-commissions'), commissions);
    this.renderAdminUsers(document.getElementById('admin-users'), users);
  } catch (err) {
    root.innerHTML = err.message.includes('403')
      ? '<div class="empty-state"><i class="ri-lock-line"></i><p>Admin access required.</p></div>'
      : `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
};

// ---- Admin sub-renderers ----
App.prototype.renderAdminWithdrawals = function(el, withdrawals) {
  el.innerHTML = `<div class="card"><h3 style="margin-bottom:0.6rem"><i class="ri-bank-card-line"></i> Withdrawal Requests</h3>
    ${withdrawals.length ? withdrawals.map(w => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.6rem;padding:0.6rem 0;border-bottom:1px solid var(--border-color,#e5e7eb);flex-wrap:wrap">
        <div><strong>${utils.formatCurrency(w.amount)} ${w.currency}</strong>
          <span class="text-muted" style="font-size:0.85rem">· ${utils.escapeHtml(w.user ? (w.user.name || w.user.email) : 'Unknown')} · ${w.payoutMethod}</span></div>
        <div style="display:flex;gap:0.4rem;align-items:center">
          <span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${w.status}</span>
          ${w.status === 'pending' ? `<button class="btn btn-sm btn-primary" data-wd-approve="${w.id}">Approve</button>
            <button class="btn btn-sm btn-secondary" data-wd-reject="${w.id}">Reject</button>` : ''}
          ${['approved', 'processing'].includes(w.status) ? `<button class="btn btn-sm btn-primary" data-wd-paid="${w.id}">Mark Paid</button>` : ''}
        </div>
      </div>`).join('') : '<p class="text-muted" style="padding:0.5rem 0">No withdrawal requests.</p>'}</div>`;
  el.querySelectorAll('[data-wd-approve]').forEach(b => b.onclick = () => this.adminWithdrawalAction(b.dataset.wdApprove, 'approve'));
  el.querySelectorAll('[data-wd-reject]').forEach(b => b.onclick = () => this.adminWithdrawalAction(b.dataset.wdReject, 'reject'));
  el.querySelectorAll('[data-wd-paid]').forEach(b => b.onclick = () => this.adminWithdrawalAction(b.dataset.wdPaid, 'mark_paid'));
};

App.prototype.adminWithdrawalAction = async function(id, action) {
  let extra = {};
  if (action === 'mark_paid') {
    const ref = prompt('Payment reference (optional):');
    if (ref === null) return;
    extra = { paymentRef: ref };
  }
  try {
    await window.api.reviewWithdrawal(id, action, extra);
    utils.toast('success', 'Withdrawal updated', `Action: ${action}`);
    this.renderAdmin();
  } catch (err) { utils.toast('error', 'Error', err.message); }
};

App.prototype.renderAdminCommissions = function(el, commissions) {
  el.innerHTML = `<div class="card"><h3 style="margin-bottom:0.6rem"><i class="ri-coins-line"></i> Commissions</h3>
    ${commissions.length ? `<div style="overflow-x:auto"><table style="width:100%;font-size:0.85rem;border-collapse:collapse">
      <thead><tr class="text-muted" style="text-align:left">
        <th style="padding:0.4rem">User</th><th>Product</th><th>Amount</th><th>Status</th><th></th></tr></thead>
      <tbody>${commissions.slice(0, 10).map(c => `
        <tr style="border-top:1px solid var(--border-color,#e5e7eb)">
          <td style="padding:0.5rem 0.4rem">${utils.escapeHtml(c.user ? (c.user.name || c.user.email) : 'Unknown')}</td>
          <td>${utils.escapeHtml((c.product ? c.product.title : '').slice(0, 28))}</td>
          <td><strong>${utils.formatCurrency(c.userShare)} ${c.currency}</strong></td>
          <td><span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${c.status}</span></td>
          <td>${c.status === 'pending' ? `<button class="btn btn-sm btn-primary" data-c-confirm="${c.id}">Confirm</button>
              <button class="btn btn-sm btn-secondary" data-c-reject="${c.id}">Reject</button>` : ''}</td>
        </tr>`).join('')}</tbody></table></div>`
      : '<p class="text-muted" style="padding:0.5rem 0">No commissions recorded.</p>'}</div>`;
  el.querySelectorAll('[data-c-confirm]').forEach(b => b.onclick = async () => {
    try { await window.api.confirmCommission(b.dataset.cConfirm); utils.toast('success', 'Commission confirmed', 'Moved to user AVAILABLE balance'); this.renderAdmin(); }
    catch (err) { utils.toast('error', 'Error', err.message); }
  });
  el.querySelectorAll('[data-c-reject]').forEach(b => b.onclick = async () => {
    try { await window.api.rejectCommission(b.dataset.cReject, 'Rejected by admin'); utils.toast('success', 'Commission rejected'); this.renderAdmin(); }
    catch (err) { utils.toast('error', 'Error', err.message); }
  });
};

App.prototype.renderAdminUsers = function(el, users) {
  el.innerHTML = users.map(u => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border-color,#e5e7eb)">
      <div><strong>${utils.escapeHtml(u.name || u.email)}</strong>
        <span class="text-muted" style="font-size:0.82rem">${utils.escapeHtml(u.email)} · ${u.role}</span></div>
      <button class="btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}" data-u-toggle="${u.id}" data-active="${u.isActive}">
        ${u.isActive ? 'Deactivate' : 'Activate'}</button>
    </div>`).join('');
  el.querySelectorAll('[data-u-toggle]').forEach(b => b.onclick = async () => {
    try {
      await window.api.request('PATCH', `/admin/users/${b.dataset.uToggle}/status`, { isActive: b.dataset.active !== 'true' });
      utils.toast('success', 'User updated'); this.renderAdmin();
    } catch (err) { utils.toast('error', 'Error', err.message); }
  });
};