import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";

function Shopkeeper() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [supplierStock, setSupplierStock] = useState([]);
  const [message, setMessage] = useState("");
  const [editProductId, setEditProductId] = useState(null);
  const [profileName, setProfileName] = useState(user.name || "");

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: null
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const [stockForm, setStockForm] = useState({
    supplier_id: "",
    product_id: "",
    quantity: "",
    cost_price: ""
  });

  const loadProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch (err) {
      setMessage("Failed to load products");
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      setMessage("Failed to load suppliers");
    }
  };

  const loadOrders = async () => {
    try {
      const res = await API.get("/bills/shopkeeper");
      setOrders(res.data);
    } catch (err) {
      setMessage("Failed to load orders");
    }
  };

  const loadSupplierStock = async () => {
    try {
      const res = await API.get("/supplier-stock");
      setSupplierStock(res.data);
    } catch (err) {
      // silent fail, products and suppliers still show
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append("name", productForm.name);
      data.append("description", productForm.description);
      data.append("price", productForm.price);
      data.append("stock", productForm.stock);
      data.append("shopkeeper_id", user.id);
      if (productForm.image) data.append("image", productForm.image);

      if (editProductId) {
        await API.put(`/products/${editProductId}`, data);
        setMessage("Product updated successfully");
      } else {
        await API.post("/products", data);
        setMessage("Product added successfully");
      }

      setProductForm({ name: "", description: "", price: "", stock: "", image: null });
      setEditProductId(null);
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save product");
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${user.id}`, { name: profileName });
      const updatedUser = { ...user, name: profileName };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update profile");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const editProduct = (product) => {
    setEditProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: null
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      setMessage("Product deleted successfully");
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete product");
    }
  };

  const addSupplier = async (e) => {
    e.preventDefault();
    try {
      await API.post("/suppliers", { ...supplierForm, shopkeeper_id: user.id });
      setMessage("Supplier added successfully");
      setSupplierForm({ name: "", phone: "", email: "", address: "" });
      loadSuppliers();
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || "Failed to add supplier");
    }
  };

  const deleteSupplier = async (id) => {
    try {
      await API.delete(`/suppliers/${id}`);
      setMessage("Supplier deleted successfully");
      loadSuppliers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete supplier");
    }
  };

  const receiveStock = async (e) => {
    e.preventDefault();
    try {
      await API.post("/supplier-stock", {
        ...stockForm,
        shopkeeper_id: user.id
      });
      setMessage("Stock received successfully");
      setStockForm({ supplier_id: "", product_id: "", quantity: "", cost_price: "" });
      loadProducts();
      loadSupplierStock();
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to receive stock");
    }
  };

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadOrders();
    loadSupplierStock();
  }, []);

  const totalInventory = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const completedOrders = orders.filter((order) => order.status?.toLowerCase() === "completed").length;
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>Shopkeeper Panel</h1>
          <p>Manage products, suppliers, stock receipts, and orders from one colorful dashboard.</p>
        </div>

        <div className="action-row">
          <Link to="/shopkeeper-bills" className="btn secondary">View Orders</Link>
          <Link to="/admin" className="btn">Admin Panel</Link>
          <button className="btn danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <form onSubmit={updateProfile} className="form">
        <h2>Edit Profile Name</h2>
        <input
          type="text"
          placeholder="Your Name"
          required
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
        <button className="btn" type="submit">Save Name</button>
      </form>

      <div className="stats-grid">
        <div className="card highlight">
          <h2>{products.length}</h2>
          <p>Products / Services</p>
        </div>
        <div className="card highlight">
          <h2>{totalInventory}</h2>
          <p>Total Inventory</p>
        </div>
        <div className="card highlight">
          <h2>{orders.length}</h2>
          <p>Total Orders</p>
        </div>
        <div className="card highlight">
          <h2>{completedOrders}</h2>
          <p>Completed Sales</p>
        </div>
        <div className="card highlight">
          <h2>₹{totalSales}</h2>
          <p>Total Revenue</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card contact-card">
          <h2>Contact Support</h2>
          <p>If you need assistance, email atherwani333@gmail.com</p>
          <p>Phone: +91 9149756267</p>
          <p>Address: Bulgam Sopore, Baramulla, India</p>
          <p>Admin and customer support are available for billing, inventory, and supplier issues.</p>
        </div>
      </div>

      <form onSubmit={saveProduct} className="form">
        <h2>{editProductId ? "Edit Product or Service" : "Add Product or Service"}</h2>

        <input
          type="text"
          placeholder="Name"
          required
          value={productForm.name}
          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
        />

        <textarea
          placeholder="Description"
          value={productForm.description}
          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
        />

        <input
          type="number"
          placeholder="Price"
          required
          value={productForm.price}
          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
        />

        <input
          type="number"
          placeholder="Stock"
          value={productForm.stock}
          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProductForm({ ...productForm, image: e.target.files[0] })}
        />

        <button className="btn" type="submit">
          {editProductId ? "Update Product" : "Add Product"}
        </button>
      </form>

      <div className="grid">
        <div className="card">
          <h2>Supplier List</h2>
          <form onSubmit={addSupplier} className="form">
            <input
              type="text"
              placeholder="Supplier Name"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Phone"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
            />
            <textarea
              placeholder="Address"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            />
            <button className="btn" type="submit">Add Supplier</button>
          </form>

          {suppliers.length === 0 ? (
            <p>No suppliers yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.email || "-"}</td>
                    <td>{supplier.phone || "-"}</td>
                    <td>
                      <button className="btn secondary" onClick={() => deleteSupplier(supplier.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Receive Stock from Supplier</h2>
          {supplierStock.length > 0 && (
            <p className="small-tag">
              Last received: {supplierStock[0].quantity} x {supplierStock[0].product_name} from {supplierStock[0].supplier_name || "supplier"} on {new Date(supplierStock[0].created_at).toLocaleString()}
            </p>
          )}
          <form onSubmit={receiveStock} className="form">
            <select
              required
              value={stockForm.supplier_id}
              onChange={(e) => setStockForm({ ...stockForm, supplier_id: e.target.value })}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
            <select
              required
              value={stockForm.product_id}
              onChange={(e) => setStockForm({ ...stockForm, product_id: e.target.value })}
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity Received"
              required
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
            />
            <input
              type="number"
              placeholder="Cost Price"
              value={stockForm.cost_price}
              onChange={(e) => setStockForm({ ...stockForm, cost_price: e.target.value })}
            />
            <button className="btn" type="submit">Receive Stock</button>
          </form>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card">
          <h2>Received Stock History</h2>
          {supplierStock.length === 0 ? (
            <p>No stock receipts yet.</p>
          ) : (
            supplierStock.map((entry) => (
              <div key={entry.id} className="bill">
                <p><strong>{entry.product_name}</strong> from {entry.supplier_name || "Unknown Supplier"}</p>
                <p>Qty: {entry.quantity} | Cost: ₹{entry.cost_price}</p>
                <p className="small-tag">Received: {new Date(entry.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <h2>Inventory</h2>
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
            <p><strong>Price:</strong> ₹{product.price}</p>
            <p><strong>Stock:</strong> {product.stock}</p>
            <div className="action-row">
              <button className="btn secondary" onClick={() => editProduct(product)}>Edit</button>
              <button className="btn danger" onClick={() => removeProduct(product.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shopkeeper;
