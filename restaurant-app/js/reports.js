/* ═══════════════════════════════════════════════════════
   js/reports.js — Reports & Analytics page
   Restaurant Menu & Order Management System
═══════════════════════════════════════════════════════ */

const Reports = (() => {

  function render() {
    _renderSummaryStats();
    _renderOrderHistory();
    _renderSalesSummary();
    _renderCategorySummary();
  }

  /* ── SUMMARY STATS ── */
  function _renderSummaryStats() {
    const totalRev   = DB.query(`SELECT COALESCE(SUM(total_amount),0) AS v FROM orders WHERE status='Served'`)[0].v;
    const avgOrder   = DB.query(`SELECT COALESCE(AVG(total_amount),0) AS v FROM orders WHERE status='Served'`)[0].v;
    const itemsSold  = DB.query(`SELECT COALESCE(SUM(oi.quantity),0) AS v FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.status='Served'`)[0].v;
    const cancelled  = DB.query(`SELECT COUNT(*) AS v FROM orders WHERE status='Cancelled'`)[0].v;
    const topItem    = DB.query(`SELECT item_name, COUNT(*) c FROM order_items GROUP BY item_name ORDER BY c DESC LIMIT 1`)[0];
    const activeMenuPct = (() => {
      const total = DB.query(`SELECT COUNT(*) c FROM menu_items`)[0].c;
      const avail = DB.query(`SELECT COUNT(*) c FROM menu_items WHERE available=1`)[0].c;
      return total ? Math.round(avail / total * 100) : 0;
    })();

    document.getElementById('report-stats').innerHTML = [
      { icon:'💰', label:'Total Revenue',       value: Utils.currency(totalRev),         note:'Served orders only' },
      { icon:'📊', label:'Avg Order Value',      value: Utils.currency(Math.round(avgOrder)), note:'Per served order' },
      { icon:'🍴', label:'Total Items Served',   value: itemsSold,                        note:'Quantity across all orders' },
      { icon:'❌', label:'Cancellations',         value: cancelled,                        note:'Cancelled orders' },
      { icon:'⭐', label:'Best-Selling Item',     value: topItem ? topItem.item_name : '—', note: topItem ? `Ordered ${topItem.c} times` : '' },
      { icon:'📋', label:'Menu Availability',    value: activeMenuPct + '%',               note:'Items currently available' },
    ].map(s => `
      <div class="stat-card">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value" style="font-size:${String(s.value).length > 8 ? '1.2rem' : '2rem'}">${s.value}</div>
        <div class="stat-note">${s.note}</div>
      </div>
    `).join('');
  }

  /* ── ORDER HISTORY TABLE ── */
  function _renderOrderHistory() {
    const orders = DB.query(`
      SELECT o.*,
             GROUP_CONCAT(oi.item_name || ' ×' || oi.quantity, ', ') AS items_summary
      FROM   orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP  BY o.id
      ORDER  BY o.id DESC
    `);

    document.getElementById('report-order-history').innerHTML = orders.length
      ? orders.map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${Utils.formatDate(o.created_at)}</td>
            <td>Table ${o.table_number}</td>
            <td>${o.customer_name || '—'}</td>
            <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${o.items_summary || ''}">${o.items_summary || '—'}</td>
            <td><strong>${Utils.currency(o.total_amount)}</strong></td>
            <td>${Utils.statusBadge(o.status)}</td>
          </tr>
        `).join('')
      : Utils.emptyRow(7, 'No orders to display.');
  }

  /* ── ITEM SALES SUMMARY ── */
  function _renderSalesSummary() {
    const items = DB.query(`
      SELECT m.name,
             m.category,
             m.price,
             m.available,
             COALESCE(COUNT(oi.id), 0)              AS times_ordered,
             COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue
      FROM   menu_items m
      LEFT JOIN order_items oi ON oi.menu_item_id = m.id
      GROUP  BY m.id
      ORDER  BY times_ordered DESC
    `);

    const maxOrdered = items[0]?.times_ordered || 1;

    document.getElementById('report-sales-summary').innerHTML = items.length
      ? items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${Utils.categoryBadge(i.category)}</td>
            <td>${Utils.currency(i.price)}</td>
            <td>
              <div style="display:flex;align-items:center;gap:.6rem">
                <div class="sales-bar-wrap" style="flex:1;min-width:60px">
                  <div class="sales-bar">
                    <div class="sales-bar-fill" style="width:${Math.round(i.times_ordered / maxOrdered * 100)}%"></div>
                  </div>
                </div>
                <strong>${i.times_ordered}</strong>
              </div>
            </td>
            <td><strong>${Utils.currency(i.total_revenue)}</strong></td>
            <td>${Utils.availBadge(i.available)}</td>
          </tr>
        `).join('')
      : Utils.emptyRow(6, 'No menu items found.');
  }

  /* ── CATEGORY REVENUE BREAKDOWN ── */
  function _renderCategorySummary() {
    const cats = DB.query(`
      SELECT m.category,
             COUNT(DISTINCT m.id)                       AS item_count,
             COALESCE(SUM(oi.price * oi.quantity), 0)   AS revenue,
             COALESCE(COUNT(oi.id), 0)                  AS orders_count
      FROM   menu_items m
      LEFT JOIN order_items oi ON oi.menu_item_id = m.id
      GROUP  BY m.category
      ORDER  BY revenue DESC
    `);

    const maxRev = cats[0]?.revenue || 1;

    document.getElementById('report-category-summary').innerHTML = cats.length
      ? cats.map(c => `
          <tr>
            <td>${Utils.categoryBadge(c.category)}</td>
            <td style="text-align:center">${c.item_count}</td>
            <td style="text-align:center">${c.orders_count}</td>
            <td>
              <div style="display:flex;align-items:center;gap:.6rem">
                <div class="sales-bar-wrap" style="flex:1;min-width:80px">
                  <div class="sales-bar">
                    <div class="sales-bar-fill" style="width:${Math.round(c.revenue / maxRev * 100)}%"></div>
                  </div>
                </div>
                <strong>${Utils.currency(c.revenue)}</strong>
              </div>
            </td>
          </tr>
        `).join('')
      : Utils.emptyRow(4, 'No data.');
  }

  return { render };
})();
