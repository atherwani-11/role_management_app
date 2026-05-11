import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const customerEmail = user.email || localStorage.getItem("email");

  const [form, setForm] = useState({
    customer_name: user.name || "",
    phone: "",
    address: ""
  });

  const loadCart = async () => {
    try {
      setMessage("");

      if (!customerEmail) {
        setMessage("Please login to view your cart.");
        return;
      }

      const res = await API.get(`/cart/${customerEmail}`);
      setCart(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load cart");
    }
  };

  const removeItem = async (cartId) => {
    try {
      await API.delete(`/cart/${cartId}`);
      await loadCart();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to remove item");
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        setMessage("Quantity must be at least 1");
        return;
      }

      await API.put(`/cart/${cartId}`, { quantity: newQuantity });
      await loadCart();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const total = cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const checkout = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      if (!customerEmail) {
        setMessage("Please login to place an order.");
        setLoading(false);
        return;
      }

      if (cart.length === 0) {
        setMessage("Your cart is empty.");
        setLoading(false);
        return;
      }

      if (!form.phone || !form.address) {
        setMessage("Phone number and address are required.");
        setLoading(false);
        return;
      }

      const res = await API.post("/checkout", {
        customer_email: customerEmail,
        customer_name: form.customer_name || user.name || "",
        phone: form.phone,
        address: form.address
      });

      setMessage(`Order placed successfully. Bill ID: ${res.data.order_id}`);
      setCart([]);

      setTimeout(() => {
        navigate("/customer-bills");
      }, 1000);
    } catch (err) {
      console.log("Checkout error:", err.response?.data || err.message);

      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Checkout failed. Check backend and database tables."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <div className="page">
      <div className="topbar">
        <h1>My Cart</h1>
        <Link to="/customer" className="btn">
          Back
        </Link>
      </div>

      {message && <p className="message">{message}</p>}

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div className="cart-item" key={item.cart_id}>
              <h3>{item.name}</h3>

              <p>Price: ₹{item.price}</p>
              
              <div className="quantity-control">
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.cart_id, Number(item.quantity) - 1)}
                  disabled={item.quantity <= 1}
                  title="Decrease quantity"
                >
                  ➖
                </button>
                <span className="qty-display">Qty: {item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.cart_id, Number(item.quantity) + 1)}
                  title="Increase quantity"
                >
                  ➕
                </button>
              </div>
              
              <p>
                Subtotal: ₹
                {Number(item.price || 0) * Number(item.quantity || 0)}
              </p>

              <button
                className="danger"
                onClick={() => removeItem(item.cart_id)}
              >
                Remove
              </button>
            </div>
          ))}

          <h2>Total: ₹{total}</h2>

          <form onSubmit={checkout} className="form">
            <h2>Cash on Delivery Details</h2>

            <input
              type="text"
              placeholder="Your Name"
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Phone Number"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <textarea
              placeholder="Delivery Address"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Placing Order..." : "Place Order - Cash on Delivery"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Cart;