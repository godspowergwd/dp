/**
 * Affiliate Commerce Pages (2/2)
 * Earnings wallet → Integrations (social + advertising) → Admin management
 */

// Shared status badge helper for earnings/admin pages
App.prototype.statusBadge = function(s) {
  const map = { estimated: 'warning', pending: 'info', confirmed: 'success', paid: 'success',
    rejected: 'danger', completed: 'success', reversed: 'secondary', approved: 'info',
    processing: 'info', failed: 'danger', published: 'success', draft: 'secondary',
    generating: 'warning', ready: 'info', scheduled: 'info', archived: 'secondary' };
  return `<span class="badge badge-${map[s] || 'secondary'}">${utils.formatStatus(s)}</span>`;
};

// ==================== EARNINGS / WALLET PAGE ====================
App.prototype.renderEarnings = async function() {
  this.renderLayout(`
    <div class="page-header">
      <div><h1 class="page-title">Earnings</h1>
      <p class="page-subtitle">Track commissions and request withdrawals</p></div>
      <button class="btn btn-primary" id="withdraw-btn"><i class="ri-bank-line"></i> Request Withdrawal</button>
    </div>
    <div id="wallet-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
      <div style="text-align:center;padding:2rem"><div class="spinner"></div></div>
    </div>
    <div class="card" style="margin-top:1.25rem">
      <div style="display:flex;gap:0.5rem;border-bottom:1px solid #eee;padding:0.5rem 0.75rem;flex-wrap:wrap" id="earnings-tabs">
        <button class="btn btn-sm btn-secondary" data-etab="commissions">Commissions</button>
        <button class="btn btn-sm btn-secondary" data-etab="transactions">Transactions</button>
        <button class="btn btn-sm btn-secondary" data-etab="withdrawals">Withdrawals</button>
      </div>
      <div id="earnings-body" style="padding:1rem;overflow-x:auto"></div>
    </div>
  `);
  window._earningsFmt = (v) => utils.formatCurrency(v);
  window._earningsEsc = utils.escapeHtml;
  try {
    const wallet = (await window.api.getWallet()).data;
    const cards = [
      ['Estimated Earnings', wallet.estimated, '#fff7e0', '#9a6b00', 'ri-lightbulb-line', 'Potential earnings from product commission data'],
      ['Pending', wallet.pending, '#eef4ff', '#3b5bdb', 'ri-time-line', 'Detected sales not yet confirmed'],
      ['Available', wallet.available, '#e8f7ee', '#1a7f4b', 'ri-wallet-3-line', 'Confirmed earnings ready for payout'],
      ['Total Paid', wallet.paid, '#f3e8ff', '#7c3aed', 'ri-bank-line', 'Earnings paid out to you'],
    ];
    document.getElementById('wallet-cards').innerHTML = cards.map(([label, val, bg, color, icon, tip]) => `
      <div class="card" style="background:${bg}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:0.8rem;color:${color};font-weight:600">${label}</div>
            <div style="font-size:1.5rem;font-weight:800;color:${color};margin-top:0.25rem">${window._earningsFmt(val)}</div>
            <div style="font-size:0.72rem;color:${color};opacity:0.8;margin-top:0.3rem">${tip}</div>
          </div>
          <i class="${icon}" style="font-size:1.6rem;color:${color};opacity:0.6"></i>
        </div>
      </div>`).join('');
  } catch (err) {
    document.getElementById('wallet-cards').innerHTML = `<p class="text-danger">${err.message}</p>`;
  }
  window._earningsLoaders = {};
    window._earningsLoaders.commissions = async () => {
    const rows = (await window.api.getCommissions()).data || [];
    document.getElementById('earnings-body').innerHTML = !rows.length
      ? '<div class="empty-state"><p>No commissions yet. Promote products to start earning.</p></div>'
      : `<table class="table"><thead><tr><th>Date</th><th>Product</th><th>Provider</th><th>Sale</th><th>Commission</th><th>Status</th></tr></thead><tbody>
        ${rows.map(c => `<tr><td>${utils.formatDate(c.createdAt)}</td><td>${window._earningsEsc(c.product?.title || '—')}</td>
        <td>${window._earningsEsc((c.provider?.name || '').toUpperCase())}</td><td>${window._earningsFmt(c.saleAmount)}</td>
        <td><strong>${window._earningsFmt(c.userShare)}</strong></td><td>${this.statusBadge(c.status)}</td></tr>`).join('')}</tbody></table>`;
  };
  window._earningsLoaders.transactions = async () => {
    const rows = (await window.api.getWalletTransactions()).data || [];
    document.getElementById('earnings-body').innerHTML = !rows.length
      ? '<div class="empty-state"><p>No transactions yet.</p></div>'
      : `<table class="table"><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>
        ${rows.map(t => `<tr><td>${utils.formatDate(t.createdAt)}</td><td>${utils.formatStatus(t.type)}</td>
        <td style="max-width:280px">${window._earningsEsc(t.description || '')}</td>
        <td style="color:${Number(t.amount) >= 0 ? '#1a7f4b' : '#c0392b'};font-weight:700">${Number(t.amount) >= 0 ? '+' : ''}${window._earningsFmt(t.amount)}</td>
        <td>${this.statusBadge(t.status)}</td></tr>`).join('')}</tbody></table>`;
  };
  window._earningsLoaders.withdrawals = async () => {
    const rows = (await window.api.getWithdrawals()).data || [];
    document.getElementById('earnings-body').innerHTML = !rows.length
      ? '<div class="empty-state"><p>No withdrawal requests yet.</p></div>'
      : `<table class="table"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Reference</th></tr></thead><tbody>
        ${rows.map(w => `<tr><td>${utils.formatDate(w.createdAt)}</td><td><strong>${window._earningsFmt(w.amount)}</strong></td>
        <td>${utils.formatStatus(w.payoutMethod)}</td><td>${this.statusBadge(w.status)}</td>
        <td>${window._earningsEsc(w.paymentRef || '—')}</td></tr>`).join('')}</tbody></table>`;
  };
  document.querySelectorAll('#earnings-tabs [data-etab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('#earnings-tabs [data-etab]').forEach(b => b.classList.remove('btn-primary'));
      btn.classList.add('btn-primary');
      document.getElementById('earnings-body').innerHTML = '<div style="text-align:center;padding:1.5rem"><div class="spinner"></div></div>';
      try { await window._earningsLoaders[btn.dataset.etab](); }
      catch (err) { document.getElementById('earnings-body').innerHTML = `<p class="text-danger">${err.message}</p>`; }
    });
  });
  document.querySelector('#earnings-tabs [data-etab="commissions"]').classList.add('btn-primary');
  window._earningsLoaders.commissions().catch(e => {
    document.getElementById('earnings-body').innerHTML = `<p class="text-danger">${e.message}</p>`;
  });
  // __PART3__
};