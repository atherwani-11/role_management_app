const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "role_management_app",
  });

  console.log("Starting migrations...");

  try {
    // Add image_url to products
    await connection.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) AFTER type
    `);
    console.log("Updated products table");

    // Add payment fields to orders
    await connection.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method ENUM('COD', 'Online') DEFAULT 'COD' AFTER total_amount
    `);
    await connection.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid' AFTER payment_method
    `);
    await connection.query(`
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address TEXT AFTER payment_status
    `);
     console.log("Updated orders table");

    // Create cart table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log("Created cart table");

    console.log("Migrations finished successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

migrate();
