import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";

function Customer() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [profileName, setProfileName] = useState(user.name || "");

  const customerEmail = user?.email || localStorage.getItem("email") || "";
  const customerId = user?.id;

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const loadProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
      const initialQuantities = (res.data || []).reduce((acc, product) => {
        acc[product.id] = 1;
        return acc;
      }, {});
      setQuantities(initialQuantities);
    } catch (err) {
      showToast("error", "Failed to load products.");
    }
  };

  const addToCart = async (productId) => {
    try {
      if (!customerEmail) {
        showToast("error", "Please login first to add items to your cart.");
        return false;
      }

      const quantity = Number(quantities[productId]) || 1;
      const product = products.find((item) => item.id === productId);

      if (!product) {
        showToast("error", "Product not found.");
        return false;
      }

      if (quantity > product.stock) {
        showToast("error", `Only ${product.stock} item(s) available in stock.`);
        return false;
      }

      await API.post("/cart", {
        customer_email: customerEmail,
        product_id: productId,
        quantity
      });

      showToast("success", `Added ${quantity} item(s) to cart.`);
      return true;
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to add cart.");
      return false;
    }
  };

  const buyNow = async (productId) => {
    const added = await addToCart(productId);
    if (added) {
      navigate("/cart");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${customerId}`, { name: profileName });
      localStorage.setItem("user", JSON.stringify({ ...user, name: profileName }));
      showToast("success", "Name updated successfully.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update name.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>Customer Portal</h1>
          <p>Welcome back, {user.name || "Customer"}.</p>
        </div>
        <div className="action-row">
          <Link to="/cart" className="btn">Cart</Link>
          <Link to="/customer-bills" className="btn">My Bills</Link>
          <Link to="/customer-contact" className="btn secondary">Contact Us</Link>
          <button className="btn danger" onClick={logout}>Logout</button>
        </div>
      </div>

      {toastMessage && (
        <div className={`toast ${toastType}`}>
          {toastMessage}
        </div>
      )}
      <form onSubmit={updateProfile} className="form">
        <h2>Edit Your Name</h2>
        <input
          type="text"
          placeholder="Your Name"
          required
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
        <button className="btn" type="submit">Save Name</button>
      </form>
      <p className="small-tag">Need help? Contact atherwani333@gmail.com or call +91 9149756267.</p>

      <div className="grid">
        {products.map((product) => (
          <div className="card" key={product.id}>
            {product.image && (
              <img
                src={`${API.defaults.baseURL}${product.image}`}
                alt={product.name}
                className="product-img"
              />
            )}

            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <h2>₹{product.price}</h2>
            <p>Stock: {product.stock}</p>

            <div className="action-row qty-row">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setQuantities((prev) => ({
                  ...prev,
                  [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                }))}
                disabled={(quantities[product.id] || 1) <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantities[product.id] || 1}
                onChange={(e) => setQuantities((prev) => ({
                  ...prev,
                  [product.id]: Math.max(1, Number(e.target.value) || 1)
                }))}
                className="qty-input"
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => setQuantities((prev) => ({
                  ...prev,
                  [product.id]: (prev[product.id] || 1) + 1
                }))}
              >
                +
              </button>
            </div>

            <div className="action-row">
              <button
                type="button"
                className="btn"
                onClick={() => addToCart(product.id)}
                disabled={product.stock <= 0}
              >
                Add to Cart
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => buyNow(product.id)}
                disabled={product.stock <= 0}
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Customer;