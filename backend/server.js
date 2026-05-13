const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

const PORT = process.env.PORT || 8081;

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let dbConfig;
if (dbUrl) {
  const parsedUrl = new URL(dbUrl);
  dbConfig = {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
    user: parsedUrl.username,
    password: parsedUrl.password,
    database: parsedUrl.pathname?.slice(1) || process.env.DB_NAME || process.env.MYSQLDATABASE || "railway",
    waitForConnections: true,
    connectionLimit: 10
  };
} else {
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || "localhost";
  const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || "3306";
  const dbUser = process.env.DB_USER || process.env.MYSQLUSER || "root";
  const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
  const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || "railway";

  dbConfig = {
    host: dbHost,
    port: Number(dbPort),
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10
  };
}

console.log("Using DB_HOST=", dbConfig.host);
console.log("Using DB_NAME=", dbConfig.database);

const pool = mysql.createPool(dbConfig);

/* CREATE TABLES */

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shopkeeper_id INT DEFAULT NULL,
      supplier_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      quantity INT DEFAULT 0,
      image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_email VARCHAR(255) NOT NULL,
      product_id INT NOT NULL,
      quantity INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_email VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      quantity INT DEFAULT 1,
      subtotal DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_stock (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shopkeeper_id INT DEFAULT NULL,
      supplier_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      remaining_quantity INT NOT NULL,
      cost_price DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database tables ready");
}

initTables().catch((err) => {
  console.error("Table initialization failed:", err.message);
});

/* IMAGE UPLOAD */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/* TEST */

app.get("/", (req, res) => {
  res.json({ message: "Backend running successfully" });
});

/* AUTH */

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "Error",
        message: "Name, email, and password are required"
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        status: "Error",
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "customer"]
    );

    res.json({
      status: "Success",
      message: "Signup successful",
      user: {
        id: result.insertId,
        name,
        email,
        role: role || "customer"
      }
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: "Signup failed",
      error: err.message
    });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "Error",
        message: "Name, email, and password are required"
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        status: "Error",
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "customer"]
    );

    res.json({
      status: "Success",
      message: "Registration successful",
      user: {
        id: result.insertId,
        name,
        email,
        role: role || "customer"
      }
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: "Registration failed",
      error: err.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "Error",
        message: "Email and password are required"
      });
    }

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: "Error",
        message: "Invalid email or password"
      });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        status: "Error",
        message: "Invalid email or password"
      });
    }

    res.json({
      status: "Success",
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: "Login failed",
      error: err.message
    });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        status: "Error",
        message: "Email and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "Error",
        message: "Password must be at least 6 characters"
      });
    }

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "Email not found in system"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    res.json({
      status: "Success",
      message: "Password updated successfully"
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: "Password reset failed",
      error: err.message
    });
  }
});

/* USERS */

app.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load users",
      error: err.message
    });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete user",
      error: err.message
    });
  }
});

/* PRODUCTS */

app.get("/products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        shopkeeper_id,
        supplier_id,
        title AS name,
        description,
        price,
        quantity AS stock,
        image,
        created_at
      FROM products
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load products",
      error: err.message
    });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, stock, shopkeeper_id, supplier_id } =
      req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price) {
      return res.status(400).json({
        message: "Product name and price are required"
      });
    }

    await pool.query(
      `INSERT INTO products 
      (shopkeeper_id, supplier_id, title, description, price, quantity, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shopkeeper_id || null,
        supplier_id || null,
        name,
        description || "",
        price,
        stock || 0,
        image
      ]
    );

    res.json({ message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to add product",
      error: err.message
    });
  }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, stock, supplier_id } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("title = ?");
      values.push(name);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }

    if (price !== undefined) {
      fields.push("price = ?");
      values.push(price);
    }

    if (stock !== undefined) {
      fields.push("quantity = ?");
      values.push(stock);
    }

    if (supplier_id !== undefined) {
      fields.push("supplier_id = ?");
      values.push(supplier_id || null);
    }

    if (req.file) {
      fields.push("image = ?");
      values.push(`/uploads/${req.file.filename}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: "At least one field is required"
      });
    }

    values.push(req.params.id);

    await pool.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update product",
      error: err.message
    });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete product",
      error: err.message
    });
  }
});

/* SUPPLIERS */

app.get("/suppliers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM suppliers ORDER BY id DESC");

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load suppliers",
      error: err.message
    });
  }
});

app.post("/suppliers", async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Supplier name is required"
      });
    }

    await pool.query(
      "INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)",
      [name, phone || "", email || "", address || ""]
    );

    res.json({ message: "Supplier added successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to add supplier",
      error: err.message
    });
  }
});

app.delete("/suppliers/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM suppliers WHERE id = ?", [req.params.id]);

    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete supplier",
      error: err.message
    });
  }
});

/* SUPPLIER STOCK */

app.post("/supplier-stock", async (req, res) => {
  try {
    const { supplier_id, product_id, quantity, cost_price, shopkeeper_id } = req.body;

    if (!supplier_id || !product_id || !quantity) {
      return res.status(400).json({ message: "Supplier, product, and quantity are required" });
    }

    // Get product name from product_id
    const [products] = await pool.query(
      "SELECT title FROM products WHERE id = ?",
      [product_id]
    );
    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product_name = products[0].title;

    // Use shopkeeper_id if provided, otherwise use 1 as default
    const shop_id = shopkeeper_id || 1;

    await pool.query(
      "INSERT INTO supplier_stock (shopkeeper_id, supplier_id, product_name, quantity, remaining_quantity, cost_price) VALUES (?, ?, ?, ?, ?, ?)",
      [shop_id, supplier_id, product_name, quantity, quantity, cost_price || 0]
    );

    // Update product quantity
    await pool.query(
      "UPDATE products SET quantity = quantity + ? WHERE id = ?",
      [quantity, product_id]
    );

    res.json({ message: "Stock received and inventory updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to receive stock", error: err.message });
  }
});

app.get("/supplier-stock", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        ss.id,
        ss.shopkeeper_id,
        ss.supplier_id,
        ss.product_name,
        ss.quantity,
        ss.remaining_quantity,
        ss.cost_price,
        ss.created_at,
        suppliers.name AS supplier_name
      FROM supplier_stock ss
      LEFT JOIN suppliers ON ss.supplier_id = suppliers.id
      ORDER BY ss.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load supplier stock", error: err.message });
  }
});

/* CART */

app.get("/cart/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        cart.id AS cart_id,
        cart.quantity,
        products.id AS product_id,
        products.title AS name,
        products.description,
        products.price,
        products.image,
        products.quantity AS stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.customer_email = ?`,
      [email]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load cart",
      error: err.message
    });
  }
});

app.post("/cart", async (req, res) => {
  try {
    const { customer_email, product_id, quantity } = req.body;
    const requestedQuantity = Number(quantity) || 1;

    if (!customer_email || !product_id) {
      return res.status(400).json({
        message: "Customer email and product ID required"
      });
    }

    if (requestedQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1"
      });
    }

    const [productRows] = await pool.query(
      "SELECT quantity FROM products WHERE id = ?",
      [product_id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const stock = Number(productRows[0].quantity || 0);

    if (stock < 1) {
      return res.status(400).json({
        message: "Product is out of stock"
      });
    }

    const [existing] = await pool.query(
      "SELECT * FROM cart WHERE customer_email = ? AND product_id = ?",
      [customer_email, product_id]
    );

    const currentQuantity =
      existing.length > 0 ? Number(existing[0].quantity || 0) : 0;

    const newQuantity = currentQuantity + requestedQuantity;

    if (newQuantity > stock) {
      return res.status(400).json({
        message: `Only ${stock} item(s) available in stock`
      });
    }

    if (existing.length > 0) {
      await pool.query(
        "UPDATE cart SET quantity = ? WHERE customer_email = ? AND product_id = ?",
        [newQuantity, customer_email, product_id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart (customer_email, product_id, quantity) VALUES (?, ?, ?)",
        [customer_email, product_id, requestedQuantity]
      );
    }

    res.json({ message: "Product added to cart" });
  } catch (err) {
    console.error("ADD CART ERROR:", err);

    res.status(500).json({
      message: "Failed to add cart",
      error: err.message
    });
  }
});

app.put("/cart/:cartId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const newQuantity = Number(quantity);

    if (!newQuantity || newQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1"
      });
    }

    const [cartRows] = await pool.query(
      `SELECT 
        cart.product_id,
        products.quantity AS stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.id = ?`,
      [req.params.cartId]
    );

    if (cartRows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found"
      });
    }

    if (newQuantity > Number(cartRows[0].stock)) {
      return res.status(400).json({
        message: `Only ${cartRows[0].stock} item(s) available in stock`
      });
    }

    await pool.query(
      "UPDATE cart SET quantity = ? WHERE id = ?",
      [newQuantity, req.params.cartId]
    );

    res.json({ message: "Cart updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update cart",
      error: err.message
    });
  }
});

app.delete("/cart/:cartId", async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE id = ?", [req.params.cartId]);

    res.json({ message: "Removed from cart" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to remove item",
      error: err.message
    });
  }
});

/* CHECKOUT */

app.post("/checkout", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { customer_email, customer_name, phone, address } = req.body;

    if (!customer_email || !phone || !address) {
      return res.status(400).json({
        message: "Email, phone and address are required"
      });
    }

    await connection.beginTransaction();

    const [cartItems] = await connection.query(
      `SELECT 
        cart.quantity,
        products.id AS product_id,
        products.title AS name,
        products.price,
        products.quantity AS stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.customer_email = ?`,
      [customer_email]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    let total = 0;

    for (const item of cartItems) {
      if (Number(item.quantity) > Number(item.stock)) {
        await connection.rollback();
        return res.status(400).json({
          message: `${item.name} has only ${item.stock} items in stock`
        });
      }

      total += Number(item.price) * Number(item.quantity);
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders
      (customer_email, customer_name, phone, address, payment_method, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_email,
        customer_name || "",
        phone,
        address,
        "Cash on Delivery",
        total,
        "Pending"
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      const subtotal = Number(item.price) * Number(item.quantity);

      await connection.query(
        `INSERT INTO order_items
        (order_id, product_id, product_name, price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.name,
          item.price,
          item.quantity,
          subtotal
        ]
      );

      await connection.query(
        "UPDATE products SET quantity = quantity - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await connection.query("DELETE FROM cart WHERE customer_email = ?", [
      customer_email
    ]);

    await connection.commit();

    res.json({
      message: "Order placed successfully",
      order_id: orderId
    });
  } catch (err) {
    await connection.rollback();

    console.error("CHECKOUT ERROR:", err);

    res.status(500).json({
      message: "Checkout failed",
      error: err.message
    });
  } finally {
    connection.release();
  }
});

/* BILLS */

app.get("/bills/customer/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE customer_email = ? ORDER BY id DESC",
      [email]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id]
      );

      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load customer bills",
      error: err.message
    });
  }
});

app.get("/bills/shopkeeper", async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY id DESC");

    for (const order of orders) {
      const [items] = await pool.query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id]
      );

      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load shopkeeper bills",
      error: err.message
    });
  }
});

/* ORDER STATUS */

app.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "Accepted", "Rejected", "Completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      req.params.id
    ]);

    res.json({ message: `Order marked as ${status}` });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update order status",
      error: err.message
    });
  }
});

/* START SERVER */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});