import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

const Customer = () => {
  const { user, logout, login } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState("");

  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(user.name);

  const headers = { email: user.email };

  const fetchProducts = useCallback(async () => {
    const res = await API.get("/products", { headers });
    setProducts(res.data.products || []);
  }, [user.email]);

  const fetchOrders = useCallback(async () => {
    const res = await API.get("/customer/orders", { headers });
    setOrders(res.data.orders || []);
  }, [user.email]);

  useEffect(() => {
    fetchProducts().catch(() => setError("Failed to load products"));
    fetchOrders().catch(() => setError("Failed to load purchase history"));
  }, [fetchProducts, fetchOrders]);

  const updateName = async () => {
    const res = await API.put("/user/name", { name: newName }, { headers });

    if (res.data.status === "Success") {
      login(res.data.user);
      setEditName(false);
    }
  };

  const increaseQty = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Number(prev[id] || 1) + 1,
    }));
  };

  const decreaseQty = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Number(prev[id] || 1) - 1),
    }));
  };

  const buyProduct = async (product) => {
    const qty = Number(quantities[product.id] || 1);

    const res = await API.post(
      `/orders/${product.id}`,
      { quantity: qty },
      { headers }
    );

    if (res.data.status === "Success") {
      alert("Purchased successfully");
      fetchProducts();
      fetchOrders();
    } else {
      setError(res.data.message || "Purchase failed");
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h2>Customer</h2>
          <p>{user.name}</p>
          <p>{user.email}</p>

          {editName ? (
            <>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button onClick={updateName}>Save Name</button>
            </>
          ) : (
            <button onClick={() => setEditName(true)}>Edit Name</button>
          )}

          <p>Contact us:</p>
          <p>support@marketplace.com</p>
          <p>+91 9876543210</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="top-card">
          <h1>Marketplace</h1>
          <p>Buy products and services online</p>
        </div>

        {error && <div className="error">{error}</div>}

        <h2 className="section-title">Available Products</h2>

        <div className="grid">
          {products.map((product) => {
            const qty = Number(quantities[product.id] || 1);

            return (
              <div className="card" key={product.id}>
                <span className="badge">{product.type}</span>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <p>Seller: {product.shopkeeper_name}</p>

                <div className="price">
                  ₹{Number(product.price).toFixed(2)} / {product.unit}
                </div>

                <div>
                  <button onClick={() => decreaseQty(product.id)}>-</button>
                  <strong style={{ margin: "0 12px" }}>{qty}</strong>
                  <button onClick={() => increaseQty(product.id)}>+</button>
                </div>

                <button onClick={() => buyProduct(product)}>Buy Now</button>
              </div>
            );
          })}
        </div>

        <h2 className="section-title">Purchase History</h2>

        {orders.length === 0 ? (
          <div className="empty">No purchases yet</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Seller</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>INV-{order.id}</td>
                  <td>{order.title}</td>
                  <td>
                    {order.quantity} {order.unit}
                  </td>
                  <td>₹{Number(order.total_amount || 0).toFixed(2)}</td>
                  <td>{order.shopkeeper_name}</td>
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