/* ═══════════════════════════════════════════════════════
   js/database.js — Database initialization, schema & helpers
   Uses SQL.js (SQLite compiled to WebAssembly)
═══════════════════════════════════════════════════════ */

const DB = (() => {
  let _db = null;

  /* ── INIT ── */
  async function init() {
    const SQL = await initSqlJs({
      locateFile: file =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
    });
    _db = new SQL.Database();
    _createSchema();
    _seedData();
    console.info('[DB] SQLite database ready.');
  }

  /* ── SCHEMA ── */
  function _createSchema() {
    _db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        category    TEXT    NOT NULL,
        price       REAL    NOT NULL,
        description TEXT,
        available   INTEGER NOT NULL DEFAULT 1,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    _db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number    INTEGER NOT NULL,
        customer_name   TEXT,
        total_amount    REAL    NOT NULL DEFAULT 0,
        status          TEXT    NOT NULL DEFAULT 'Pending',
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    _db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id      INTEGER NOT NULL,
        menu_item_id  INTEGER NOT NULL,
        item_name     TEXT    NOT NULL,
        price         REAL    NOT NULL,
        quantity      INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (order_id)     REFERENCES orders(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      );
    `);
  }

  /* ── SEED DATA ── */
  function _seedData() {
    const menuItems = [
      ['Crispy Spring Rolls',    'Appetizers',  180, 'Golden-fried rolls stuffed with mixed vegetables and glass noodles',  1],
      ['Chicken Tikka',          'Appetizers',  320, 'Tender chicken marinated in spiced yoghurt, cooked in tandoor',       1],
      ['Mutton Seekh Kebab',     'Appetizers',  380, 'Minced mutton on skewers with herbs, grilled over charcoal',          1],
      ['Grilled Salmon',         'Main Course', 650, 'Atlantic salmon fillet with herb butter, asparagus & roast potatoes', 1],
      ['Mutton Biryani',         'Main Course', 420, 'Slow-cooked basmati rice layered with tender mutton & caramelised onions', 1],
      ['Paneer Butter Masala',   'Main Course', 280, 'Cottage cheese cubes in a rich, creamy tomato-cashew sauce',         1],
      ['Pasta Carbonara',        'Main Course', 350, 'Spaghetti with pancetta, egg yolk & aged parmesan',                  1],
      ['Chicken Alfredo',        'Main Course', 390, 'Fettuccine in cream sauce with grilled chicken & mushrooms',         1],
      ['Chocolate Lava Cake',    'Desserts',    220, 'Warm dark-chocolate cake with a molten centre, served with vanilla ice cream', 1],
      ['Mango Kulfi',            'Desserts',    120, 'Traditional Indian mango ice cream on a stick',                      1],
      ['Gulab Jamun',            'Desserts',    100, 'Soft milk-solid dumplings soaked in rose-cardamom syrup',            1],
      ['Fresh Lime Soda',        'Beverages',    60, 'Chilled lime juice with mint, rock salt & soda',                    1],
      ['Cold Coffee',            'Beverages',   110, 'Blended iced coffee topped with whipped cream',                     1],
      ['Mango Lassi',            'Beverages',    90, 'Thick blended yoghurt drink with Alphonso mango',                   1],
      ['Chef Special Thali',     'Specials',    499, 'Full platter — soup, starter, two curries, rice, bread, dessert & beverage', 1],
      ['Weekend Brunch Platter', 'Specials',    599, 'Eggs your way, grilled tomatoes, sausages, hash browns & toast',    1],
    ];

    const mStmt = _db.prepare(
      `INSERT INTO menu_items (name, category, price, description, available) VALUES (?,?,?,?,?)`
    );
    menuItems.forEach(r => mStmt.run(r));
    mStmt.free();

    // Sample orders
    const ordersData = [
      [4, 'Rahul Kumar',  1010, 'Served'],
      [2, 'Priya Sharma',  700, 'Preparing'],
      [7, '',              280, 'Pending'],
      [1, 'Amit Patel',    830, 'Served'],
      [3, 'Sneha Rao',     560, 'Cancelled'],
      [5, 'Vikram Singh',  940, 'Served'],
    ];
    const oStmt = _db.prepare(
      `INSERT INTO orders (table_number, customer_name, total_amount, status) VALUES (?,?,?,?)`
    );
    ordersData.forEach(r => oStmt.run(r));
    oStmt.free();

    // Order items (order_id, menu_item_id, qty)
    const orderItems = [
      [1, 3, 1], [1, 1, 2], [1, 13, 1],
      [2, 4, 1], [2, 12, 1],
      [3, 6, 1],
      [4, 5, 1], [4, 2, 1], [4, 10, 1],
      [5, 7, 1], [5, 13, 2],
      [6, 15, 1], [6, 14, 1],
    ];
    orderItems.forEach(([oid, mid, qty]) => {
      const res = _db.exec(`SELECT name, price FROM menu_items WHERE id = ${mid}`);
      if (res[0]) {
        const [name, price] = res[0].values[0];
        _db.run(
          `INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity) VALUES (?,?,?,?,?)`,
          [oid, mid, name, price, qty]
        );
      }
    });
  }

  /* ── PUBLIC QUERY HELPERS ── */

  /**
   * Execute a SELECT and return array of plain objects
   * @param {string} sql
   * @param {Array}  params
   * @returns {Object[]}
   */
  function query(sql, params = []) {
    const results = _db.exec(sql, params);
    if (!results.length) return [];
    const { columns, values } = results[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  /**
   * Execute INSERT / UPDATE / DELETE
   * @param {string} sql
   * @param {Array}  params
   */
  function run(sql, params = []) {
    _db.run(sql, params);
  }

  /**
   * Get the rowid of the last INSERT
   * @returns {number}
   */
  function lastInsertId() {
    return query(`SELECT last_insert_rowid() AS id`)[0].id;
  }

  /* ── EXPOSE ── */
  return { init, query, run, lastInsertId };
})();
