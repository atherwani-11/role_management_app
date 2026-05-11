import React from "react";
import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

function CustomerBills() {
  const [bills, setBills] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const customerEmail = user.email || localStorage.getItem("email");

  useEffect(() => {
    API.get(`/bills/customer/${customerEmail}`)
      .then((res) => setBills(res.data))
      .catch(() => setBills([]));
  }, [customerEmail]);

  return (
    <div className="page">
      <div className="topbar">
        <h1>My Bills</h1>
        <Link to="/customer" className="btn">Back</Link>
      </div>

      {bills.length === 0 && <p>No bills found.</p>}

      {bills.map((bill) => (
        <div className="bill" key={bill.id}>
          <h2>Bill #{bill.id}</h2>
          <p><b>Payment:</b> {bill.payment_method}</p>
          <p><b>Status:</b> {bill.status}</p>
          <p><b>Total:</b> ₹{bill.total_amount}</p>
          <p><b>Address:</b> {bill.address}</p>

          <h3>Items</h3>
          {bill.items.map((item) => (
            <p key={item.id}>
              {item.product_name} × {item.quantity} = ₹{item.subtotal}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default CustomerBills;