/**
 * Utility Functions & UI Components
 */

// === Toast Notifications ===
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
    <button class="toast-close"><i class="ri-close-line"></i></button>
  `;

  el.querySelector('.toast-close').onclick = () => el.remove();
  container.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// === Modal ===
function showModal(title, bodyHtml, footerHtml = '') {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close"><i class="ri-close-line"></i></button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
  `;
  overlay.classList.remove('hidden');
  container.querySelector('.modal-close').onclick = hideModal;
  overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// === Formatting ===
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatStatus(status) {
  if (!status) return '<span class="badge badge-disconnected">Unknown</span>';
  return `<span class="badge badge-${status}">${status}</span>`;
}

// === Confirm Dialog ===
function confirm(message, onConfirm) {
  showModal('Confirm', `<p>${message}</p>`, `
    <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn btn-danger" id="modal-confirm">Confirm</button>
  `);
  document.getElementById('modal-cancel').onclick = hideModal;
  document.getElementById('modal-confirm').onclick = () => { hideModal(); onConfirm(); };
}

// === Escape HTML ===
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.utils = { toast, showModal, hideModal, formatDate, formatCurrency, formatStatus, confirm, escapeHtml };
