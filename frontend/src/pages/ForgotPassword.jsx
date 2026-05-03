import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/forgot-password", formData);

      if (res.data.status === "Success") {
        alert("Password updated successfully");
        navigate("/login");
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to reset password");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleReset}>
        <div className="auth-logo">🔐</div>

        <h2>Forgot Password</h2>
        <p>Reset your password using your email</p>

        {error && <div className="error">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>New Password</label>
        <input
          type="password"
          name="newPassword"
          placeholder="Enter new password"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />

        <button type="submit">Update Password</button>

        <p>
          Remember password? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;