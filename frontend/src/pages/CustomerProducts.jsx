import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

const CustomerProducts = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const loadProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data || []);
      const initialQuantities = (res.data || []).reduce((acc, product) => {
        acc[product.id] = 1;
        return acc;
      }, {});
      setQuantities(initialQuantities);
    } catch (err) {
      console.error(err);
      alert("Failed to load products");
    }
  };

  const addToCart = async (productId) => {
    try {
      if (!user?.email) {
        alert("Please login before adding items to the cart.");
        return;
      }

      const quantity = Number(quantities[productId]) || 1;
      const product = products.find((item) => item.id === productId);

      if (!product) {
        alert("Product not found.");
        return;
      }

      if (quantity > product.stock) {
        alert(`Only ${product.stock} item(s) available in stock.`);
        return;
      }

      const res = await API.post("/cart", {
        customer_email: user.email,
        product_id: productId,
        quantity
      });

      alert(res.data.message || `Added ${quantity} item(s) to cart.`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add cart.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="page">
      <h2>Customer Products</h2>

      <Link to="/cart">Cart</Link>{" | "}
      <Link to="/customer-bills">My Bills</Link>

      {products.length === 0 ? (
        <p>No products available</p>
      ) : (
        products.map((p) => (
          <div key={p.id} className="product-card">
            {p.image && (
              <img
                src={`${API.defaults.baseURL}${p.image}`}
                alt={p.name}
                width="160"
                height="120"
                style={{ objectFit: "cover" }}
              />
            )}

            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p>Price: ₹{p.price}</p>
            <p>Stock: {p.stock}</p>
            <p>Shopkeeper: {p.shopkeeper_name}</p>

            <div className="action-row qty-row">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setQuantities((prev) => ({
                  ...prev,
                  [p.id]: Math.max(1, (prev[p.id] || 1) - 1)
                }))}
                disabled={(quantities[p.id] || 1) <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantities[p.id] || 1}
                onChange={(e) => setQuantities((prev) => ({
                  ...prev,
                  [p.id]: Math.max(1, Number(e.target.value) || 1)
                }))}
                className="qty-input"
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => setQuantities((prev) => ({
                  ...prev,
                  [p.id]: (prev[p.id] || 1) + 1
                }))}
              >
                +
              </button>
            </div>

            <button type="button" onClick={() => addToCart(p.id)}>Add to Cart</button>
          </div>
        ))
      )}
    </div>
  );
};

export default CustomerProducts;