import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

const Shopkeeper = () => {
  const { user, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receivedStock, setReceivedStock] = useState([]);
  const [error, setError] = useState("");

  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingStockId, setEditingStockId] = useState(null);
  const [billingSearch, setBillingSearch] = useState("");

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [stockForm, setStockForm] = useState({
    supplier_id: "",
    product_name: "",
    quantity: "",
    remaining_quantity: "",
    cost_price: "",
  });

  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    unit: "number",
    type: "product",
    supplier_id: "",
  });

  const [inventoryForm, setInventoryForm] = useState({
    product_id: "",
    addQuantity: "",
  });

  const headers = { email: user.email };

  const fetchAll = useCallback(async () => {
    try {
      const [productsRes, ordersRes, suppliersRes, stockRes] =
        await Promise.all([
          API.get("/shopkeeper/products", { headers }),
          API.get("/shopkeeper/orders", { headers }),
          API.get("/shopkeeper/suppliers", { headers }),
          API.get("/shopkeeper/received-stock", { headers }),
        ]);

      setItems(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setSuppliers(suppliersRes.data.suppliers || []);
      setReceivedStock(stockRes.data.stock || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load shopkeeper data");
    }
  }, [user.email]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSupplierChange = (e) => {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
  };

  const handleStockChange = (e) => {
    setStockForm({ ...stockForm, [e.target.name]: e.target.value });
  };

  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleInventoryChange = (e) => {
    setInventoryForm({
      ...inventoryForm,
      [e.target.name]: e.target.value,
    });
  };

  const resetSupplierForm = () => {
    setEditingSupplierId(null);
    setSupplierForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  const resetStockForm = () => {
    setEditingStockId(null);
    setStockForm({
      supplier_id: "",
      product_name: "",
      quantity: "",
      remaining_quantity: "",
      cost_price: "",
    });
  };

  const addSupplier = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/shopkeeper/suppliers", supplierForm, {
        headers,
      });

      if (res.data.status === "Success") {
        resetSupplierForm();
        fetchAll();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Failed to add supplier");
    }
  };

  const startEditSupplier = (supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateSupplier = async (e) => {
    e.preventDefault();

    try {
      const res = await API.put(
        `/shopkeeper/suppliers/${editingSupplierId}`,
        supplierForm,
        { headers }
      );

      if (res.data.status === "Success") {
        resetSupplierForm();
        fetchAll();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Failed to update supplier");
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;

    try {
      const res = await API.delete(`/shopkeeper/suppliers/${id}`, { headers });

      if (res.data.status === "Success") fetchAll();
      else setError(res.data.message);
    } catch {
      setError("Failed to delete supplier");
    }
  };

  const receiveStock = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/shopkeeper/receive-stock", stockForm, {
        headers,
      });

      if (res.data.status === "Success") {
        resetStockForm();
        fetchAll();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Failed to receive stock");
    }
  };

  const startEditStock = (stock) => {
    setEditingStockId(stock.id);
    setStockForm({
      supplier_id: String(stock.supplier_id || ""),
      product_name: stock.product_name || "",
      quantity: stock.quantity || "",
      remaining_quantity: stock.remaining_quantity || "",
      cost_price: stock.cost_price || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateStock = async (e) => {
    e.preventDefault();

    try {
      const res = await API.put(
        `/shopkeeper/received-stock/${editingStockId}`,
        stockForm,
        { headers }
      );

      if (res.data.status === "Success") {
        resetStockForm();
        fetchAll();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Failed to update stock");
    }
  };

  const deleteStock = async (id) => {
    if (!window.confirm("Delete this received stock record?")) return;

    try {
      const res = await API.delete(`/shopkeeper/received-stock/${id}`, {
        headers,
      });

      if (res.data.status === "Success") fetchAll();
      else setError(res.data.message);
    } catch {
      setError("Failed to delete stock");
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/shopkeeper/products", productForm, {
        headers,
      });

      if (res.data.status === "Success") {
        setProductForm({
          title: "",
          description: "",
          price: "",
          quantity: "",
          unit: "number",
          type: "product",
          supplier_id: "",
        });

        fetchAll();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Failed to add product");
    }
  };

  const addInventory = async (e) => {
    e.preventDefault();

    if (!inventoryForm.product_id || !inventoryForm.addQuantity) {
      setError("Select product and enter quantity");
      return;
    }

    try {
      const res = await API.put(
        `/shopkeeper/products/${inventoryForm.product_id}/add-inventory`,
        { addQuantity: inventoryForm.addQuantity },
        { headers }
      );

      if (res.data.status === "Success") {
        setInventoryForm({
          product_id: "",
          addQuantity: "",
        });

        fetchAll();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Failed to add inventory");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await API.delete(`/shopkeeper/products/${id}`, { headers });
      fetchAll();
    } catch {
      setError("Failed to delete product");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status }, { headers });
      fetchAll();
    } catch {
      setError("Failed to update order");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const search = billingSearch.toLowerCase();

    return (
      String(order.id).includes(search) ||
      String(order.customer_name || "").toLowerCase().includes(search) ||
      String(order.customer_email || "").toLowerCase().includes(search) ||
      String(order.title || "").toLowerCase().includes(search) ||
      String(order.status || "").toLowerCase().includes(search)
    );
  });

  const totalInventory = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  const totalOrders = orders.length;

  const totalSales = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => {
      const amount =
        Number(order.total_amount) > 0
          ? Number(order.total_amount)
          : Number(order.price || 0) * Number(order.quantity || 1);

      return sum + amount;
    }, 0);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h2>Shopkeeper</h2>
          <p>{user.name}</p>
          <p>{user.email}</p>
          <p>Contact: shop@marketplace.com</p>
          <p>Phone: +91 9876543210</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="top-card">
          <h1>Shopkeeper Panel</h1>
          <p>Manage products, suppliers, inventory and orders</p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="stats">
          <div className="stat-card">
            <span>Total Inventory</span>
            <h2>{totalInventory}</h2>
          </div>

          <div className="stat-card">
            <span>Total Orders</span>
            <h2>{totalOrders}</h2>
          </div>

          <div className="stat-card">
            <span>Completed Sales</span>
            <h2>₹{totalSales.toFixed(2)}</h2>
          </div>
        </div>

        <h2 className="section-title">
          {editingSupplierId ? "Edit Supplier" : "Add Supplier"}
        </h2>

        <form
          className="form-card"
          onSubmit={editingSupplierId ? updateSupplier : addSupplier}
        >
          <label>Supplier Name</label>
          <input
            name="name"
            value={supplierForm.name}
            onChange={handleSupplierChange}
            placeholder="Supplier name"
            required
          />

          <label>Phone</label>
          <input
            name="phone"
            value={supplierForm.phone}
            onChange={handleSupplierChange}
            placeholder="Phone number"
          />

          <label>Email</label>
          <input
            name="email"
            value={supplierForm.email}
            onChange={handleSupplierChange}
            placeholder="Email"
          />

          <label>Address</label>
          <textarea
            name="address"
            value={supplierForm.address}
            onChange={handleSupplierChange}
            placeholder="Address"
          />

          <button type="submit">
            {editingSupplierId ? "Update Supplier" : "Add Supplier"}
          </button>

          {editingSupplierId && (
            <button
              type="button"
              className="danger-btn"
              onClick={resetSupplierForm}
            >
              Cancel
            </button>
          )}
        </form>

        <h2 className="section-title">Suppliers List</h2>

        {suppliers.length === 0 ? (
          <div className="empty">No suppliers added</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.address}</td>
                  <td>
                    <button onClick={() => startEditSupplier(supplier)}>
                      Edit
                    </button>
                    <button
                      className="danger-btn"
                      onClick={() => deleteSupplier(supplier.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="section-title">
          {editingStockId
            ? "Edit Received Stock"
            : "Receive Stock From Supplier"}
        </h2>

        <form
          className="form-card"
          onSubmit={editingStockId ? updateStock : receiveStock}
        >
          <label>Supplier</label>
          <select
            name="supplier_id"
            value={stockForm.supplier_id}
            onChange={handleStockChange}
            required
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <label>Product Name</label>
          <input
            name="product_name"
            value={stockForm.product_name}
            onChange={handleStockChange}
            placeholder="Product received"
            required
          />

          <label>Quantity Received</label>
          <input
            type="number"
            name="quantity"
            value={stockForm.quantity}
            onChange={handleStockChange}
            required
          />

          <label>Products Left</label>
          <input
            type="number"
            name="remaining_quantity"
            value={stockForm.remaining_quantity}
            onChange={handleStockChange}
          />

          <label>Cost Price</label>
          <input
            type="number"
            name="cost_price"
            value={stockForm.cost_price}
            onChange={handleStockChange}
            required
          />

          <button type="submit">
            {editingStockId ? "Update Stock" : "Save Stock"}
          </button>

          {editingStockId && (
            <button type="button" className="danger-btn" onClick={resetStockForm}>
              Cancel
            </button>
          )}
        </form>

        <h2 className="section-title">Received Stock From Suppliers</h2>

        {receivedStock.length === 0 ? (
          <div className="empty">No stock records</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Product</th>
                <th>Received</th>
                <th>Left</th>
                <th>Cost Price</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {receivedStock.map((stock) => (
                <tr key={stock.id}>
                  <td>{stock.supplier_name}</td>
                  <td>{stock.product_name}</td>
                  <td>{stock.quantity}</td>
                  <td>{stock.remaining_quantity}</td>
                  <td>₹{Number(stock.cost_price).toFixed(2)}</td>
                  <td>
                    <button onClick={() => startEditStock(stock)}>Edit</button>
                    <button
                      className="danger-btn"
                      onClick={() => deleteStock(stock.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="section-title">Add Product / Service</h2>

        <form className="form-card" onSubmit={addProduct}>
          <label>Title</label>
          <input
            name="title"
            value={productForm.title}
            onChange={handleProductChange}
            placeholder="Product title"
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={productForm.description}
            onChange={handleProductChange}
            required
          />

          <label>Price</label>
          <input
            type="number"
            name="price"
            value={productForm.price}
            onChange={handleProductChange}
            required
          />

          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={productForm.quantity}
            onChange={handleProductChange}
          />

          <label>Unit</label>
          <select
            name="unit"
            value={productForm.unit}
            onChange={handleProductChange}
          >
            <option value="kg">KG</option>
            <option value="liter">Liter</option>
            <option value="number">Number</option>
            <option value="dozen">Dozen</option>
          </select>

          <label>Type</label>
          <select
            name="type"
            value={productForm.type}
            onChange={handleProductChange}
          >
            <option value="product">Product</option>
            <option value="service">Service</option>
          </select>

          <label>Supplier</label>
          <select
            name="supplier_id"
            value={productForm.supplier_id}
            onChange={handleProductChange}
          >
            <option value="">No supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <button type="submit">Add Product</button>
        </form>

        <h2 className="section-title">Add Inventory</h2>

        <form className="form-card" onSubmit={addInventory}>
          <label>Select Product</label>
          <select
            name="product_id"
            value={inventoryForm.product_id}
            onChange={handleInventoryChange}
            required
          >
            <option value="">Select product</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — Current: {item.quantity} {item.unit}
              </option>
            ))}
          </select>

          <label>Add Quantity</label>
          <input
            type="number"
            name="addQuantity"
            value={inventoryForm.addQuantity}
            onChange={handleInventoryChange}
            placeholder="How many to add?"
            required
          />

          <button type="submit">Add Inventory</button>
        </form>

        <h2 className="section-title">Inventory</h2>

        <div className="grid">
          {items.map((item) => (
            <div className="card" key={item.id}>
              <span className="badge">{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p>Supplier: {item.supplier_name || "No supplier"}</p>
              <p>
                Quantity: {item.quantity} {item.unit}
              </p>
              <div className="price">
                ₹{Number(item.price).toFixed(2)} / {item.unit}
              </div>
              <button
                className="danger-btn"
                onClick={() => deleteProduct(item.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <h2 className="section-title">Billing / Order Details</h2>

        <div className="form-card">
          <label>Search Orders</label>
          <input
            value={billingSearch}
            onChange={(e) => setBillingSearch(e.target.value)}
            placeholder="Search by customer, email, product, status, bill ID"
          />
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty">No customer orders found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>INV-{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_email}</td>
                  <td>{order.title}</td>
                  <td>
                    {order.quantity} {order.unit}
                  </td>
                  <td>₹{Number(order.total_amount || 0).toFixed(2)}</td>
                  <td>{order.status}</td>
                  <td>
                    <button onClick={() => updateOrderStatus(order.id, "accepted")}>
                      Accept
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, "completed")}>
                      Complete
                    </button>
                    <button
                      className="danger-btn"
                      onClick={() => updateOrderStatus(order.id, "rejected")}
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