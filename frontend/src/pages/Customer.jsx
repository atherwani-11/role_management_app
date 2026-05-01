import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

const Customer = () => {
  const { user, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const headers = { email: user.email };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await API.get("/products", { headers });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    }
  }, [user.email]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/customer/orders", { headers });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders");
    }
  }, [user.email]);

  const bookProduct = async (id) => {
    try {
      const res = await API.post(`/orders/${id}`, {}, { headers });
      alert(res.data.message);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError("Booking failed");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h2>Customer</h2>
          <p>{user.name}</p>
          <p>{user.email}</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="top-card">
          <h1>Marketplace</h1>
          <p>Book products and services online</p>
        </div>

        {error && <div className="error">{error}</div>}

        <h2 className="section-title">Available Products & Services</h2>

        {products.length === 0 ? (
          <div className="empty">No products or services available</div>
        ) : (
          <div className="grid">
            {products.map((item) => (
              <div className="card" key={item.id}>
                <span className="badge">{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p>
                  <strong>Seller:</strong> {item.shopkeeper_name}
                </p>
                <div className="price">₹{Number(item.price).toFixed(2)}</div>
                <button onClick={() => bookProduct(item.id)}>Book Now</button>
              </div>
            ))}
          </div>
        )}

        <h2 className="section-title">My Orders</h2>

        {orders.length === 0 ? (
          <div className="empty">No orders placed yet</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.title}</td>
                  <td>{order.shopkeeper_name}</td>
                  <td>₹{Number(order.price).toFixed(2)}</td>
                  <td>{order.type}</td>
                  <td>
                    <span className="status">{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default Customer;