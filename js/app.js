/* ═══════════════════════════════════════════════════════
   js/app.js — Application bootstrap & navigation controller
   Restaurant Menu & Order Management System
═══════════════════════════════════════════════════════ */

const App = (() => {

  const PAGES = ['dashboard', 'menu', 'orders', 'reports'];
  let _currentPage = 'dashboard';

  /* ── BOOTSTRAP ── */
  async function init() {
    try {
      // Show loading state
      document.getElementById('app-content').innerHTML = `
        <div style="text-align:center;padding:5rem 2rem;color:var(--muted)">
          <div style="font-size:2.5rem;margin-bottom:1rem">⏳</div>
          <p style="font-family:var(--font-display);font-size:1.2rem">Initialising database...</p>
        </div>`;

      // Init database
      await DB.init();

      // Restore full layout
      _buildLayout();

      // Wire navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigate(btn.dataset.page));
      });

      // Wire modal close buttons (clicks outside modal close it too)
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
          if (e.target === overlay) Utils.closeAllModals();
        });
      });

      // Navigate to default page
      navigate('dashboard');

    } catch (err) {
      console.error('[App] Init error:', err);
      document.getElementById('app-content').innerHTML = `
        <div style="text-align:center;padding:5rem 2rem;color:var(--rust)">
          <p>❌ Failed to initialise the database. Check the browser console.</p>
        </div>`;
    }
  }

  /* ── NAVIGATION ── */
  function navigate(page) {
    if (!PAGES.includes(page)) return;
    _currentPage = page;

    // Switch active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Switch active page panel
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === `page-${page}`);
    });

    // Render page content
    switch (page) {
      case 'dashboard': Dashboard.render(); break;
      case 'menu':      Menu.render();      break;
      case 'orders':    Orders.render();    break;
      case 'reports':   Reports.render();   break;
    }
  }

  /* ── BUILD LAYOUT (injects HTML into #app-content) ── */
  function _buildLayout() {
    document.getElementById('app-content').innerHTML = `

      <!-- ═══ DASHBOARD PAGE ═══ -->
      <div id="page-dashboard" class="page">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Live overview of your restaurant operations</p>
          <div class="page-divider"></div>
        </div>
        <div id="dash-stats" class="grid-4"></div>
        <div class="dashboard-grid">
          <div class="card">
            <div class="card-title">Recent Orders</div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Table</th><th>Customer</th><th>Total</th><th>Status</th></tr>
                </thead>
                <tbody id="dash-recent-orders"></tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Popular Dishes</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Orders</th><th>Revenue</th></tr></thead>
                <tbody id="dash-popular"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ MENU PAGE ═══ -->
      <div id="page-menu" class="page">
        <div class="page-header">
          <h1 class="page-title">Menu Management</h1>
          <p class="page-subtitle">Add, edit and manage your restaurant menu items</p>
          <div class="page-divider"></div>
        </div>
        <div class="menu-layout">

          <!-- FORM PANEL -->
          <div class="menu-form-panel">
            <div class="card" id="menu-form-card">
              <div class="card-title" id="menu-form-title">+ Add Menu Item</div>
              <div class="form-grid" style="grid-template-columns:1fr">
                <div class="form-group">
                  <label>Item Name *</label>
                  <input id="menu-name" placeholder="e.g. Grilled Salmon" />
                </div>
                <div class="form-group">
                  <label>Category *</label>
                  <select id="menu-category">
                    <option value="">Select category...</option>
                    <option>Appetizers</option>
                    <option>Main Course</option>
                    <option>Desserts</option>
                    <option>Beverages</option>
                    <option>Specials</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Price (₹) *</label>
                  <input id="menu-price" type="number" step="0.01" min="0" placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label>Availability</label>
                  <select id="menu-avail">
                    <option value="1">Available</option>
                    <option value="0">Unavailable</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea id="menu-desc" placeholder="Short description of the dish..."></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" id="menu-save-btn" onclick="Menu.saveItem()">Save Item</button>
                <button class="btn btn-ghost" id="menu-cancel-btn" onclick="Menu.resetForm()" style="display:none">Cancel Edit</button>
              </div>
            </div>
          </div>

          <!-- GRID PANEL -->
          <div>
            <div class="search-bar">
              <input id="menu-search" placeholder="🔍 Search items..." oninput="Menu.renderGrid()" />
              <select id="menu-filter-cat" onchange="Menu.renderGrid()">
                <option value="">All Categories</option>
                <option>Appetizers</option>
                <option>Main Course</option>
                <option>Desserts</option>
                <option>Beverages</option>
                <option>Specials</option>
              </select>
              <select id="menu-filter-avail" onchange="Menu.renderGrid()">
                <option value="">All Items</option>
                <option value="1">Available Only</option>
                <option value="0">Unavailable Only</option>
              </select>
            </div>
            <div id="menu-grid" class="menu-grid"></div>
          </div>
        </div>
      </div>

      <!-- ═══ ORDERS PAGE ═══ -->
      <div id="page-orders" class="page">
        <div class="page-header">
          <h1 class="page-title">Order Management</h1>
          <p class="page-subtitle">Place new orders and track their status</p>
          <div class="page-divider"></div>
        </div>
        <div class="orders-layout">

          <!-- NEW ORDER PANEL -->
          <div class="order-form-panel">
            <div class="card">
              <div class="card-title">New Order</div>
              <div class="form-grid" style="grid-template-columns:1fr">
                <div class="form-group">
                  <label>Table Number *</label>
                  <input id="order-table" type="number" min="1" max="100" placeholder="e.g. 5" />
                </div>
                <div class="form-group">
                  <label>Customer Name</label>
                  <input id="order-customer" placeholder="Optional" />
                </div>
                <div class="form-group">
                  <label>Menu Item</label>
                  <select id="order-item-select"></select>
                </div>
                <div class="form-group">
                  <label>Quantity</label>
                  <input id="order-qty" type="number" min="1" value="1" />
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-outline" onclick="Orders.addToCart()">+ Add to Cart</button>
              </div>

              <!-- CART -->
              <div id="cart-area" class="cart-area" style="margin-top:1rem">
                <div class="cart-empty">🛒 Your cart is empty.</div>
              </div>

              <div class="form-actions" style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">
                <button class="btn btn-primary btn-lg" onclick="Orders.placeOrder()">Place Order</button>
                <button class="btn btn-ghost" onclick="Orders.clearCart()">Clear Cart</button>
              </div>
            </div>
          </div>

          <!-- ORDERS LIST PANEL -->
          <div>
            <div class="search-bar">
              <input id="order-search" placeholder="🔍 Search by table, name or #..." oninput="Orders.renderList()" />
              <select id="order-filter-status" onchange="Orders.renderList()">
                <option value="">All Statuses</option>
                <option>Pending</option>
                <option>Preparing</option>
                <option>Served</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div class="card" style="padding:0;overflow:hidden">
              <div class="table-wrap" style="border:none">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Table</th><th>Customer</th>
                      <th>Total</th><th>Status</th><th>Placed</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="orders-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ REPORTS PAGE ═══ -->
      <div id="page-reports" class="page">
        <div class="page-header">
          <h1 class="page-title">Reports & Analytics</h1>
          <p class="page-subtitle">Sales performance, order trends and menu insights</p>
          <div class="page-divider"></div>
        </div>
        <div id="report-stats" class="grid-4" style="margin-bottom:1.5rem"></div>

        <div class="reports-grid">
          <div class="card">
            <div class="card-title">Category Revenue Breakdown</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Category</th><th style="text-align:center">Items</th><th style="text-align:center">Orders</th><th>Revenue</th></tr></thead>
                <tbody id="report-category-summary"></tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Menu Item Sales</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Orders</th><th>Revenue</th><th>Status</th></tr></thead>
                <tbody id="report-sales-summary"></tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:1.5rem">
          <div class="card-title">Full Order History</div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Date</th><th>Table</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody id="report-order-history"></tbody>
            </table>
          </div>
        </div>
      </div>

    `; // end innerHTML

    // ── MODALS (outside the page panels) ──
    _buildModals();
  }

  /* ── BUILD MODALS ── */
  function _buildModals() {
    const container = document.getElementById('modals-container');
    container.innerHTML = `

      <!-- ORDER DETAILS MODAL -->
      <div class="modal-overlay" id="modal-order-details">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Order Details</span>
            <button class="modal-close" onclick="Utils.closeModal('modal-order-details')">✕</button>
          </div>
          <div id="order-detail-content"></div>
        </div>
      </div>

      <!-- UPDATE STATUS MODAL -->
      <div class="modal-overlay" id="modal-order-status">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Update Order Status</span>
            <button class="modal-close" onclick="Utils.closeModal('modal-order-status')">✕</button>
          </div>
          <p style="color:var(--muted);margin-bottom:1.25rem">
            Updating status for Order <strong>#<span id="modal-status-order-id"></span></strong>
          </p>
          <div class="form-group" style="margin-bottom:1.5rem">
            <label>New Status</label>
            <select id="modal-status-select">
              <option>Pending</option>
              <option>Preparing</option>
              <option>Served</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" onclick="Orders.confirmStatusUpdate()">Update Status</button>
            <button class="btn btn-ghost" onclick="Utils.closeModal('modal-order-status')">Cancel</button>
          </div>
        </div>
      </div>

    `;
  }

  return { init, navigate };
})();

/* ── BOOT ON DOM READY ── */
document.addEventListener('DOMContentLoaded', () => App.init());
