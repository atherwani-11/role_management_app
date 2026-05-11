import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const headers = { email: user?.email };

  const [active, setActive] = useState("overview");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0 });

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadAll = async () => {
    const u = await API.get("/admin/users", { headers });
    const p = await API.get("/admin/products", { headers });
    const o = await API.get("/admin/orders", { headers });
    const s = await API.get("/admin/stats", { headers });

    setUsers(u.data.users || []);
    setProducts(p.data.products || []);
    setOrders(o.data.orders || []);
    setStats(s.data.stats || {});
  };

  const deleteUser = async (id) => {
    await API.delete(`/admin/users/${id}`, { headers });
    loadAll();
  };

  const deleteProduct = async (id) => {
    await API.delete(`/admin/products/${id}`, { headers });
    loadAll();
  };

  const deleteOrder = async (id) => {
    await API.delete(`/admin/orders/${id}`, { headers });
    loadAll();
  };

  const updateOrderStatus = async (id, status) => {
    await API.put(`/orders/${id}/status`, { status }, { headers });
    loadAll();
  };

  useEffect(() => {
    if (!user) navigate("/login");
    loadAll();
  }, []);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Admin</h2>
        <button onClick={() => setActive("overview")}>Overview</button>
        <button onClick={() => setActive("users")}>Users</button>
        <button onClick={() => setActive("products")}>Products</button>
        <button onClick={() => setActive("orders")}>Orders</button>
        <button className="logout" onClick={logout}>Logout</button>
      </aside>

      <main className="main">
        <div className="top-card">
          <h1>Admin Portal</h1>
          <p>{user?.email}</p>
        </div>

        {active === "overview" && (
          <div className="stats">
            <div className="stat-card"><h3>Total Users</h3><p>{stats.users}</p></div>
            <div className="stat-card"><h3>Total Products</h3><p>{stats.products}</p></div>
            <div className="stat-card"><h3>Total Orders</h3><p>{stats.orders}</p></div>
          </div>
        )}

        {active === "users" && (
          <section className="card">
            <h2>Manage Users</h2>
            {users.map((u) => (
              <div className="row" key={u.id}>
                <span>{u.name}</span>
                <span>{u.email}</span>
                <span>{u.role}</span>
                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </div>
            ))}
          </section>
        )}

        {active === "products" && (
          <section className="card">
            <h2>Manage Products</h2>
            {products.map((p) => (
              <div className="row" key={p.id}>
                <span>{p.title}</span>
                <span>{p.shopkeeper_name}</span>
                <span>₹{p.price}</span>
                <button onClick={() => deleteProduct(p.id)}>Delete</button>
              </div>
            ))}
          </section>
        )}

        {active === "orders" && (
          <section className="card">
            <h2>Manage Orders</h2>
            {orders.map((o) => (
              <div className="row" key={o.id}>
                <span>{o.title}</span>
                <span>{o.customer_name}</span>
                <span>{o.shopkeeper_name}</span>
                <span>₹{o.total_amount}</span>
                <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <button onClick={() => deleteOrder(o.id)}>Delete</button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;