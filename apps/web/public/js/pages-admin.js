/**
 * Affiliate Commerce Pages (2/2)
 * Admin management, Integrations (social + advertising), navigation wiring.
 */

// ==================== ADMIN PAGE ====================
App.prototype.renderAdmin = async function() {
  this.renderLayout(`<div style="text-align:center;padding:3rem"><div class="spinner"></div></div>`);
  let dash, users, commissions, withdrawals, audit;
  try {
    [dash, users, commissions, withdrawals, audit] = await Promise.all([
      window.api.getAdminDashboard(), window.api.getAdminUsers(),
      window.api.getAdminCommissions(), window.api.getAdminWithdrawals(),
      window.api.getAuditLogFeed(),
    ]);
  } catch (err) {
    this.renderLayout(`<div class="alert alert-danger"><i class="ri-lock-line"></i> ${err.message}</div>`);
    return;
  }
  const d = dash.data; const fmt = utils.formatCurrency;
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Admin Dashboard</h1>
    <p class="page-subtitle">Affiliate providers, commissions, withdrawals & users</p></div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Users</div><div class="stat-value">${d.users}</div></div>
      <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">${d.products}</div></div>
      <div class="stat-card"><div class="stat-label">Promotions</div><div class="stat-value">${d.promotions}</div></div>
      <div class="stat-card"><div class="stat-label">Pending Earnings</div><div class="stat-value" style="color:#b8860b">${fmt((d.commissions.pending || {}).total || 0)}</div></div>
    </div>
    <div id="admin-sections" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:1.5rem">
      <div class="card">
        <h3 style="margin-top:0"><i class="ri-plug-line"></i> Affiliate Providers</h3>
        <p class="text-muted" style="font-size:0.8rem">Master accounts are platform-controlled. Users never connect affiliate accounts.</p>
        <button class="btn btn-primary btn-block" id="admin-sync-btn"><i class="ri-refresh-line"></i> Sync All Providers</button>
        <div id="admin-sync-result" style="margin-top:0.5rem;font-size:0.8rem"></div>
      </div>
      <div class="card" id="admin-commissions-card"></div>
      <div class="card" id="admin-withdrawals-card"></div>
      <div class="card" id="admin-users-card"></div>
      <div class="card" id="admin-audit-card" style="grid-column:1/-1"></div>
    </div>`);
  this.adminInit(dash, users, commissions, withdrawals, audit);
};

// Admin page interactions
App.prototype.adminInit = function(dash, users, commissions, withdrawals, audit) {
  const d = dash.data; const fmt = utils.formatCurrency;
  document.getElementById('admin-commissions-card').innerHTML = `
    <h3 style="margin-top:0"><i class="ri-coins-line"></i> Commission Management</h3>
    ${commissions.data.length ? `<div style="max-height:260px;overflow-y:auto">` + commissions.data.map(c => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border-color,#eee);font-size:0.82rem">
        <div>${utils.escapeHtml(c.user?.email || 'unknown')}<div class="text-muted">${fmt(c.userShare)} · ${utils.escapeHtml(c.status)}</div></div>
        <div style="display:flex;gap:0.3rem">
          ${c.status === 'pending' || c.status === 'estimated' ? `
            <button class="btn btn-sm btn-primary" data-confirm="${c.id}">Confirm</button>
            <button class="btn btn-sm btn-danger" data-reject="${c.id}">Reject</button>` : `<span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${c.status}</span>`}
        </div>
      </div>`).join('') + `</div>` : '<p class="text-muted">No commissions yet.</p>'}`;
  document.getElementById('admin-withdrawals-card').innerHTML = `
    <h3 style="margin-top:0"><i class="ri-bank-line"></i> Withdrawal Requests</h3>
    ${withdrawals.data.length ? `<div style="max-height:260px;overflow-y:auto">` + withdrawals.data.map(wd => `
      <div style="padding:0.4rem 0;border-bottom:1px solid var(--border-color,#eee);font-size:0.82rem">
        <div style="display:flex;justify-content:space-between"><strong>${fmt(wd.amount)}</strong>
        <span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${wd.status}</span></div>
        <div class="text-muted">${utils.escapeHtml(wd.user?.email || '')} · ${utils.escapeHtml(wd.payoutMethod)}</div>
        ${wd.status === 'pending' ? `<div style="display:flex;gap:0.3rem;margin-top:0.3rem">
          <button class="btn btn-sm btn-primary" data-wd="approve" data-id="${wd.id}">Approve</button>
          <button class="btn btn-sm btn-danger" data-wd="reject" data-id="${wd.id}">Reject</button></div>` : ''}
        ${wd.status === 'approved' ? `<button class="btn btn-sm btn-primary" data-wd="mark_paid" data-id="${wd.id}" style="margin-top:0.3rem">Mark Paid</button>` : ''}
      </div>`).join('') + `</div>` : '<p class="text-muted">No withdrawal requests.</p>'}`;
  document.getElementById('admin-users-card').innerHTML = `
    <h3 style="margin-top:0"><i class="ri-user-settings-line"></i> Users</h3>
    ${users.data.map(u => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px solid var(--border-color,#eee);font-size:0.82rem">
        <div>${utils.escapeHtml(u.email)}<div class="text-muted">${u.role}</div></div>
        <span class="badge" style="background:${u.isActive ? '#e8f7ee;color:#1a7f4b' : '#fdecea;color:#dc3545'}">${u.isActive ? 'ACTIVE' : 'DISABLED'}</span>
      </div>`).join('')}`;
  document.getElementById('admin-audit-card').innerHTML = `
    <h3 style="margin-top:0"><i class="ri-shield-check-line"></i> Recent Audit Logs</h3>
    ${audit.data.length ? audit.data.map(l => `
      <div style="padding:0.35rem 0;border-bottom:1px solid var(--border-color,#eee);font-size:0.8rem">
        <strong>${utils.escapeHtml(l.action)}</strong> by ${utils.escapeHtml(l.actor?.email || 'system')}
        <span class="text-muted">· ${new Date(l.createdAt).toLocaleString()}</span>
      </div>`).join('') : '<p class="text-muted">No audit entries yet.</p>'}`;
  document.getElementById('admin-sync-btn').onclick = async () => {
    const btn = document.getElementById('admin-sync-btn'); btn.disabled = true;
    try {
      await window.api.syncAffiliate();
      document.getElementById('admin-sync-result').textContent = 'Sync complete';
      utils.toast('success', 'Sync complete', 'Product catalogue updated');
      setTimeout(() => this.renderAdmin(), 800);
    } catch (err) { utils.toast('error', 'Sync failed', err.message); btn.disabled = false; }
  };
  document.querySelectorAll('[data-confirm]').forEach(b => b.onclick = async () => {
    try { await window.api.confirmCommission(b.dataset.confirm); utils.toast('success', 'Commission confirmed', 'Moved to AVAILABLE balance'); this.renderAdmin(); }
    catch (err) { utils.toast('error', 'Failed', err.message); }
  });
  document.querySelectorAll('[data-reject]').forEach(b => b.onclick = async () => {
    try { await window.api.rejectCommission(b.dataset.reject); utils.toast('info', 'Commission rejected', 'Wallet entries reversed'); this.renderAdmin(); }
    catch (err) { utils.toast('error', 'Failed', err.message); }
  });
  document.querySelectorAll('[data-wd]').forEach(b => b.onclick = async () => {
    try { await window.api.reviewWithdrawal(b.dataset.id, b.dataset.wd); utils.toast('success', 'Withdrawal updated', b.dataset.wd); this.renderAdmin(); }
    catch (err) { utils.toast('error', 'Failed', err.message); }
  });
};

// ==================== INTEGRATIONS PAGE ====================
App.prototype.renderIntegrations = async function() {
  this.renderLayout(`<div style="text-align:center;padding:3rem"><div class="spinner"></div></div>`);
  let accounts, platforms, ads;
  try {
    [accounts, platforms, ads] = await Promise.all([
      window.api.getSocialAccounts(), window.api.getSocialPlatforms(), window.api.getAdvertisingAccounts(),
    ]);
  } catch (err) {
    this.renderLayout(`<div class="alert alert-danger">${err.message}</div>`);
    return;
  }
  const connected = accounts.data || [];
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Integrations</h1>
    <p class="page-subtitle">Connect your social media accounts for publishing</p></div></div>
    <div class="alert alert-info" style="font-size:0.85rem">
      <i class="ri-shield-check-line"></i> Access tokens are encrypted and stored server-side — they are never exposed to your browser.
      <span class="badge" style="background:#fff3cd;color:#856404;margin-left:0.5rem">DEMO MODE</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem" id="integrations-grid"></div>
    <div class="card" style="margin-top:1.5rem">
      <h3 style="margin-top:0"><i class="ri-advertisement-line"></i> Advertising <span class="badge" style="background:#e7f1ff;color:#0d6efd">COMING SOON</span></h3>
      <p class="text-muted" style="font-size:0.85rem">You will connect your own ad accounts (e.g. Meta Ads). The platform will help create campaigns, generate ad creatives and copy, and monitor performance. The platform does not handle ad billing.</p>
      <div id="advertising-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.75rem"></div>
    </div>`);
  const grid = document.getElementById('integrations-grid');
  grid.innerHTML = platforms.data.map(pl => {
    const acc = connected.find(a => a.provider === pl.platform && a.status === 'connected');
    const isAvail = pl.status === 'available';
    const statusBadge = acc
      ? `<span class="badge" style="background:#e8f7ee;color:#1a7f4b">CONNECTED</span>`
      : `<span class="badge" style="background:var(--bg-tertiary,#eef0f3);color:var(--text-secondary)">${isAvail ? 'NOT CONNECTED' : 'COMING SOON'}</span>`;
    return `<div class="card" style="display:flex;flex-direction:column;gap:0.5rem">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <strong><i class="ri-${pl.platform === 'facebook' ? 'facebook' : pl.platform === 'instagram' ? 'instagram' : 'music-2'}-fill" style="font-size:1.2rem"></i> ${pl.name}</strong>
        ${statusBadge}
      </div>
      ${acc ? `<div class="text-muted" style="font-size:0.8rem">@${utils.escapeHtml(acc.accountUsername || acc.accountName || 'account')} · connected ${new Date(acc.connectedAt).toLocaleDateString()}</div>` : ''}
      <div style="margin-top:auto;display:flex;gap:0.4rem">
        ${isAvail && !acc ? `<button class="btn btn-primary btn-sm btn-block" data-connect="${pl.platform}"><i class="ri-link"></i> Connect</button>` : ''}
        ${isAvail && acc ? `<button class="btn btn-secondary btn-sm btn-block" data-reconnect="${acc.id}"><i class="ri-refresh-line"></i> Reconnect</button>
          <button class="btn btn-danger btn-sm" data-disconnect="${acc.id}"><i class="ri-link-unlink"></i></button>` : ''}
        ${!isAvail ? `<button class="btn btn-secondary btn-sm btn-block" disabled>COMING SOON</button>` : ''}
      </div>
    </div>`;
  }).join('');
  document.getElementById('advertising-list').innerHTML = ads.data.map(a => `
    <div style="border:1px solid var(--border-color,#eee);border-radius:8px;padding:0.75rem;display:flex;justify-content:space-between;align-items:center">
      <strong style="font-size:0.9rem">${a.name}</strong>
      <span class="badge" style="background:#e7f1ff;color:#0d6efd">COMING SOON</span>
    </div>`).join('');
  grid.querySelectorAll('[data-connect]').forEach(b => b.onclick = async () => {
    try { await window.api.connectSocial(b.dataset.connect); utils.toast('success', 'Connected', `${b.dataset.connect} connected (demo mode)`); this.renderIntegrations(); }
    catch (err) { utils.toast('error', 'Failed', err.message); }
  });
  grid.querySelectorAll('[data-reconnect]').forEach(b => b.onclick = async () => {
    try { await window.api.reconnectSocial(b.dataset.reconnect); utils.toast('success', 'Reconnected', 'Account token refreshed'); this.renderIntegrations(); }
    catch (err) { utils.toast('error', 'Failed', err.message); }
  });
  grid.querySelectorAll('[data-disconnect]').forEach(b => b.onclick = async () => {
    try { await window.api.disconnectSocial(b.dataset.disconnect); utils.toast('info', 'Disconnected', 'Account removed'); this.renderIntegrations(); }
    catch (err) { utils.toast('error', 'Failed', err.message); }
  });
};