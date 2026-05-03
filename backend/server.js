const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "role_management_app",
  waitForConnections: true,
  connectionLimit: 10,
});

const verifyUser = async (req, res, next) => {
  try {
    const email = req.headers.email;

    if (!email) {
      return res.status(401).json({ status: "Error", message: "Email missing" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ status: "Error", message: "User not found" });
    }

    req.user = users[0];
    next();
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Auth failed" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: "Error", message: "Access denied" });
    }
    next();
  };
};

app.get("/", (req, res) => {
  res.json({ status: "Success", message: "Backend is running" });
});

// AUTH

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({ status: "Error", message: "All fields are required" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length > 0) {
      return res.json({ status: "Error", message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.json({ status: "Success", message: "Account created" });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.sqlMessage || "Register failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.json({ status: "Error", message: "Invalid email" });
    }

    const user = users[0];
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.json({ status: "Error", message: "Invalid password" });
    }

    res.json({
      status: "Success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Login failed" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.json({ status: "Error", message: "Email and password required" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE email = ?", [
      hashed,
      email,
    ]);

    res.json({ status: "Success", message: "Password updated" });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Failed to reset password" });
  }
});

app.put("/user/name", verifyUser, async (req, res) => {
  try {
    const { name } = req.body;

    await pool.query("UPDATE users SET name = ? WHERE id = ?", [
      name,
      req.user.id,
    ]);

    res.json({
      status: "Success",
      message: "Name updated",
      user: {
        id: req.user.id,
        name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Failed to update name" });
  }
});

// CUSTOMER MARKETPLACE

app.get("/products", verifyUser, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        products.*,
        users.name AS shopkeeper_name,
        users.email AS shopkeeper_email
      FROM products
      JOIN users ON products.shopkeeper_id = users.id
      WHERE products.status = 'active'
      ORDER BY products.id DESC
    `);

    res.json({ status: "Success", products });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: err.sqlMessage || "Failed to load products",
      products: [],
    });
  }
});

// SUPPLIERS

app.post(
  "/shopkeeper/suppliers",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { name, phone, email, address } = req.body;

      await pool.query(
        "INSERT INTO suppliers (shopkeeper_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, name, phone || "", email || "", address || ""]
      );

      res.json({ status: "Success", message: "Supplier added" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: err.sqlMessage || "Failed to add supplier" });
    }
  }
);

app.get(
  "/shopkeeper/suppliers",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const [suppliers] = await pool.query(
        "SELECT * FROM suppliers WHERE shopkeeper_id = ? ORDER BY id DESC",
        [req.user.id]
      );

      res.json({ status: "Success", suppliers });
    } catch (err) {
      res.status(500).json({ status: "Error", suppliers: [] });
    }
  }
);

app.put(
  "/shopkeeper/suppliers/:id",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { name, phone, email, address } = req.body;

      await pool.query(
        "UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND shopkeeper_id = ?",
        [name, phone || "", email || "", address || "", req.params.id, req.user.id]
      );

      res.json({ status: "Success", message: "Supplier updated" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: "Failed to update supplier" });
    }
  }
);

app.delete(
  "/shopkeeper/suppliers/:id",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM suppliers WHERE id = ? AND shopkeeper_id = ?",
        [req.params.id, req.user.id]
      );

      res.json({ status: "Success", message: "Supplier deleted" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: "Failed to delete supplier" });
    }
  }
);

// STOCK

app.post(
  "/shopkeeper/receive-stock",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { supplier_id, product_name, quantity, remaining_quantity, cost_price } =
        req.body;

      await pool.query(
        `INSERT INTO supplier_stock 
        (shopkeeper_id, supplier_id, product_name, quantity, remaining_quantity, cost_price) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          supplier_id,
          product_name,
          Number(quantity || 0),
          Number(remaining_quantity || quantity || 0),
          Number(cost_price || 0),
        ]
      );

      res.json({ status: "Success", message: "Stock received" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: err.sqlMessage || "Failed to receive stock" });
    }
  }
);

app.get(
  "/shopkeeper/received-stock",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const [stock] = await pool.query(
        `
        SELECT supplier_stock.*, suppliers.name AS supplier_name
        FROM supplier_stock
        LEFT JOIN suppliers ON supplier_stock.supplier_id = suppliers.id
        WHERE supplier_stock.shopkeeper_id = ?
        ORDER BY supplier_stock.id DESC
        `,
        [req.user.id]
      );

      res.json({ status: "Success", stock });
    } catch (err) {
      res.status(500).json({ status: "Error", stock: [] });
    }
  }
);

app.put(
  "/shopkeeper/received-stock/:id",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { supplier_id, product_name, quantity, remaining_quantity, cost_price } =
        req.body;

      await pool.query(
        `UPDATE supplier_stock
         SET supplier_id = ?, product_name = ?, quantity = ?, remaining_quantity = ?, cost_price = ?
         WHERE id = ? AND shopkeeper_id = ?`,
        [
          supplier_id,
          product_name,
          Number(quantity || 0),
          Number(remaining_quantity || 0),
          Number(cost_price || 0),
          req.params.id,
          req.user.id,
        ]
      );

      res.json({ status: "Success", message: "Stock updated" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: "Failed to update stock" });
    }
  }
);

app.delete(
  "/shopkeeper/received-stock/:id",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM supplier_stock WHERE id = ? AND shopkeeper_id = ?",
        [req.params.id, req.user.id]
      );

      res.json({ status: "Success", message: "Stock deleted" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: "Failed to delete stock" });
    }
  }
);

// PRODUCTS

app.post(
  "/shopkeeper/products",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { title, description, price, quantity, unit, type, supplier_id } =
        req.body;

      await pool.query(
        `INSERT INTO products 
        (shopkeeper_id, supplier_id, title, description, price, quantity, unit, type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          supplier_id || null,
          title,
          description,
          Number(price || 0),
          Number(quantity || 0),
          unit || "number",
          type || "product",
          "active",
        ]
      );

      res.json({ status: "Success", message: "Product added" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: err.sqlMessage || "Failed to add product" });
    }
  }
);

app.get(
  "/shopkeeper/products",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const [products] = await pool.query(
        `
        SELECT products.*, suppliers.name AS supplier_name
        FROM products
        LEFT JOIN suppliers ON products.supplier_id = suppliers.id
        WHERE products.shopkeeper_id = ?
        ORDER BY products.id DESC
        `,
        [req.user.id]
      );

      res.json({ status: "Success", products });
    } catch (err) {
      res.status(500).json({ status: "Error", products: [] });
    }
  }
);

app.put(
  "/shopkeeper/products/:id",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { title, description, price, quantity, unit, type, supplier_id, status } =
        req.body;

      await pool.query(
        `UPDATE products 
         SET supplier_id = ?, title = ?, description = ?, price = ?, quantity = ?, unit = ?, type = ?, status = ?
         WHERE id = ? AND shopkeeper_id = ?`,
        [
          supplier_id || null,
          title,
          description,
          Number(price || 0),
          Number(quantity || 0),
          unit || "number",
          type || "product",
          status || "active",
          req.params.id,
          req.user.id,
        ]
      );

      res.json({ status: "Success", message: "Product updated" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: err.sqlMessage || "Failed to update product" });
    }
  }
);

app.delete(
  "/shopkeeper/products/:id",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM products WHERE id = ? AND shopkeeper_id = ?",
        [req.params.id, req.user.id]
      );

      res.json({ status: "Success", message: "Product deleted" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: "Failed to delete product" });
    }
  }
);

// CUSTOMER BUY

app.post(
  "/orders/:productId",
  verifyUser,
  requireRole(["customer"]),
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const quantity = Number(req.body.quantity || 1);

      await connection.beginTransaction();

      const [products] = await connection.query(
        "SELECT * FROM products WHERE id = ? AND status = 'active' FOR UPDATE",
        [req.params.productId]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.json({ status: "Error", message: "Product not found" });
      }

      const product = products[0];

      if (product.type === "product" && Number(product.quantity) < quantity) {
        await connection.rollback();
        return res.json({ status: "Error", message: "Not enough stock" });
      }

      const totalAmount = Number(product.price) * quantity;

      await connection.query(
        `INSERT INTO orders 
        (customer_id, product_id, shopkeeper_id, quantity, total_amount, status) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          product.id,
          product.shopkeeper_id,
          quantity,
          totalAmount,
          "pending",
        ]
      );

      if (product.type === "product") {
        await connection.query(
          "UPDATE products SET quantity = quantity - ? WHERE id = ?",
          [quantity, product.id]
        );
      }

      await connection.commit();

      res.json({ status: "Success", message: "Order placed" });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ status: "Error", message: err.sqlMessage || "Order failed" });
    } finally {
      connection.release();
    }
  }
);

// ORDERS

app.get(
  "/customer/orders",
  verifyUser,
  requireRole(["customer"]),
  async (req, res) => {
    try {
      const [orders] = await pool.query(
        `
        SELECT 
          orders.*,
          products.title,
          products.price,
          products.type,
          products.unit,
          shopkeeper.name AS shopkeeper_name,
          shopkeeper.email AS shopkeeper_email
        FROM orders
        JOIN products ON orders.product_id = products.id
        JOIN users AS shopkeeper ON orders.shopkeeper_id = shopkeeper.id
        WHERE orders.customer_id = ?
        ORDER BY orders.id DESC
        `,
        [req.user.id]
      );

      res.json({ status: "Success", orders });
    } catch (err) {
      res.status(500).json({ status: "Error", orders: [] });
    }
  }
);

app.get(
  "/shopkeeper/orders",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const [orders] = await pool.query(
        `
        SELECT 
          orders.*,
          products.title,
          products.price,
          products.type,
          products.unit,
          customer.name AS customer_name,
          customer.email AS customer_email
        FROM orders
        JOIN products ON orders.product_id = products.id
        JOIN users AS customer ON orders.customer_id = customer.id
        WHERE orders.shopkeeper_id = ?
        ORDER BY orders.id DESC
        `,
        [req.user.id]
      );

      res.json({ status: "Success", orders });
    } catch (err) {
      res.status(500).json({ status: "Error", orders: [] });
    }
  }
);

app.put(
  "/orders/:id/status",
  verifyUser,
  requireRole(["shopkeeper", "admin"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
        status,
        req.params.id,
      ]);

      res.json({ status: "Success", message: "Order updated" });
    } catch (err) {
      res.status(500).json({ status: "Error", message: "Failed to update order" });
    }
  }
);

// ADMIN

app.get("/admin/users", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
    );

    res.json({ status: "Success", users });
  } catch (err) {
    res.status(500).json({ status: "Error", users: [] });
  }
});

app.delete("/admin/users/:id", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ status: "Success", message: "User deleted" });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Failed to delete user" });
  }
});

app.get("/admin/products", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT products.*, users.name AS shopkeeper_name
      FROM products
      JOIN users ON products.shopkeeper_id = users.id
      ORDER BY products.id DESC
    `);

    res.json({ status: "Success", products });
  } catch (err) {
    res.status(500).json({ status: "Error", products: [] });
  }
});

app.delete("/admin/products/:id", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ status: "Success", message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Failed to delete product" });
  }
});

app.get("/admin/orders", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        orders.*,
        products.title,
        products.price,
        products.unit,
        customer.name AS customer_name,
        customer.email AS customer_email,
        shopkeeper.name AS shopkeeper_name,
        shopkeeper.email AS shopkeeper_email
      FROM orders
      JOIN products ON orders.product_id = products.id
      JOIN users AS customer ON orders.customer_id = customer.id
      JOIN users AS shopkeeper ON orders.shopkeeper_id = shopkeeper.id
      ORDER BY orders.id DESC
    `);

    res.json({ status: "Success", orders });
  } catch (err) {
    res.status(500).json({ status: "Error", orders: [] });
  }
});

app.delete("/admin/orders/:id", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);
    res.json({ status: "Success", message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Failed to delete order" });
  }
});

app.get("/admin/stats", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[products]] = await pool.query("SELECT COUNT(*) AS total FROM products");
    const [[orders]] = await pool.query("SELECT COUNT(*) AS total FROM orders");

    res.json({
      status: "Success",
      stats: {
        users: users.total,
        products: products.total,
        orders: orders.total,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: "Stats failed" });
  }
});

app.put(
  "/shopkeeper/products/:id/add-inventory",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { addQuantity } = req.body;

      if (!addQuantity || Number(addQuantity) <= 0) {
        return res.json({
          status: "Error",
          message: "Enter valid quantity",
        });
      }

      await pool.query(
        "UPDATE products SET quantity = quantity + ? WHERE id = ? AND shopkeeper_id = ?",
        [Number(addQuantity), req.params.id, req.user.id]
      );

      res.json({
        status: "Success",
        message: "Inventory added successfully",
      });
    } catch (err) {
      console.error("Add inventory error:", err);
      res.status(500).json({
        status: "Error",
        message: "Failed to add inventory",
      });
    }
  }
);
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});