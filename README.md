# 🍽 Food Heaven — Restaurant Menu & Order Management System

A full-featured, multi-file web application built with **HTML5 · CSS3 · JavaScript · SQLite (SQL.js)**  
for the **Web Technologies** academic project.

---

## 📁 Project Folder Structure

```
restaurant-app/
│
├── index.html              ← Main entry point (open this in your browser)
│
├── css/
│   ├── main.css            ← Global styles: variables, reset, header, layout,
│   │                          cards, tables, forms, buttons, modals, toast
│   └── pages.css           ← Page-specific styles: dashboard, menu cards,
│                              cart, orders table, reports, responsive overrides
│
├── js/
│   ├── database.js         ← SQL.js init, schema (CREATE TABLE), seed data,
│   │                          and query/run/lastInsertId helper functions
│   ├── utils.js            ← Shared utilities: toast, badges, currency
│   │                          formatter, date formatter, modal helpers
│   ├── dashboard.js        ← Dashboard page: stat cards, recent orders,
│   │                          popular items (SELECT + GROUP BY queries)
│   ├── menu.js             ← Menu CRUD: INSERT, SELECT, UPDATE, DELETE
│   │                          on menu_items table + live search/filter
│   ├── orders.js           ← Orders CRUD: cart logic, INSERT order +
│   │                          order_items, UPDATE status, DELETE order
│   ├── reports.js          ← Reports page: aggregate analytics with
│   │                          JOIN + GROUP BY + SUM queries
│   └── app.js              ← App bootstrap, navigation controller,
│                              HTML layout injection, modal wiring
│
└── README.md               ← This file
```

---

## 🗄️ Database Schema

The app uses **3 relational tables** in an in-memory SQLite database:

### `menu_items`
| Column       | Type     | Description                          |
|-------------|----------|--------------------------------------|
| id           | INTEGER  | Primary Key, Auto-increment           |
| name         | TEXT     | Name of the dish                      |
| category     | TEXT     | Appetizers / Main Course / Desserts / Beverages / Specials |
| price        | REAL     | Price in ₹                            |
| description  | TEXT     | Short description                     |
| available    | INTEGER  | 1 = Available, 0 = Unavailable        |
| created_at   | DATETIME | Timestamp of creation                 |

### `orders`
| Column         | Type     | Description                        |
|---------------|----------|------------------------------------|
| id             | INTEGER  | Primary Key, Auto-increment         |
| table_number   | INTEGER  | Restaurant table number             |
| customer_name  | TEXT     | Optional customer name              |
| total_amount   | REAL     | Total bill amount                   |
| status         | TEXT     | Pending / Preparing / Served / Cancelled |
| created_at     | DATETIME | Timestamp of order                  |

### `order_items`
| Column        | Type     | Description                         |
|--------------|----------|-------------------------------------|
| id            | INTEGER  | Primary Key, Auto-increment          |
| order_id      | INTEGER  | FK → orders(id)                      |
| menu_item_id  | INTEGER  | FK → menu_items(id)                  |
| item_name     | TEXT     | Snapshot of item name at order time  |
| price         | REAL     | Price at order time                  |
| quantity      | INTEGER  | Number of units ordered              |

---

## 🚀 How to Run

1. Download / unzip the project folder
2. Open **`index.html`** in any modern browser (Chrome, Firefox, Edge)
3. No server, no installation, no backend required

> **Note:** SQL.js loads a WebAssembly binary from a CDN. An internet connection is required on first load.

---

## ✅ CRUD Operations

| Operation | Menu Items          | Orders                    |
|-----------|---------------------|---------------------------|
| **Create**  | Add new menu item   | Place new order (with cart)|
| **Read**    | Browse/search grid  | View order list & details |
| **Update**  | Edit item details   | Update order status        |
| **Delete**  | Remove menu item    | Delete order               |

---

## 🛠 Technologies Used

| Technology  | Purpose                                      |
|-------------|----------------------------------------------|
| HTML5        | Semantic structure and layout shell           |
| CSS3         | Custom variables, Grid, Flexbox, animations  |
| JavaScript   | App logic, DOM, events, async/await           |
| SQL.js 1.10.2| SQLite compiled to WebAssembly (runs in-browser)|
| Google Fonts | Playfair Display + DM Sans typography         |

---

*Academic Project — Web Technologies Subject*
