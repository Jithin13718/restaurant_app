/* ═══════════════════════════════════════════════════════
   js/menu.js — Menu management (CRUD operations)
   Restaurant Menu & Order Management System
═══════════════════════════════════════════════════════ */

const Menu = (() => {

  let _editingId = null;

  /* ── PUBLIC: RENDER PAGE ── */
  function render() {
    renderGrid();
  }

  /* ── RENDER MENU GRID ── */
  function renderGrid() {
    const search = document.getElementById('menu-search')?.value.toLowerCase() || '';
    const cat    = document.getElementById('menu-filter-cat')?.value || '';
    const avail  = document.getElementById('menu-filter-avail')?.value || '';

    let sql = `SELECT * FROM menu_items WHERE 1=1`;
    const params = [];
    if (cat)    { sql += ` AND category = ?`;                               params.push(cat); }
    if (avail !== '') { sql += ` AND available = ?`;                        params.push(parseInt(avail)); }
    if (search) { sql += ` AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    sql += ` ORDER BY category, name`;

    const items = DB.query(sql, params);
    const grid  = document.getElementById('menu-grid');

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🍽</div>
          <p>No menu items match your filter.</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="menu-item-card ${_editingId === item.id ? 'editing' : ''}" id="mic-${item.id}">
        <div class="mic-header">
          <div class="mic-name">${_esc(item.name)}</div>
          ${Utils.categoryBadge(item.category)}
        </div>
        <div class="mic-price">${Utils.currency(item.price)}</div>
        <div class="mic-desc">${_esc(item.description) || '<em>No description provided.</em>'}</div>
        <div class="mic-footer">
          ${Utils.availBadge(item.available)}
          <div class="mic-actions">
            <button class="btn btn-sage btn-sm" onclick="Menu.startEdit(${item.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Menu.deleteItem(${item.id}, '${_esc(item.name)}')">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* ── SAVE (INSERT or UPDATE) ── */
  function saveItem() {
    const name  = document.getElementById('menu-name').value.trim();
    const cat   = document.getElementById('menu-category').value;
    const price = parseFloat(document.getElementById('menu-price').value);
    const avail = parseInt(document.getElementById('menu-avail').value);
    const desc  = document.getElementById('menu-desc').value.trim();

    // Validation
    if (!name)         { Utils.toast('⚠ Item name is required.'); return; }
    if (!cat)          { Utils.toast('⚠ Please select a category.'); return; }
    if (isNaN(price) || price <= 0) { Utils.toast('⚠ Enter a valid price greater than 0.'); return; }

    if (_editingId !== null) {
      // ── UPDATE ──
      DB.run(
        `UPDATE menu_items SET name=?, category=?, price=?, description=?, available=? WHERE id=?`,
        [name, cat, price, desc, avail, _editingId]
      );
      Utils.toast(`✅ "${name}" updated successfully.`);
    } else {
      // ── INSERT ──
      DB.run(
        `INSERT INTO menu_items (name, category, price, description, available) VALUES (?,?,?,?,?)`,
        [name, cat, price, desc, avail]
      );
      Utils.toast(`✅ "${name}" added to the menu.`);
    }

    resetForm();
    renderGrid();
    Dashboard.render();
    Orders.refreshItemSelect();
  }

  /* ── POPULATE FORM FOR EDIT ── */
  function startEdit(id) {
    const item = DB.query(`SELECT * FROM menu_items WHERE id = ?`, [id])[0];
    if (!item) return;

    _editingId = id;
    document.getElementById('menu-name').value     = item.name;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-price').value    = item.price;
    document.getElementById('menu-avail').value    = item.available;
    document.getElementById('menu-desc').value     = item.description || '';

    document.getElementById('menu-form-title').textContent = '✏ Edit Menu Item';
    document.getElementById('menu-save-btn').textContent   = 'Update Item';
    document.getElementById('menu-cancel-btn').style.display = 'inline-flex';

    // Scroll to form
    document.getElementById('menu-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderGrid(); // Highlight the editing card
  }

  /* ── DELETE ── */
  function deleteItem(id, name) {
    if (!Utils.confirm(`Delete "${name}" from the menu? This cannot be undone.`)) return;
    DB.run(`DELETE FROM menu_items WHERE id = ?`, [id]);
    if (_editingId === id) resetForm();
    Utils.toast(`🗑 "${name}" removed from the menu.`);
    renderGrid();
    Dashboard.render();
    Orders.refreshItemSelect();
  }

  /* ── RESET FORM ── */
  function resetForm() {
    _editingId = null;
    ['menu-name', 'menu-price', 'menu-desc'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('menu-category').value = '';
    document.getElementById('menu-avail').value    = '1';
    document.getElementById('menu-form-title').textContent  = '+ Add Menu Item';
    document.getElementById('menu-save-btn').textContent    = 'Save Item';
    document.getElementById('menu-cancel-btn').style.display = 'none';
    renderGrid();
  }

  /* ── ESCAPE HTML ── */
  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render, renderGrid, saveItem, startEdit, deleteItem, resetForm };
})();
