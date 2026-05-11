import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await API.post("/login", form);

      if (res.data.status === "Success") {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("email", res.data.user.email);

        const role = res.data.user.role;

        if (role === "admin") {
          navigate("/admin");
        } else if (role === "shopkeeper") {
          navigate("/shopkeeper");
        } else {
          navigate("/customer");
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🚀</div>
          <div>
            <h1>Welcome Back</h1>
            <p>Securely sign in to access your dashboard and tools.</p>
          </div>
        </div>

        <form onSubmit={login} className="form auth-form">
          {message && <div className="error">{message}</div>}

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="btn" type="submit">
            Login
          </button>

          <p className="auth-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <span>No account? <Link to="/signup" style={{ color: '#2563eb' }}>Sign Up</Link></span>
            <Link to="/forgot-password" style={{ color: '#d97706' }}>Forgot Password?</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;