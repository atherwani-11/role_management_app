import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

const Admin = () => {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0 });

  const headers = { email: user.email };

  const fetchAdminData = useCallback(async () => {
    const usersRes = await API.get("/admin/users", { headers });
    const productsRes = await API.get("/admin/products", { headers });
    const ordersRes = await API.get("/admin/orders", { headers });
    const statsRes = await API.get("/admin/stats", { headers });

    setUsers(usersRes.data.users || []);
    setProducts(productsRes.data.products || []);
    setOrders(ordersRes.data.orders || []);
    setStats(statsRes.data.stats || {});
  }, [user.email]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await API.delete(`/admin/users/${id}`, { headers });
    fetchAdminData();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await API.delete(`/admin/products/${id}`, { headers });
    fetchAdminData();
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    await API.delete(`/admin/orders/${id}`, { headers });
    fetchAdminData();
  };

  const updateOrderStatus = async (id, status) => {
    await API.put(`/orders/${id}/status`, { status }, { headers });
    fetchAdminData();
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h2>Admin</h2>
          <p>{user.name}</p>
          <p>{user.email}</p>
          <p>Contact: admin@marketplace.com</p>
          <p>Phone: +91 9876543210</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="top-card">
          <h1>Admin Dashboard</h1>
          <p>Manage users, products, orders and platform data</p>
        </div>

        <div className="stats">
          <div className="stat-card">
            <span>Users</span>
            <h2>{stats.users}</h2>
          </div>

          <div className="stat-card">
            <span>Products</span>
            <h2>{stats.products}</h2>
          </div>

          <div className="stat-card">
            <span>Orders</span>
            <h2>{stats.orders}</h2>
          </div>
        </div>

        <h2 className="section-title">Manage Users</h2>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button className="danger-btn" onClick={() => deleteUser(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="section-title">Manage Products</h2>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Shopkeeper</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.shopkeeper_name}</td>
                <td>₹{Number(p.price).toFixed(2)}</td>
                <td>
                  {p.quantity} {p.unit}
                </td>
                <td>
                  <button className="danger-btn" onClick={() => deleteProduct(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="section-title">Manage Orders</h2>

        <table>
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>Customer</th>
              <th>Shopkeeper</th>
              <th>Product</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>INV-{o.id}</td>
                <td>{o.customer_name}</td>
                <td>{o.shopkeeper_name}</td>
                <td>{o.title}</td>
                <td>₹{Number(o.total_amount || 0).toFixed(2)}</td>
                <td>{o.status}</td>
                <td>
                  <button onClick={() => updateOrderStatus(o.id, "accepted")}>
                    Accept
                  </button>
                  <button onClick={() => updateOrderStatus(o.id, "completed")}>
                    Complete
                  </button>
                  <button onClick={() => updateOrderStatus(o.id, "rejected")}>
                    Reject
                  </button>
                  <button className="danger-btn" onClick={() => deleteOrder(o.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Admin;