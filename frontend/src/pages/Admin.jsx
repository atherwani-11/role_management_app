import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

function Admin() {
  const navigate = useNavigate();

  const authUser = JSON.parse(localStorage.getItem("user")) || {};
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState("");
  const [profileName, setProfileName] = useState(authUser.name || "");
  const [editUserId, setEditUserId] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [editSupplierForm, setEditSupplierForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [stockForm, setStockForm] = useState({ supplier_id: "", product_id: "", quantity: "", cost_price: "" });
  const [editProductId, setEditProductId] = useState(null);
  const [editProductForm, setEditProductForm] = useState({ name: "", description: "", price: "", stock: "" });

  const supportEmail = "support@rolemanagement.app";

  const loadAdminData = async () => {
    try {
      const usersRes = await API.get("/users");
      const productsRes = await API.get("/products");
      const suppliersRes = await API.get("/suppliers");
      const billsRes = await API.get("/bills/shopkeeper");

      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
      setBills(billsRes.data);
    } catch (err) {
      setMessage("Failed to load admin data");
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
      const res = await API.put(`/users/${authUser.id}`, { name: profileName });
      localStorage.setItem("user", JSON.stringify({ ...authUser, name: profileName }));
      setUsers((prev) => prev.map((u) => (u.id === authUser.id ? res.data.user : u)));
      setMessage("Admin name updated successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update name");
    }
  };

  const deleteUser = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      setMessage("User deleted successfully");
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete user");
    }
  };

  const editCustomerName = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${editUserId}`, { name: editUserName });
      setUsers((prev) => prev.map((u) => (u.id === editUserId ? { ...u, name: editUserName } : u)));
      setMessage("Customer name updated successfully");
      setEditUserId(null);
      setEditUserName("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update customer name");
    }
  };

  const editSupplier = (supplier) => {
    setEditSupplierId(supplier.id);
    setEditSupplierForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || ""
    });
  };

  const updateSupplier = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/suppliers/${editSupplierId}`, editSupplierForm);
      setMessage("Supplier updated successfully");
      setEditSupplierId(null);
      setEditSupplierForm({ name: "", phone: "", email: "", address: "" });
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update supplier");
    }
  };

  const deleteSupplier = async (id) => {
    try {
      await API.delete(`/suppliers/${id}`);
      setMessage("Supplier deleted successfully");
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete supplier");
    }
  };

  const receiveStock = async (e) => {
    e.preventDefault();

    try {
      await API.post("/supplier-stock", stockForm);
      setMessage("Stock received successfully.");
      setStockForm({ supplier_id: "", product_id: "", quantity: "", cost_price: "" });
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || "Failed to receive stock");
    }
  };

  const editProduct = (product) => {
    setEditProductId(product.id);
    setEditProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || ""
    });
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/products/${editProductId}`, editProductForm);
      setMessage("Product updated successfully");
      setEditProductId(null);
      setEditProductForm({ name: "", description: "", price: "", stock: "" });
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update product");
    }
  };

  const deleteProduct = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      setMessage("Product deleted successfully");
      loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete product");
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const totalSales = bills.reduce(
    (sum, bill) => sum + Number(bill.total_amount || 0),
    0
  );

  const totalInventory = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const completedOrders = bills.filter(
    (bill) => bill.status?.toLowerCase() === "completed"
  ).length;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage users, products, orders, and support from one place.</p>
        </div>

        <div className="action-row">
          <Link to="/shopkeeper-bills" className="btn secondary">
            View All Orders
          </Link>
          <button onClick={logout} className="danger">
            Logout
          </button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}
      <form onSubmit={updateProfile} className="form">
        <h2>Edit Admin Name</h2>
        <input
          type="text"
          placeholder="Admin Name"
          required
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
        <button className="btn" type="submit">Save Admin Name</button>
      </form>

      <div className="stats-grid">
        <div className="card highlight">
          <h2>{users.length}</h2>
          <p>Total Users</p>
        </div>

        <div className="card highlight">
          <h2>{products.length}</h2>
          <p>Total Products</p>
        </div>

        <div className="card highlight">
          <h2>{totalInventory}</h2>
          <p>Total Inventory</p>
        </div>

        <div className="card highlight">
          <h2>{bills.length}</h2>
          <p>Total Orders</p>
        </div>

        <div className="card highlight">
          <h2>{completedOrders}</h2>
          <p>Completed Orders</p>
        </div>

        <div className="card highlight">
          <h2>₹{totalSales}</h2>
          <p>Total Sales</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card contact-card">
          <h2>Support</h2>
          <p>Admin helps maintain system health, manage users, and resolve issues.</p>
          <p>
            <strong>Email:</strong> {supportEmail}
          </p>
          <p>
            <strong>Purpose:</strong> oversee inventory, approve orders, and support customers/shopkeepers.
          </p>
        </div>

        <div className="card">
          <h2>Contact Info</h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.slice(0, 5).map((user) => (
              <p key={user.id}>
                <strong>{user.name}</strong> <span className="small-tag">{user.role}</span>
                <br />
                {user.email}
              </p>
            ))
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="card">
          <h2>Supplier Management</h2>
          {suppliers.length === 0 ? (
            <p>No suppliers found.</p>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="bill">
                <p><strong>{supplier.name}</strong> — {supplier.email || "-"}</p>
                <p>{supplier.phone || "-"}</p>
                <p>{supplier.address || "-"}</p>
                <div className="action-row">
                  <button className="btn secondary" onClick={() => editSupplier(supplier)}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => deleteSupplier(supplier.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {editSupplierId && (
            <form onSubmit={updateSupplier} className="form">
              <h2>Edit Supplier</h2>
              <input
                type="text"
                placeholder="Supplier Name"
                required
                value={editSupplierForm.name}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phone"
                value={editSupplierForm.phone}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, phone: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={editSupplierForm.email}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, email: e.target.value })}
              />
              <textarea
                placeholder="Address"
                value={editSupplierForm.address}
                onChange={(e) => setEditSupplierForm({ ...editSupplierForm, address: e.target.value })}
              />
              <button className="btn" type="submit">Save Supplier</button>
            </form>
          )}
        </div>

        <div className="card">
          <h2>Receive Stock from Supplier</h2>
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

        <div className="card">
          <h2>Manage Customers</h2>
          {users.filter((user) => user.role === "customer").length === 0 ? (
            <p>No customers found.</p>
          ) : (
            users
              .filter((user) => user.role === "customer")
              .map((customer) => (
                <div key={customer.id} className="bill">
                  <p><strong>{customer.name}</strong> — {customer.email}</p>
                  <div className="action-row">
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setEditUserId(customer.id);
                        setEditUserName(customer.name);
                      }}
                    >
                      Edit Name
                    </button>
                    <button className="btn danger" onClick={() => deleteUser(customer.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {editUserId && (
        <form onSubmit={editCustomerName} className="form">
          <h2>Update Customer Name</h2>
          <input
            type="text"
            required
            value={editUserName}
            onChange={(e) => setEditUserName(e.target.value)}
          />
          <button className="btn" type="submit">Save Customer Name</button>
        </form>
      )}

      <h2>Manage Products</h2>
      <div className="grid">
        {products.map((product) => (
          <div className="card" key={product.id}>
            {product.image && (
              <img
                src={`${API.defaults.baseURL}${product.image}`}
                alt={product.name}
                className="product-img"
                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px", marginBottom: "12px" }}
              />
            )}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>Price:</strong> ₹{product.price}</p>
            <p><strong>Stock:</strong> {product.stock}</p>
            <div className="action-row">
              <button className="btn secondary" onClick={() => editProduct(product)}>
                Edit
              </button>
              <button className="btn danger" onClick={() => deleteProduct(product.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editProductId && (
        <form onSubmit={updateProduct} className="form">
          <h2>Edit Product</h2>
          <input
            type="text"
            placeholder="Name"
            required
            value={editProductForm.name}
            onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={editProductForm.description}
            onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            required
            value={editProductForm.price}
            onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Stock"
            value={editProductForm.stock}
            onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
          />
          <button className="btn" type="submit">Save Product</button>
        </form>
      )}

      <h2>Recent Orders</h2>

      {bills.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        bills.map((bill) => (
          <div className="bill" key={bill.id}>
            <h3>Bill #{bill.id}</h3>
            <p>
              <strong>Customer:</strong> {bill.customer_name || bill.customer_email}
            </p>
            <p>
              <strong>Email:</strong> {bill.customer_email}
            </p>
            <p>
              <strong>Total:</strong> ₹{bill.total_amount}
            </p>
            <p>
              <strong>Status:</strong> {bill.status}
            </p>
            <p>
              <strong>Payment:</strong> {bill.payment_method}
            </p>
            <p>
              <strong>Address:</strong> {bill.address}
            </p>
            <h4>Items</h4>
            {bill.items.map((item) => (
              <p key={item.id}>
                {item.product_name} × {item.quantity} = ₹{item.subtotal}
              </p>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default Admin;