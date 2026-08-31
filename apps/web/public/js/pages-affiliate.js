/**
 * Affiliate Commerce Pages (1/2)
 * Marketplace â†’ Product detail â†’ Promote â†’ AI Studio â†’ Promotions
 */

// ==================== PRODUCTS (Affiliate Marketplace) ====================
App.prototype.renderProducts = async function() {
  this.renderLayout(`
    <div class="page-header">
      <div><h1 class="page-title">Affiliate Products</h1>
      <p class="page-subtitle">Browse products from the platform's affiliate networks</p></div>
      <button class="btn btn-secondary" id="sync-btn"><i class="ri-refresh-line"></i> Sync Products</button>
    </div>
    <div class="alert alert-info" style="font-size:0.85rem">
      <i class="ri-information-line"></i> Commission values are <strong>estimates</strong> until confirmed by the affiliate network.
      <span class="badge" style="background:#fff3cd;color:#856404;margin-left:0.5rem">DEMO DATA</span>
    </div>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      <input class="form-input" id="product-search" placeholder="Search products..." style="flex:1;min-width:160px">
      <select class="form-select" id="filter-provider" style="width:auto"><option value="">All Providers</option></select>
      <select class="form-select" id="filter-category" style="width:auto"><option value="">All Categories</option></select>
      <select class="form-select" id="filter-sort" style="width:auto">
        <option value="popularity">Most Popular</option>
        <option value="price">Price</option>
        <option value="commission">Commission</option>
      </select>
    </div>
    <div id="products-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem">
      <div style="grid-column:1/-1;text-align:center;padding:2rem"><div class="spinner"></div></div>
    </div>
    <div id="products-more" class="text-center" style="margin-top:1.5rem"></div>
  `);
  try {
    const [provRes, catRes] = await Promise.all([window.api.getAffiliateProviders(), window.api.getAffiliateCategories()]);
    const provSel = document.getElementById('filter-provider');
    (provRes.data || []).forEach(p => {
      const o = document.createElement('option'); o.value = p.name;
      o.textContent = p.name.toUpperCase() + (p.mode === 'demo' ? ' (demo)' : ''); provSel.appendChild(o);
    });
    const catSel = document.getElementById('filter-category');
    (catRes.data || []).forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o); });
  } catch { /* filters are optional */ }
  let offset = 0; const limit = 24;
  const load = async (append = false) => {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    if (!append) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem"><div class="spinner"></div></div>';
    try {
      const params = {
        search: document.getElementById('product-search').value,
        provider: document.getElementById('filter-provider').value,
        category: document.getElementById('filter-category').value,
        sortBy: document.getElementById('filter-sort').value,
        limit, offset,
      };
      const res = await window.api.getAffiliateProducts(params);
      const products = res.data || [];
      if (!append) grid.innerHTML = '';
      if (!products.length && !append) {
        grid.innerHTML = '<div style="grid-column:1/-1" class="empty-state"><i class="ri-archive-line"></i><p>No products found. Click <strong>Sync Products</strong> to fetch the catalogue.</p></div>';
      }
      products.forEach(p => this.appendProductCard(grid, p));
      offset += products.length;
      const more = document.getElementById('products-more');
      if (more) {
        more.innerHTML = products.length === limit ? '<button class="btn btn-secondary" id="load-more-btn">Load More</button>' : '';
        const moreBtn = document.getElementById('load-more-btn');
        if (moreBtn) moreBtn.onclick = () => load(true);
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1" class="empty-state"><p class="text-danger">${err.message}</p></div>`;
    }
  };
  document.getElementById('sync-btn').onclick = async () => {
    const btn = document.getElementById('sync-btn'); btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block"></span> Syncing...';
    try {
      await window.api.syncAffiliate(); utils.toast('success', 'Sync complete', 'Product catalogue updated');
      offset = 0; await load();
    } catch (err) { utils.toast('error', 'Sync failed', err.message); }
    btn.disabled = false; btn.innerHTML = '<i class="ri-refresh-line"></i> Sync Products';
  };
  ['filter-provider', 'filter-category', 'filter-sort'].forEach(id =>
    document.getElementById(id).addEventListener('change', () => { offset = 0; load(); }));
  let searchTimer;
  document.getElementById('product-search').addEventListener('input', () => {
    clearTimeout(searchTimer); searchTimer = setTimeout(() => { offset = 0; load(); }, 400);
  });
  await load();
};

// Product card renderer (shared by grid)
App.prototype.appendProductCard = function(grid, p) {
  const img = (p.images && p.images[0]) || '';
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'padding:0;overflow:hidden;cursor:pointer;display:flex;flex-direction:column';
  card.innerHTML = `
    <div style="height:150px;background:#eef0f3;display:flex;align-items:center;justify-content:center;overflow:hidden">
      ${img ? `<img src="${utils.escapeHtml(img)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : '<i class="ri-image-line" style="font-size:2.5rem;opacity:0.3"></i>'}
    </div>
    <div style="padding:0.9rem;display:flex;flex-direction:column;gap:0.4rem;flex:1">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="badge" style="background:#eef0f3;color:var(--text-secondary,#555)">${utils.escapeHtml((p.provider || '').toUpperCase())}</span>
        ${p.discount ? `<span class="badge" style="background:#e8f7ee;color:#1a7f4b">-${p.discount}%</span>` : ''}
      </div>
      <strong style="font-size:0.92rem;line-height:1.3;flex:1">${utils.escapeHtml(p.title)}</strong>
      <div style="font-weight:700">${utils.formatCurrency(p.price)} ${p.currency || ''}</div>
      <div style="font-size:0.82rem;color:#1a7f4b"><i class="ri-coins-line"></i> Est. commission: <strong>${utils.formatCurrency(p.estimatedCommission)}</strong></div>
      <button class="btn btn-primary btn-sm" data-promote="${p.id}" style="margin-top:0.3rem;width:100%"><i class="ri-rocket-line"></i> Promote</button>
    </div>`;
  card.querySelector('[data-promote]').addEventListener('click', (e) => { e.stopPropagation(); this.promoteProduct(p.id); });
  card.addEventListener('click', () => this.showAffiliateProductModal(p.id));
  grid.appendChild(card);
};

// Product detail modal
App.prototype.showAffiliateProductModal = async function(id) {
  try {
    const p = (await window.api.getAffiliateProduct(id)).data;
    const imgs = p.images || [];
    utils.showModal(p.title, `
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <div style="flex:0 0 200px">
          <img src="${utils.escapeHtml(imgs[0] || '')}" style="width:200px;height:200px;object-fit:cover;border-radius:8px;background:#eef0f3">
          ${imgs.length > 1 ? `<div style="display:flex;gap:4px;margin-top:6px">${imgs.slice(1, 5).map(i => `<img src="${utils.escapeHtml(i)}" style="width:44px;height:44px;object-fit:cover;border-radius:4px">`).join('')}</div>` : ''}
        </div>
        <div style="flex:1;min-width:220px">
          <p><span class="badge" style="background:#eef0f3">${utils.escapeHtml((p.provider || '').toUpperCase())}</span>
             <span class="badge" style="background:#eef0f3">${utils.escapeHtml(p.category || 'General')}</span></p>
          <h3 style="margin:0.5rem 0">${utils.formatCurrency(p.price)} ${p.currency || ''}
            ${p.discount ? `<span style="text-decoration:line-through;font-size:0.85em;opacity:0.5">${utils.formatCurrency(p.originalPrice)}</span>` : ''}</h3>
          <p style="color:#1a7f4b"><strong>Estimated commission: ${utils.formatCurrency(p.estimatedCommission)}</strong>
            ${p.commissionType === 'percentage' && p.commissionValue ? `(${p.commissionValue}%)` : ''}</p>
          <p class="text-muted" style="font-size:0.88rem">${utils.escapeHtml(p.shortDescription || p.description || 'No description available.')}</p>
          <p class="text-muted" style="font-size:0.82rem"><i class="ri-check-line"></i> ${p.stockStatus || p.availability || 'Availability unknown'} Â· ${p.reviewsCount || 0} reviews${p.rating ? ` Â· â˜… ${p.rating}` : ''}</p>
          <p style="font-size:0.78rem" class="text-muted"><i class="ri-information-line"></i> Commissions are estimates until confirmed by the affiliate network.</p>
        </div>
      </div>
    `, `<button class="btn btn-secondary" onclick="utils.hideModal()">Close</button> <button class="btn btn-primary" id="modal-promote-btn"><i class="ri-rocket-line"></i> Promote Product</button>`);
    document.getElementById('modal-promote-btn').onclick = () => { utils.hideModal(); this.promoteProduct(id); };
  } catch (err) { utils.toast('error', 'Error', err.message); }
};

// ==================== PROMOTIONS PAGE ====================
// Promote â†’ creates a promotion, opens AI Studio with the product loaded
App.prototype.promoteProduct = async function(productId) {
  try {
    const promotion = (await window.api.createPromotion(productId)).data;
    utils.toast('success', 'Promotion created', 'Loading AI Studio...');
    window.location.hash = '#/ai-studio?promotion=' + promotion.id;
    this.renderAiStudio(promotion.id);
  } catch (err) { utils.toast('error', 'Error', err.message); }
};


// ==================== AI STUDIO (product-aware content generation) ====================
App.prototype.renderAiStudio = async function(promotionId) {
  this.renderLayout(`<div style="text-align:center;padding:3rem"><div class="spinner"></div></div>`);
  let promotion;
  try {
    const res = await window.api.getPromotion(promotionId);
    promotion = res.data;
  } catch (err) {
    this.renderLayout(`<div class="empty-state"><h3>Promotion not found</h3><p>${err.message}</p></div>`);
    return;
  }
  const p = promotion.product || {};
  const contentTypes = [
    ['facebook_post', 'Facebook Post'], ['instagram_post', 'Instagram Post'], ['instagram_caption', 'Instagram Caption'],
    ['instagram_story', 'Instagram Story Concept'], ['tiktok_caption', 'TikTok Caption'], ['tiktok_script', 'TikTok Video Script'],
    ['ad_copy_short', 'Short Ad Copy'], ['ad_copy_long', 'Long Ad Copy'], ['product_description', 'Product Description'],
    ['headline', 'Promotional Headline'], ['cta', 'Call To Action'], ['hashtags', 'Hashtags'],
  ];
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">AI Studio</h1>
    <p class="page-subtitle">Generate marketing content for your selected product</p></div></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:1.5rem" class="ai-studio-grid">
      <div>
        <div class="card" style="margin-bottom:1rem">
          <h3 style="margin-top:0"><i class="ri-magic-line"></i> Content Generator</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div><label class="form-label">Content Type</label>
              <select class="form-select" id="ai-type">${contentTypes.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
            <div><label class="form-label">Tone</label>
              <select class="form-select" id="ai-tone"><option>friendly</option><option>exciting</option><option>professional</option><option>urgent</option><option>luxurious</option></select></div>
            <div><label class="form-label">Target Audience</label>
              <input class="form-input" id="ai-audience" placeholder="e.g. young professionals" value="general"></div>
            <div><label class="form-label">Content Goal</label>
              <select class="form-select" id="ai-goal"><option value="sales">Drive sales</option><option value="awareness">Brand awareness</option><option value="engagement">Engagement</option></select></div>
          </div>
          <button class="btn btn-primary btn-block" id="ai-generate-btn" style="margin-top:1rem">
            <i class="ri-magic-line"></i> Generate Content</button>
          <div id="ai-output" style="margin-top:1rem"></div>
        </div>
      </div>
      <div>
        <div class="card">
          <h3 style="margin-top:0"><i class="ri-shopping-bag-3-line"></i> Product Selected</h3>
          <img src="${utils.escapeHtml((p.images && p.images[0]) || '')}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;background:#eef0f3">
          <strong style="display:block;margin-top:0.6rem">${utils.escapeHtml(p.title)}</strong>
          <div style="font-weight:700;margin-top:0.3rem">${utils.formatCurrency(p.price)} ${p.currency || ''}</div>
          <div style="font-size:0.85rem;color:#1a7f4b">Est. commission: ${utils.formatCurrency(p.estimatedCommission)}</div>
          <p class="text-muted" style="font-size:0.8rem;margin-top:0.5rem;word-break:break-all">
            <i class="ri-link"></i> Tracking link: ${utils.escapeHtml(promotion.affiliateLink || 'n/a')}</p>
        </div>
        <div class="card" style="margin-top:1rem">
          <h3 style="margin-top:0"><i class="ri-share-line"></i> Publish To</h3>
          <div id="ai-social-accounts"><div class="spinner" style="margin:auto"></div></div>
        </div>
        <div class="card" style="margin-top:1rem">
          <h3 style="margin-top:0"><i class="ri-send-plane-line"></i> Publish</h3>
          <p class="text-muted" style="font-size:0.82rem">Generate content and select a connected account, then publish.</p>
          <button class="btn btn-primary btn-block" id="ai-publish-btn" disabled><i class="ri-send-plane-line"></i> Publish Now</button>
          <div id="ai-publish-result" style="margin-top:0.7rem"></div>
        </div>
      </div>
    </div>
    <style>@media(max-width:900px){.ai-studio-grid{grid-template-columns:1fr!important}}</style>
  `);
  this.aiStudioInit(promotionId, promotion);
};
// __PART3__

// AI Studio interactions (accounts, generate, publish)
App.prototype.aiStudioInit = async function(promotionId, promotion) {
  let generated = null; let selectedAccount = null;
  const accountsBox = document.getElementById('ai-social-accounts');
  try {
    const accRes = await window.api.getSocialAccounts();
    const accounts = (accRes.data || []).filter(a => a.status === 'connected');
    const platformsRes = await window.api.getSocialPlatforms();
    const available = (platformsRes.data || []).filter(pl => pl.status === 'available');
    accountsBox.innerHTML = available.map(pl => {
      const acc = accounts.find(a => a.provider === pl.platform);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border-color,#eee)">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer">
          <input type="radio" name="social-account" value="${acc ? acc.id : ''}" ${acc ? '' : 'disabled'}>
          <i class="ri-${pl.platform === 'facebook' ? 'facebook' : pl.platform === 'instagram' ? 'instagram' : 'music-2'}-fill"></i> ${pl.name}
        </label>
        ${acc ? `<span class="badge" style="background:#e8f7ee;color:#1a7f4b">CONNECTED</span>`
          : `<button class="btn btn-secondary btn-sm" data-connect="${pl.platform}">Connect</button>`}
      </div>`;
    }).join('');
    accountsBox.querySelectorAll('[data-connect]').forEach(b => b.onclick = async () => {
      try {
        await window.api.connectSocial(b.dataset.connect);
        utils.toast('success', 'Account connected', `${b.dataset.connect} connected (demo mode)`);
        this.renderAiStudio(promotionId);
      } catch (err) { utils.toast('error', 'Connect failed', err.message); }
    });
    accountsBox.querySelectorAll('input[name=social-account]').forEach(r => r.onchange = () => {
      selectedAccount = r.value || null;
      document.getElementById('ai-publish-btn').disabled = !(generated && selectedAccount);
    });
  } catch { accountsBox.innerHTML = '<p class="text-muted">Could not load accounts</p>'; }

  document.getElementById('ai-generate-btn').onclick = async () => {
    const btn = document.getElementById('ai-generate-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px"></span> Generating...';
    const out = document.getElementById('ai-output');
    try {
      const res = await window.api.generatePromotionContent(promotionId, {
        contentType: document.getElementById('ai-type').value,
        tone: document.getElementById('ai-tone').value,
        audience: document.getElementById('ai-audience').value,
        goal: document.getElementById('ai-goal').value,
      });
      generated = res.data.generatedContent;
      out.innerHTML = `
        <div class="alert alert-success" style="font-size:0.8rem"><i class="ri-checkbox-circle-line"></i> Content generated <span class="badge" style="background:#fff3cd;color:#856404">DEMO AI</span></div>
        <textarea class="form-input" id="ai-edit-text" rows="7" style="width:100%">${utils.escapeHtml(generated.text)}</textarea>
        ${generated.hashtags && generated.hashtags.length ? `<p style="color:var(--primary);font-size:0.85rem">${generated.hashtags.map(h => '#' + utils.escapeHtml(h)).join(' ')}</p>` : ''}
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" id="ai-copy-btn"><i class="ri-file-copy-line"></i> Copy</button>
          <button class="btn btn-secondary btn-sm" id="ai-regen-btn"><i class="ri-refresh-line"></i> Regenerate</button>
        </div>`;
      document.getElementById('ai-copy-btn').onclick = () => {
        navigator.clipboard.writeText(document.getElementById('ai-edit-text').value);
        utils.toast('success', 'Copied', 'Content copied to clipboard');
      };
      document.getElementById('ai-regen-btn').onclick = () => document.getElementById('ai-generate-btn').click();
      document.getElementById('ai-edit-text').addEventListener('input', (e) => { generated.text = e.target.value; });
      document.getElementById('ai-publish-btn').disabled = !selectedAccount;
    } catch (err) { out.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
    btn.disabled = false; btn.innerHTML = '<i class="ri-magic-line"></i> Generate Content';
  };

  document.getElementById('ai-publish-btn').onclick = async () => {
    const btn = document.getElementById('ai-publish-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px"></span> Publishing...';
    const box = document.getElementById('ai-publish-result');
    try {
      await window.api.publishPromotion(promotionId, selectedAccount);
      box.innerHTML = `<div class="alert alert-success"><i class="ri-check-circle-line"></i> Published! Promotion is now live and tracked.</div>
        <button class="btn btn-secondary btn-sm btn-block" onclick="app.router.navigate('/promotions');app.renderPromotions()">View My Promotions</button>`;
      utils.toast('success', 'Published', 'Your content is live (demo publisher)');
    } catch (err) {
      box.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      btn.disabled = false; btn.innerHTML = '<i class="ri-send-plane-line"></i> Publish Now';
    }
  };
};

// ==================== PROMOTIONS PAGE ====================
App.prototype.renderPromotions = async function() {
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">My Promotions</h1>
    <p class="page-subtitle">Track your published content and its performance</p></div>
    <button class="btn btn-primary" onclick="app.router.navigate('/products');app.renderProducts()"><i class="ri-add-line"></i> New Promotion</button></div>
    <div id="promotions-list"><div style="text-align:center;padding:2rem"><div class="spinner"></div></div></div>`);
  try {
    const res = await window.api.getPromotions();
    const promos = res.data || [];
    const box = document.getElementById('promotions-list');
    if (!promos.length) {
      box.innerHTML = `<div class="empty-state"><i class="ri-megaphone-line" style="font-size:3rem;opacity:0.3"></i>
        <h3>No promotions yet</h3><p>Browse products and click Promote to get started.</p>
        <button class="btn btn-primary" onclick="app.router.navigate('/products');app.renderProducts()">Browse Products</button></div>`;
      return;
    }
    const statusColors = { draft: '#6c757d', generating: '#fd7e14', ready: '#0d6efd', scheduled: '#6f42c1', published: '#1a7f4b', failed: '#dc3545', archived: '#6c757d' };
    box.innerHTML = `<div style="display:grid;gap:0.75rem">` + promos.map(pr => {
      const prod = pr.product || {};
      const gc = pr.generatedContent || {};
      return `<div class="card" style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
        <img src="${utils.escapeHtml((prod.images && prod.images[0]) || '')}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;background:#eef0f3">
        <div style="flex:1;min-width:200px">
          <strong>${utils.escapeHtml(prod.title || 'Product')}</strong>
          <div class="text-muted" style="font-size:0.8rem">
            <span class="badge" style="background:${statusColors[pr.status] || '#6c757d'};color:#fff">${(pr.status || '').toUpperCase()}</span>
            ${pr.socialPlatform ? `<i class="ri-share-line"></i> ${utils.escapeHtml(pr.socialPlatform)} Â· ` : ''}
            ${pr.clicks || 0} clicks Â· ${pr.conversions || 0} conversions
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;color:#1a7f4b">${utils.formatCurrency(pr.estimatedEarnings)}</div>
          <div class="text-muted" style="font-size:0.78rem">est. Â· confirmed ${utils.formatCurrency(pr.confirmedEarnings)}</div>
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          ${pr.status !== 'published' && gc.text ? `<button class="btn btn-secondary btn-sm" data-pub="${pr.id}"><i class="ri-send-plane-line"></i> Publish</button>` : ''}
          <button class="btn btn-secondary btn-sm" data-sim="${pr.id}" title="Simulate a sale (demo)"><i class="ri-flask-line"></i> Demo Sale</button>
        </div>
      </div>`;
    }).join('') + `</div>`;
    box.querySelectorAll('[data-pub]').forEach(b => b.onclick = async () => {
      try {
        await window.api.publishPromotion(b.dataset.pub);
        utils.toast('success', 'Published', 'Promotion published (demo publisher)');
        this.renderPromotions();
      } catch (err) { utils.toast('error', 'Publish failed', err.message); }
    });
    box.querySelectorAll('[data-sim]').forEach(b => b.onclick = async () => {
      try {
        const r = await window.api.simulatePromotionSale(b.dataset.sim);
        utils.toast('info', 'Demo sale recorded', r.notice || 'Commission recorded as PENDING');
        this.renderPromotions();
      } catch (err) { utils.toast('error', 'Error', err.message); }
    });
  } catch (err) {
    document.getElementById('promotions-list').innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
};

// ==================== EARNINGS / WALLET PAGE ====================
App.prototype.renderEarnings = async function() {
  this.renderLayout(`<div style="text-align:center;padding:3rem"><div class="spinner"></div></div>`);
  let wallet, commissions, withdrawals, transactions;
  try {
    [wallet, commissions, withdrawals, transactions] = await Promise.all([
      window.api.getWallet(), window.api.getCommissions(),
      window.api.getWithdrawals(), window.api.getWalletTransactions(),
    ]);
  } catch (err) {
    this.renderLayout(`<div class="alert alert-danger">${err.message}</div>`);
    return;
  }
  const w = wallet.data;
  const fmt = utils.formatCurrency;
  this.renderLayout(`
    <div class="page-header"><div><h1 class="page-title">Earnings</h1>
    <p class="page-subtitle">Your virtual earnings wallet</p></div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Estimated</div><div class="stat-value">${fmt(w.estimated)}</div>
        <div class="stat-change" style="font-size:0.72rem">Potential from product data</div></div>
      <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value" style="color:#b8860b">${fmt(w.pending)}</div>
        <div class="stat-change" style="font-size:0.72rem">Detected, not yet confirmed</div></div>
      <div class="stat-card"><div class="stat-label">Available</div><div class="stat-value" style="color:#1a7f4b">${fmt(w.available)}</div>
        <div class="stat-change" style="font-size:0.72rem">Confirmed, ready for payout</div></div>
      <div class="stat-card"><div class="stat-label">Total Paid</div><div class="stat-value">${fmt(w.paid)}</div>
        <div class="stat-change" style="font-size:0.72rem">Withdrawals completed</div></div>
    </div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:1.5rem;margin-top:1.5rem" class="earnings-grid">
      <div id="earnings-main"></div>
      <div id="earnings-side"></div>
    </div>
    <style>@media(max-width:900px){.earnings-grid{grid-template-columns:1fr!important}}</style>
  `);
  this.earningsInit(wallet, commissions, withdrawals, transactions);
};

// Earnings page renderer
App.prototype.earningsInit = function(wallet, commissions, withdrawals, transactions) {
  const w = wallet.data; const fmt = utils.formatCurrency;
  document.getElementById('earnings-main').innerHTML = `
    <div class="card">
      <h3 style="margin-top:0"><i class="ri-coins-line"></i> Commissions</h3>
      ${commissions.data.length ? `<div style="overflow-x:auto"><table style="width:100%;font-size:0.85rem;border-collapse:collapse">
        <thead><tr style="text-align:left;border-bottom:2px solid var(--border-color,#eee)">
        <th style="padding:6px">Date</th><th>Sale</th><th>Commission</th><th>Status</th></tr></thead><tbody>
        ${commissions.data.map(c => `<tr style="border-bottom:1px solid var(--border-color,#eee)">
          <td style="padding:6px">${new Date(c.detectedAt || c.createdAt).toLocaleDateString()}</td>
          <td>${fmt(c.saleAmount)}</td><td><strong>${fmt(c.userShare)}</strong></td>
          <td><span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${c.status.toUpperCase()}</span></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="text-muted">No commissions yet. Promote products to earn.</p>'}
    </div>
    <div class="card" style="margin-top:1rem">
      <h3 style="margin-top:0"><i class="ri-history-line"></i> Transaction History</h3>
      ${transactions.data.length ? transactions.data.map(t => `
        <div style="display:flex;justify-content:space-between;padding:0.45rem 0;border-bottom:1px solid var(--border-color,#eee);font-size:0.85rem">
          <div><strong>${utils.escapeHtml(t.description || t.type)}</strong>
          <div class="text-muted" style="font-size:0.75rem">${new Date(t.createdAt).toLocaleString()}</div></div>
          <div style="font-weight:700;color:${Number(t.amount) >= 0 ? '#1a7f4b' : '#dc3545'}">${Number(t.amount) >= 0 ? '+' : ''}${fmt(Math.abs(Number(t.amount)))}</div>
        </div>`).join('') : '<p class="text-muted">No transactions yet.</p>'}
    </div>`;
  document.getElementById('earnings-side').innerHTML = `
    <div class="card">
      <h3 style="margin-top:0"><i class="ri-bank-line"></i> Request Withdrawal</h3>
      <p class="text-muted" style="font-size:0.8rem">Available balance: <strong>${fmt(w.available)}</strong></p>
      <div class="form-group"><label class="form-label">Amount</label>
        <input class="form-input" id="wd-amount" type="number" min="1" step="0.01" placeholder="0.00"></div>
      <div class="form-group"><label class="form-label">Payout Method</label>
        <select class="form-select" id="wd-method">
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select></div>
      <div class="form-group"><label class="form-label">Payout Details</label>
        <input class="form-input" id="wd-details" placeholder="Account number / phone / bank details"></div>
      <button class="btn btn-primary btn-block" id="wd-submit"><i class="ri-bank-line"></i> Request Withdrawal</button>
      <div id="wd-result" style="margin-top:0.6rem"></div>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3 style="margin-top:0"><i class="ri-file-list-3-line"></i> Withdrawal Requests</h3>
      ${withdrawals.data.length ? withdrawals.data.map(wd => `
        <div style="padding:0.5rem 0;border-bottom:1px solid var(--border-color,#eee);font-size:0.85rem">
          <div style="display:flex;justify-content:space-between">
            <strong>${fmt(wd.amount)}</strong>
            <span class="badge" style="background:var(--bg-tertiary,#eef0f3)">${wd.status.toUpperCase()}</span></div>
          <div class="text-muted" style="font-size:0.75rem">${utils.escapeHtml(wd.payoutMethod)} Â· ${new Date(wd.createdAt).toLocaleDateString()}</div>
        </div>`).join('') : '<p class="text-muted">No withdrawal requests yet.</p>'}
    </div>`;
  document.getElementById('wd-submit').onclick = async () => {
    const btn = document.getElementById('wd-submit'); const box = document.getElementById('wd-result');
    const amount = parseFloat(document.getElementById('wd-amount').value);
    const method = document.getElementById('wd-method').value;
    const details = document.getElementById('wd-details').value.trim();
    if (!amount || amount <= 0) { utils.toast('error', 'Invalid amount', 'Enter a valid withdrawal amount'); return; }
    if (!details) { utils.toast('error', 'Missing details', 'Enter your payout details'); return; }
    btn.disabled = true;
    try {
      await window.api.requestWithdrawal({ amount, payoutMethod: method, payoutDetails: { detail: details } });
      box.innerHTML = `<div class="alert alert-success"><i class="ri-check-circle-line"></i> Withdrawal requested. Admin will review it shortly.</div>`;
      setTimeout(() => this.renderEarnings(), 1500);
    } catch (err) { box.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; btn.disabled = false; }
  };
};
