const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'role_management_app'
  });

  try {
    const [tables] = await pool.query('SHOW TABLES LIKE "cart"');
    console.log('Cart table exists:', tables.length > 0);

    if (tables.length > 0) {
      const [cols] = await pool.query('SHOW COLUMNS FROM cart');
      console.log('Cart columns:', cols.map(c => c.Field));
    }

    // Try inserting a test cart item
    const [result] = await pool.query(
      'INSERT INTO cart (customer_email, product_id, quantity) VALUES (?, ?, ?)',
      ['test@example.com', 1, 1]
    );
    console.log('Test insert result:', result);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
