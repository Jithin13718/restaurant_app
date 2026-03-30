/* ═══════════════════════════════════════════════════════
   js/dashboard.js — Dashboard page rendering
   Restaurant Menu & Order Management System
═══════════════════════════════════════════════════════ */

const Dashboard = (() => {

  function render() {
    _renderStats();
    _renderRecentOrders();
    _renderPopularItems();
  }

  /* ── STAT CARDS ── */
  function _renderStats() {
    const totalMenu   = DB.query(`SELECT COUNT(*) AS c FROM menu_items WHERE available = 1`)[0].c;
    const totalOrders = DB.query(`SELECT COUNT(*) AS c FROM orders`)[0].c;
    const revenue     = DB.query(`SELECT COALESCE(SUM(total_amount), 0) AS r FROM orders WHERE status = 'Served'`)[0].r;
    const pending     = DB.query(`SELECT COUNT(*) AS c FROM orders WHERE status = 'Pending'`)[0].c;
    const preparing   = DB.query(`SELECT COUNT(*) AS c FROM orders WHERE status = 'Preparing'`)[0].c;
    const todayOrders = DB.query(`SELECT COUNT(*) AS c FROM orders WHERE DATE(created_at) = DATE('now')`)[0].c;

    const stats = [
      { icon: '🍽', label: 'Active Menu Items', value: totalMenu,                         note: 'Items available today' },
      { icon: '📋', label: 'Total Orders',       value: totalOrders,                       note: `${todayOrders} placed today` },
      { icon: '₹',  label: 'Total Revenue',      value: Utils.currency(revenue),           note: 'From served orders' },
      { icon: '⏳', label: 'Pending / Preparing', value: `${pending} / ${preparing}`,      note: 'Needs attention' },
    ];

    document.getElementById('dash-stats').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-note">${s.note}</div>
      </div>
    `).join('');
  }

  /* ── RECENT ORDERS ── */
  function _renderRecentOrders() {
    const rows = DB.query(`
      SELECT id, table_number, customer_name, total_amount, status
      FROM   orders
      ORDER  BY id DESC
      LIMIT  8
    `);

    const tbody = document.getElementById('dash-recent-orders');
    tbody.innerHTML = rows.length
      ? rows.map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>Table ${o.table_number}</td>
            <td>${o.customer_name || '—'}</td>
            <td>${Utils.currency(o.total_amount)}</td>
            <td>${Utils.statusBadge(o.status)}</td>
          </tr>
        `).join('')
      : Utils.emptyRow(5, 'No orders yet.');
  }

  /* ── POPULAR ITEMS ── */
  function _renderPopularItems() {
    const rows = DB.query(`
      SELECT   oi.item_name,
               COUNT(*)              AS order_count,
               SUM(oi.price * oi.quantity) AS revenue
      FROM     order_items oi
      GROUP BY oi.item_name
      ORDER BY order_count DESC
      LIMIT    6
    `);

    const maxCount = rows[0]?.order_count || 1;

    const tbody = document.getElementById('dash-popular');
    tbody.innerHTML = rows.length
      ? rows.map(r => `
          <tr>
            <td>${r.item_name}</td>
            <td>
              <div style="display:flex;align-items:center;gap:.6rem">
                <div class="sales-bar-wrap" style="flex:1">
                  <div class="sales-bar">
                    <div class="sales-bar-fill" style="width:${Math.round(r.order_count / maxCount * 100)}%"></div>
                  </div>
                </div>
                <strong>${r.order_count}</strong>
              </div>
            </td>
            <td>${Utils.currency(r.revenue)}</td>
          </tr>
        `).join('')
      : Utils.emptyRow(3, 'No data yet.');
  }

  return { render };
})();
