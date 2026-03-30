/* ═══════════════════════════════════════════════════════
   js/orders.js — Order management (CRUD + cart)
   Restaurant Menu & Order Management System
═══════════════════════════════════════════════════════ */

const Orders = (() => {

  let _cart = [];        // { id, name, price, qty }
  let _editStatusId = null;

  /* ── PUBLIC: RENDER PAGE ── */
  function render() {
    refreshItemSelect();
    renderList();
  }

  /* ── POPULATE MENU ITEM SELECT ── */
  function refreshItemSelect() {
    const sel = document.getElementById('order-item-select');
    if (!sel) return;
    const items = DB.query(
      `SELECT id, name, price, category FROM menu_items WHERE available = 1 ORDER BY category, name`
    );
    let lastCat = '';
    let html = `<option value="">— Select a menu item —</option>`;
    items.forEach(item => {
      if (item.category !== lastCat) {
        if (lastCat) html += `</optgroup>`;
        html += `<optgroup label="${item.category}">`;
        lastCat = item.category;
      }
      html += `<option value="${item.id}" data-price="${item.price}" data-name="${item.name}">
                 ${item.name} — ${Utils.currency(item.price)}
               </option>`;
    });
    if (lastCat) html += `</optgroup>`;
    sel.innerHTML = html;
  }

  /* ── ADD TO CART ── */
  function addToCart() {
    const sel = document.getElementById('order-item-select');
    const qty = parseInt(document.getElementById('order-qty').value) || 1;
    if (!sel.value) { Utils.toast('⚠ Please select a menu item.'); return; }
    if (qty < 1)    { Utils.toast('⚠ Quantity must be at least 1.'); return; }

    const opt   = sel.options[sel.selectedIndex];
    const id    = parseInt(sel.value);
    const name  = opt.dataset.name;
    const price = parseFloat(opt.dataset.price);

    const existing = _cart.find(c => c.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      _cart.push({ id, name, price, qty });
    }

    // Reset qty
    document.getElementById('order-qty').value = 1;
    _renderCart();
    Utils.toast(`🛒 "${name}" added to cart.`);
  }

  /* ── REMOVE FROM CART ── */
  function removeFromCart(index) {
    const removed = _cart.splice(index, 1)[0];
    _renderCart();
    Utils.toast(`Removed "${removed.name}" from cart.`);
  }

  /* ── RENDER CART ── */
  function _renderCart() {
    const area = document.getElementById('cart-area');
    if (!_cart.length) {
      area.innerHTML = `<div class="cart-empty">🛒 Your cart is empty.</div>`;
      return;
    }
    const total = _cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    area.innerHTML = `
      <div class="cart-header">Order Cart</div>
      ${_cart.map((c, i) => `
        <div class="cart-item">
          <span class="cart-item-name">${c.name}</span>
          <span class="cart-item-qty">× ${c.qty}</span>
          <span class="cart-item-price">${Utils.currency(c.price * c.qty)}</span>
          <button class="btn btn-danger btn-sm" onclick="Orders.removeFromCart(${i})" title="Remove">×</button>
        </div>
      `).join('')}
      <div class="cart-footer">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-value">${Utils.currency(total)}</span>
      </div>
    `;
  }

  /* ── PLACE ORDER (INSERT) ── */
  function placeOrder() {
    const tableNo  = parseInt(document.getElementById('order-table').value);
    const custName = document.getElementById('order-customer').value.trim();

    if (!tableNo || tableNo < 1 || tableNo > 100) {
      Utils.toast('⚠ Enter a valid table number (1–100).');
      return;
    }
    if (!_cart.length) {
      Utils.toast('⚠ Add at least one item to the cart.');
      return;
    }

    const total = _cart.reduce((sum, c) => sum + c.price * c.qty, 0);

    // INSERT parent order
    DB.run(
      `INSERT INTO orders (table_number, customer_name, total_amount, status) VALUES (?,?,?,'Pending')`,
      [tableNo, custName, total]
    );
    const orderId = DB.lastInsertId();

    // INSERT each line item
    _cart.forEach(c => {
      DB.run(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity) VALUES (?,?,?,?,?)`,
        [orderId, c.id, c.name, c.price, c.qty]
      );
    });

    Utils.toast(`✅ Order #${orderId} placed — Table ${tableNo}!`);
    clearCart();
    renderList();
    Dashboard.render();
  }

  /* ── CLEAR CART ── */
  function clearCart() {
    _cart = [];
    document.getElementById('order-table').value    = '';
    document.getElementById('order-customer').value = '';
    _renderCart();
  }

  /* ── RENDER ORDERS LIST (READ) ── */
  function renderList() {
    const search = document.getElementById('order-search')?.value.toLowerCase() || '';
    const status = document.getElementById('order-filter-status')?.value || '';

    let sql = `SELECT * FROM orders WHERE 1=1`;
    const params = [];
    if (status) { sql += ` AND status = ?`;   params.push(status); }
    if (search) {
      sql += ` AND (LOWER(customer_name) LIKE ? OR CAST(table_number AS TEXT) LIKE ? OR CAST(id AS TEXT) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY id DESC`;

    const orders = DB.query(sql, params);
    const tbody  = document.getElementById('orders-tbody');

    tbody.innerHTML = orders.length
      ? orders.map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>Table ${o.table_number}</td>
            <td>${o.customer_name || '—'}</td>
            <td>${Utils.currency(o.total_amount)}</td>
            <td>${Utils.statusBadge(o.status)}</td>
            <td>${_formatDate(o.created_at)}</td>
            <td>
              <div class="order-actions">
                <button class="btn btn-outline btn-sm" onclick="Orders.viewDetails(${o.id})">View</button>
                <button class="btn btn-sage btn-sm"    onclick="Orders.openStatusModal(${o.id}, '${o.status}')">Status</button>
                <button class="btn btn-danger btn-sm"  onclick="Orders.deleteOrder(${o.id})">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')
      : Utils.emptyRow(7, 'No orders found.');
  }

  /* ── VIEW ORDER DETAILS MODAL ── */
  function viewDetails(orderId) {
    const order = DB.query(`SELECT * FROM orders WHERE id = ?`, [orderId])[0];
    const items = DB.query(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]);
    if (!order) return;

    document.getElementById('order-detail-content').innerHTML = `
      <div class="order-detail-meta">
        <div class="order-detail-meta-item">
          <div class="meta-label">Order #</div>
          <div class="meta-value">#${order.id}</div>
        </div>
        <div class="order-detail-meta-item">
          <div class="meta-label">Table</div>
          <div class="meta-value">Table ${order.table_number}</div>
        </div>
        <div class="order-detail-meta-item">
          <div class="meta-label">Customer</div>
          <div class="meta-value">${order.customer_name || '—'}</div>
        </div>
        <div class="order-detail-meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value">${Utils.statusBadge(order.status)}</div>
        </div>
        <div class="order-detail-meta-item" style="grid-column:1/-1">
          <div class="meta-label">Placed At</div>
          <div class="meta-value">${_formatDate(order.created_at)}</div>
        </div>
      </div>
      <table class="order-detail-items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td>${i.item_name}</td>
              <td style="text-align:center">${i.quantity}</td>
              <td style="text-align:right">${Utils.currency(i.price)}</td>
              <td style="text-align:right">${Utils.currency(i.price * i.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="order-detail-total">
        Grand Total: <strong>${Utils.currency(order.total_amount)}</strong>
      </div>
    `;
    Utils.openModal('modal-order-details');
  }

  /* ── STATUS MODAL ── */
  function openStatusModal(orderId, currentStatus) {
    _editStatusId = orderId;
    document.getElementById('modal-status-order-id').textContent = orderId;
    document.getElementById('modal-status-select').value = currentStatus;
    Utils.openModal('modal-order-status');
  }

  function confirmStatusUpdate() {
    const newStatus = document.getElementById('modal-status-select').value;
    DB.run(`UPDATE orders SET status = ? WHERE id = ?`, [newStatus, _editStatusId]);
    Utils.toast(`✅ Order #${_editStatusId} → ${newStatus}`);
    Utils.closeModal('modal-order-status');
    renderList();
    Dashboard.render();
  }

  /* ── DELETE ORDER ── */
  function deleteOrder(orderId) {
    if (!Utils.confirm(`Delete Order #${orderId}? This action cannot be undone.`)) return;
    DB.run(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
    DB.run(`DELETE FROM orders WHERE id = ?`, [orderId]);
    Utils.toast(`🗑 Order #${orderId} deleted.`);
    renderList();
    Dashboard.render();
  }

  /* ── PRIVATE DATE FORMATTER ── */
  function _formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return {
    render, renderList, refreshItemSelect,
    addToCart, removeFromCart, clearCart, placeOrder,
    viewDetails, openStatusModal, confirmStatusUpdate,
    deleteOrder,
  };
})();
