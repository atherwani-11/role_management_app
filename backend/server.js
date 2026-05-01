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
      return res.status(401).json({
        status: "Error",
        message: "Email header missing",
      });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        status: "Error",
        message: "User not found",
      });
    }

    req.user = users[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Authentication failed",
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "Error",
        message: "Access denied",
      });
    }

    next();
  };
};

app.get("/", (req, res) => {
  res.json({
    status: "Success",
    message: "Backend is running",
  });
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({
        status: "Error",
        message: "All fields are required",
      });
    }

    if (!["customer", "shopkeeper", "admin"].includes(role)) {
      return res.json({
        status: "Error",
        message: "Invalid role selected",
      });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length > 0) {
      return res.json({
        status: "Error",
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.json({
      status: "Success",
      message: "Account created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Registration failed",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.json({
        status: "Error",
        message: "Invalid email",
      });
    }

    const user = users[0];

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.json({
        status: "Error",
        message: "Invalid password",
      });
    }

    res.json({
      status: "Success",
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Login failed",
    });
  }
});

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

    res.json({
      status: "Success",
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Failed to load products",
    });
  }
});

app.post(
  "/shopkeeper/products",
  verifyUser,
  requireRole(["shopkeeper"]),
  async (req, res) => {
    try {
      const { title, description, price, type } = req.body;

      if (!title || !description || !price || !type) {
        return res.json({
          status: "Error",
          message: "All fields are required",
        });
      }

      await pool.query(
        "INSERT INTO products (shopkeeper_id, title, description, price, type) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, title, description, price, type]
      );

      res.json({
        status: "Success",
        message: "Product/service uploaded successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to upload item",
      });
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
        "SELECT * FROM products WHERE shopkeeper_id = ? ORDER BY id DESC",
        [req.user.id]
      );

      res.json({
        status: "Success",
        products,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to load shopkeeper products",
      });
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

      res.json({
        status: "Success",
        message: "Item deleted successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to delete item",
      });
    }
  }
);

app.post(
  "/orders/:productId",
  verifyUser,
  requireRole(["customer"]),
  async (req, res) => {
    try {
      const [products] = await pool.query(
        "SELECT * FROM products WHERE id = ? AND status = 'active'",
        [req.params.productId]
      );

      if (products.length === 0) {
        return res.json({
          status: "Error",
          message: "Product/service not found",
        });
      }

      const product = products[0];

      await pool.query(
        "INSERT INTO orders (customer_id, product_id, shopkeeper_id) VALUES (?, ?, ?)",
        [req.user.id, product.id, product.shopkeeper_id]
      );

      res.json({
        status: "Success",
        message: "Order placed successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to place order",
      });
    }
  }
);

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
          users.name AS shopkeeper_name
        FROM orders
        JOIN products ON orders.product_id = products.id
        JOIN users ON orders.shopkeeper_id = users.id
        WHERE orders.customer_id = ?
        ORDER BY orders.id DESC
        `,
        [req.user.id]
      );

      res.json({
        status: "Success",
        orders,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to load orders",
      });
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
          users.name AS customer_name,
          users.email AS customer_email
        FROM orders
        JOIN products ON orders.product_id = products.id
        JOIN users ON orders.customer_id = users.id
        WHERE orders.shopkeeper_id = ?
        ORDER BY orders.id DESC
        `,
        [req.user.id]
      );

      res.json({
        status: "Success",
        orders,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to load shopkeeper orders",
      });
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

      if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
        return res.json({
          status: "Error",
          message: "Invalid order status",
        });
      }

      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
        status,
        req.params.id,
      ]);

      res.json({
        status: "Success",
        message: "Order status updated",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "Error",
        message: "Failed to update order",
      });
    }
  }
);

app.get("/admin/users", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
    );

    res.json({
      status: "Success",
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Failed to load users",
    });
  }
});

app.get("/admin/orders", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        orders.*,
        products.title,
        products.price,
        products.type,
        customer.name AS customer_name,
        shopkeeper.name AS shopkeeper_name
      FROM orders
      JOIN products ON orders.product_id = products.id
      JOIN users AS customer ON orders.customer_id = customer.id
      JOIN users AS shopkeeper ON orders.shopkeeper_id = shopkeeper.id
      ORDER BY orders.id DESC
    `);

    res.json({
      status: "Success",
      orders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Failed to load orders",
    });
  }
});

app.get("/admin/stats", verifyUser, requireRole(["admin"]), async (req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[products]] = await pool.query(
      "SELECT COUNT(*) AS total FROM products"
    );
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
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Failed to load stats",
    });
  }
});

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});