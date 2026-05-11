import { Link } from "react-router-dom";

const CustomerContact = () => {
  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>Contact Us</h1>
          <p>We are here to help with orders, payments, and support.</p>
        </div>
        <div className="action-row">
          <Link to="/customer" className="btn">Back to Customer</Link>
        </div>
      </div>

      <div className="card">
        <h2>Customer Support</h2>
        <p>If you have a question, please reach out using the details below.</p>

        <p><strong>Email:</strong> atherwani333@gmail.com</p>
        <p><strong>Phone:</strong> +91 9149756267</p>
        <p><strong>Address:</strong> Bulgam Sopore, Baramulla, India</p>

        <div className="contact-box">
          <h3>Send us a message</h3>
          <p>Please send your order or account query to the email above.</p>
          <p>We will respond as soon as possible.</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerContact;
