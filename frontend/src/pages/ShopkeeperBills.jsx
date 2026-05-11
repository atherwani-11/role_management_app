import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

function ShopkeeperBills() {
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState("");

  const loadBills = async () => {
    try {
      const res = await API.get("/bills/shopkeeper");
      setBills(res.data);
    } catch (err) {
      setMessage("Failed to load shopkeeper bills");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      setMessage(`Order marked as ${status}`);
      loadBills();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update order");
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  return (
    <div className="page">
      <div className="topbar">
        <h1>Shopkeeper Orders</h1>
        <Link to="/shopkeeper" className="btn">
          Back
        </Link>
      </div>

      {message && <p className="message">{message}</p>}

      {bills.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        bills.map((bill) => (
          <div className="bill" key={bill.id}>
            <h2>Bill #{bill.id}</h2>

            <p>
              <b>Customer:</b> {bill.customer_name || "Customer"}
            </p>
            <p>
              <b>Email:</b> {bill.customer_email}
            </p>
            <p>
              <b>Phone:</b> {bill.phone}
            </p>
            <p>
              <b>Address:</b> {bill.address}
            </p>
            <p>
              <b>Payment:</b> {bill.payment_method}
            </p>
            <p>
              <b>Status:</b> {bill.status}
            </p>
            <p>
              <b>Total:</b> ₹{bill.total_amount}
            </p>

            <h3>Products</h3>

            {bill.items && bill.items.length > 0 ? (
              bill.items.map((item) => (
                <p key={item.id}>
                  {item.product_name} × {item.quantity} = ₹{item.subtotal}
                </p>
              ))
            ) : (
              <p>No items found.</p>
            )}

            <div className="action-row">
              {bill.status === "Pending" && (
                <>
                  <button
                    className="btn"
                    onClick={() => updateStatus(bill.id, "Accepted")}
                  >
                    Accept Order
                  </button>

                  <button
                    className="danger"
                    onClick={() => updateStatus(bill.id, "Rejected")}
                  >
                    Reject Order
                  </button>
                </>
              )}

              {bill.status === "Accepted" && (
                <button
                  className="btn"
                  onClick={() => updateStatus(bill.id, "Completed")}
                >
                  Mark Completed
                </button>
              )}

              {bill.status === "Rejected" && (
                <p className="status rejected">Order Rejected</p>
              )}

              {bill.status === "Completed" && (
                <p className="status completed">Order Completed</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ShopkeeperBills;