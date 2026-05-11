import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Customer from "./pages/Customer";
import Cart from "./pages/Cart";
import CustomerBills from "./pages/CustomerBills";
import CustomerContact from "./pages/CustomerContact";
import Shopkeeper from "./pages/Shopkeeper";
import ShopkeeperBills from "./pages/ShopkeeperBills";
import Admin from "./pages/Admin";

import "./styles/style.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/customer" element={<Customer />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/customer-bills" element={<CustomerBills />} />
      <Route path="/customer-contact" element={<CustomerContact />} />

      <Route path="/shopkeeper" element={<Shopkeeper />} />
      <Route path="/shopkeeper-bills" element={<ShopkeeperBills />} />

      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;