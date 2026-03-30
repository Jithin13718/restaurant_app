/* ═══════════════════════════════════════════════════════
   js/utils.js — Shared utility functions
   Restaurant Menu & Order Management System
═══════════════════════════════════════════════════════ */

const Utils = (() => {

  /* ── TOAST NOTIFICATION ── */
  let _toastTimer = null;
  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    clearTimeout(_toastTimer);
    el.textContent = message;
    el.classList.add('show');
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* ── STATUS BADGE HTML ── */
  const STATUS_CLASS = {
    'Pending':    'badge-amber',
    'Preparing':  'badge-blue',
    'Served':     'badge-green',
    'Cancelled':  'badge-red',
  };
  function statusBadge(status) {
    const cls = STATUS_CLASS[status] || 'badge-gray';
    return `<span class="badge ${cls}">${status}</span>`;
  }

  /* ── CATEGORY BADGE HTML ── */
  const CAT_CLASS = {
    'Appetizers':  'badge-purple',
    'Main Course': 'badge-teal',
    'Desserts':    'badge-amber',
    'Beverages':   'badge-blue',
    'Specials':    'badge-green',
  };
  function categoryBadge(cat) {
    const cls = CAT_CLASS[cat] || 'badge-gray';
    return `<span class="badge ${cls}">${cat}</span>`;
  }

  /* ── FORMAT CURRENCY (Indian Rupees) ── */
  function currency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  /* ── FORMAT DATE ── */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /* ── AVAILABILITY BADGE ── */
  function availBadge(available) {
    return available
      ? `<span class="badge badge-green">Available</span>`
      : `<span class="badge badge-red">Unavailable</span>`;
  }

  /* ── EMPTY TABLE ROW ── */
  function emptyRow(cols, message = 'No records found.') {
    return `<tr>
      <td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--muted-light);">
        ${message}
      </td>
    </tr>`;
  }

  /* ── MODAL HELPERS ── */
  function openModal(id) {
    document.getElementById(id)?.classList.add('open');
  }
  function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }

  /* ── CONFIRM ── */
  function confirm(message) {
    return window.confirm(message);
  }

  /* ── EXPOSE ── */
  return {
    toast,
    statusBadge,
    categoryBadge,
    currency,
    formatDate,
    availBadge,
    emptyRow,
    openModal,
    closeModal,
    closeAllModals,
    confirm,
  };
})();
