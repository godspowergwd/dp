/**
 * PromoDesk — shared UI helpers
 */

// === Toast notifications ===
function toast(type, title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', warning: 'ri-alert-fill', info: 'ri-information-fill' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <i class="toast-icon ${icons[type] || icons.info}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss"><i class="ri-close-line"></i></button>`;
  el.querySelector('.toast-close').onclick = () => el.remove();
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(16px)'; el.style.transition = 'all 200ms ease'; setTimeout(() => el.remove(), 210); }, 4600);
}

// === Modal ===
function showModal(title, bodyHtml, footerHtml = '') {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" aria-label="Close"><i class="ri-close-line"></i></button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}`;
  overlay.classList.remove('hidden');
  container.querySelector('.modal-close').onclick = hideModal;
  overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-container').innerHTML = '';
}

// === Formatting ===
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || isNaN(amount)) return '$0.00';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount)); }
  catch { return `$${Number(amount).toFixed(2)}`; }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return formatDate(dateStr);
}

// Human-readable labels for internal statuses
const STATUS_LABELS = {
  estimated: 'Estimated', pending: 'Pending', confirmed: 'Confirmed', rejected: 'Rejected', paid: 'Paid',
  published: 'Published', draft: 'Draft', generating: 'Preparing', ready: 'Ready', scheduled: 'Scheduled',
  archived: 'Archived', failed: 'Failed', completed: 'Completed', processing: 'Processing', approved: 'Approved',
  reversed: 'Reversed', connected: 'Connected', disconnected: 'Disconnected',
  commission_estimated: 'Estimate recorded', commission_pending: 'Commission pending', commission_confirmed: 'Commission confirmed',
  balance_adjustment: 'Balance adjustment', withdrawal_request: 'Withdrawal requested', withdrawal_approved: 'Withdrawal approved',
  withdrawal_rejected: 'Withdrawal rejected', withdrawal_paid: 'Withdrawal paid',
  mobile_money: 'Mobile Money', bank_transfer: 'Bank Transfer',
};

function humanStatus(status) {
  if (!status) return 'Unknown';
  return STATUS_LABELS[status] || (status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '));
}

// Status badge with friendly label + color
function statusBadge(status) {
  const map = {
    estimated: 'warning', pending: 'info', confirmed: 'success', rejected: 'danger', paid: 'success',
    published: 'success', draft: 'secondary', generating: 'warning', ready: 'info', scheduled: 'info',
    processing: 'info', failed: 'danger', archived: 'secondary', completed: 'success', approved: 'info',
    withdrawn: 'secondary', connected: 'success',
  };
  const label = humanStatus(status);
  return `<span class="badge badge-${map[status] || 'secondary'}">${label}</span>`;
}

// === Button loading state ===
function setBtnLoading(btn, loadingText) {
  if (!btn) return;
  btn.dataset.original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px"></span> ${loadingText || 'Please wait...'}`;
}

function setBtnIdle(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = btn.dataset.original || btn.textContent;
}

// === Confirm dialog ===
function confirmDialog(message, onConfirm, options = {}) {
  showModal(options.title || 'Please confirm', `<p>${message}</p>`, `
    <button class="btn btn-secondary" id="modal-cancel">${options.cancelText || 'Cancel'}</button>
    <button class="btn ${options.danger !== false ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${options.confirmText || 'Confirm'}</button>`);
  document.getElementById('modal-cancel').onclick = hideModal;
  document.getElementById('modal-confirm').onclick = () => { hideModal(); onConfirm(); };
}

// === Escape HTML ===
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// === Skeleton loaders ===
function skeletonCards(count = 6) {
  return Array.from({ length: count }, () =>
    `<div class="card"><div class="skeleton" style="height:120px;width:100%"></div>
     <div class="skeleton" style="height:14px;width:75%;margin-top:12px"></div>
     <div class="skeleton" style="height:14px;width:45%;margin-top:8px"></div></div>`).join('');
}

function friendlyError(err) {
  return (err && err.message) ? err.message : 'Something went wrong. Please try again.';
}

window.utils = { toast, showModal, hideModal, formatDate, formatDateTime, formatCurrency, timeAgo, humanStatus, statusBadge, setBtnLoading, setBtnIdle, confirmDialog, escapeHtml, skeletonCards, friendlyError, confirm: confirmDialog };
