import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const [values, setValues] = useState({
    name: "",
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

  // ✅ Only validation here
  const validate = (values) => {
    let errors = {};

    errors.name = values.name ? "" : "Name is required";
    errors.email = values.email ? "" : "Email is required";
    errors.password = values.password ? "" : "Password is required";

    return errors;
  };

  // ✅ Submit function (MISSING before)
  const handlesubmit = (event) => {
    event.preventDefault();

    const validationErrors = validate(values);
    setError(validationErrors);

    if (
      validationErrors.name === "" &&
      validationErrors.email === "" &&
      validationErrors.password === ""
    ) {
      axios.post("http://localhost:8081/signup", values)
        .then(res => {
          if (res.data === "Success") {
            alert("Registered successfully ✅");
            navigate("/"); // redirect to login
          } else {
            alert("Registration failed ❌");
          }
        })
        .catch(err => console.log(err));
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-primary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2>Signup</h2>

        <form onSubmit={handlesubmit}>

          <div className="mb-3">
            <label><strong>Name</strong></label>
            <input
              type="text"
              name="name"
              placeholder="Enter Name"
              onChange={handleinput}
              className="form-control"
            />
            {error.name && <span className="text-danger">{error.name}</span>}
          </div>

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
            Signup
          </button>

          <p className="mt-2">you agree to our terms and policies</p>

          <Link to="/" className="btn btn-light border w-100">
            Already have an account? Login
          </Link>

        </form>
      </div>
    </div>
  );
}

export default Signup;