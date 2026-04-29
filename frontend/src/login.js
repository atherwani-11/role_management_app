import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [values, setValues] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState({});
  const navigate = useNavigate();
  
  const handleinput = (event) => {
    setValues(prev => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const validate = (values) => {
    let errors = {};

    errors.email = values.email ? "" : "Email is required";
    errors.password = values.password ? "" : "Password is required";

    return errors;
  };

  const handlesubmit = (event) => {
    event.preventDefault();

    const validationErrors = validate(values);
    setError(validationErrors);

    if (
      validationErrors.email === "" &&
      validationErrors.password === ""
    ) {
      axios.post("http://localhost:8081/login", values)
        .then(res => {
          console.log(res.data); // debug

          if (res.data === "Success") {
            alert("Login successful");
            navigate("/home"); // 🔥 redirect
          } else {
            alert("Invalid email or password ");
          }
        })
        .catch(err => console.log(err));
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-primary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2>Login</h2>

        <form onSubmit={handlesubmit}>

          <div className="mb-3">
            <label><strong>Email</strong></label>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              onChange={handleinput}
              className="form-control"
            />
            {error.email && <span className="text-danger">{error.email}</span>}
          </div>

          <div className="mb-3">
            <label><strong>Password</strong></label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              onChange={handleinput}
              className="form-control"
            />
            {error.password && <span className="text-danger">{error.password}</span>}
          </div>

          <button type="submit" className="btn btn-success w-100">
            Login
          </button>

          <p className="mt-2">you agree to our terms and policies</p>

          <Link to="/signup" className="btn btn-light border w-100">
            Create an account
          </Link>

        </form>
      </div>
    </div>
  );
}

export default Login;