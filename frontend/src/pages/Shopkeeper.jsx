import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

const Shopkeeper = () => {
  const { user, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "product",
  });

  const headers = { email: user.email };

  const fetchItems = useCallback(async () => {
    try {
      const res = await API.get("/shopkeeper/products", { headers });
      setItems(res.data.products || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load items");
    }
  }, [user.email]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/shopkeeper/orders", { headers });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders");
    }
  }, [user.email]);

  useEffect(() => {
    fetchItems();
    fetchOrders();
  }, [fetchItems, fetchOrders]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/shopkeeper/products", formData, {
        headers,
      });

      if (res.data.status === "Success") {
        alert(res.data.message);

        setFormData({
          title: "",
          description: "",
          price: "",
          type: "product",
        });

        fetchItems();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to upload item");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await API.delete(`/shopkeeper/products/${id}`, { headers });
      fetchItems();
    } catch (err) {
      console.error(err);
      setError("Failed to delete item");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status }, { headers });
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError("Failed to update order");
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h2>Shopkeeper</h2>
          <p>{user.name}</p>
          <p>{user.email}</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="top-card">
          <h1>Shopkeeper Panel</h1>
          <p>Upload products and services for customers</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form className="form-card" onSubmit={addItem}>
          <h2>Add Product / Service</h2>

          <label>Title</label>
          <input
            name="title"
            placeholder="Enter title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <label>Price</label>
          <input
            name="price"
            type="number"
            placeholder="Enter price"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="product">Product</option>
            <option value="service">Service</option>
          </select>

          <button type="submit">Upload</button>
        </form>

        <h2 className="section-title">My Products & Services</h2>

        {items.length === 0 ? (
          <div className="empty">No items uploaded yet</div>
        ) : (
          <div className="grid">
            {items.map((item) => (
              <div className="card" key={item.id}>
                <span className="badge">{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="price">₹{Number(item.price).toFixed(2)}</div>
                <button className="danger-btn" onClick={() => deleteItem(item.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 className="section-title">Orders Received</h2>

        {orders.length === 0 ? (
          <div className="empty">No orders received yet</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Item</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customer_name}</td>
                  <td>{order.title}</td>
                  <td>₹{Number(order.price).toFixed(2)}</td>
                  <td>
                    <span className="status">{order.status}</span>
                  </td>
                  <td>
                    <button onClick={() => updateStatus(order.id, "accepted")}>
                      Accept
                    </button>
                    <button onClick={() => updateStatus(order.id, "completed")}>
                      Complete
                    </button>
                    <button
                      className="danger-btn"
                      onClick={() => updateStatus(order.id, "rejected")}
                    >
                      Reject
                    </button>
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

export default Shopkeeper;