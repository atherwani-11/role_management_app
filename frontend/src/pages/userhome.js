import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useAuth } from '../AuthContext';
import '../styles/Marketplace.css';

const UserHome = () => {
  const { user, logout, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchProfile = useCallback(async () => {
    try {
      const headers = { email: user.email };
      const res = await API.get('/user/profile', { headers });
      setProfile(res.data.user);
      setFormData({ name: res.data.user.name });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    }
  }, [user]);

  const fetchServices = useCallback(async () => {
    try {
      const headers = { email: user.email };
      const res = await API.get('/public/services', { headers });
      setServices(res.data.services || []);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    try {
      const headers = { email: user.email };
      const res = await API.get('/user/orders', { headers });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchServices();
    fetchOrders();
  }, [user, fetchProfile, fetchServices, fetchOrders]);

  if (loading || !user) {
    return <div className="dashboard loading">Loading...</div>;
  }

  const buyService = async (serviceId) => {
    try {
      const headers = { email: user.email };
      await API.post(`/services/${serviceId}/buy`, {}, { headers });
      fetchOrders();
      setError('');
      alert('Service purchased successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to buy service');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const headers = { email: user.email };
      await API.put('/user/profile',
        { name: formData.name }, 
        { headers }
      );
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      const headers = { email: user.email };
      await API.post('/user/change-password',
        { 
          oldPassword: passwordData.oldPassword, 
          newPassword: passwordData.newPassword 
        },
        { headers }
      );
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };


  if (loading || !user) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <header className="marketplace-header">
        <div className="header-content">
          <a href="/" className="header-logo">🍽️ Marketplace</a>
          <div className="header-search">
            <input type="text" className="search-input" placeholder="Search services..." />
          </div>
          <div className="header-actions">
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="marketplace-container">
        {/* Promo Banner */}
        <div className="promo-banner">
          <h2>Welcome to Our Marketplace!</h2>
          <p style={{marginBottom: '1.5rem', fontSize: '16px'}}>Discover amazing services and products at great prices</p>
          <div className="promo-buttons">
            <button className="promo-btn">🛍️ Shop Now</button>
            <button className="promo-btn">📦 Track Orders</button>
          </div>
        </div>

        {/* Error Message */}
        {error && <div style={{background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '2rem'}}>{error}</div>}

        {/* Available Services Section */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Featured Services</h2>
            <a href="#" className="view-all-link">View all →</a>
          </div>

          {services.length > 0 ? (
            <div className="products-grid">
              {services.map(service => {
                const discount = service.price ? Math.round((service.price * 0.15)) : 0; // Assume 15% discount
                const savings = discount;
                return (
                  <div key={service.id} className="product-card">
                    <div className="product-image-container">
                      <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px'}}>
                        📦
                      </div>
                      {savings > 0 && <div className="product-badge save-badge">Save Rs. {savings}</div>}
                    </div>
                    <div className="product-info">
                      <div className="product-brand">Marketplace</div>
                      <div className="product-name">{service.name}</div>
                      <div className="product-pricing">
                        <div>
                          <span className="product-price">Rs. {service.price?.toFixed(2)}</span>
                        </div>
                        {savings > 0 && <div className="product-discount">Save Rs. {savings}</div>}
                      </div>
                      <div style={{fontSize: '13px', color: '#64748b', marginBottom: '0.5rem'}}>Category: {service.category}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>Seller: {service.user_email}</div>
                    </div>
                    <div className="product-actions">
                      <button className="btn-add-cart" onClick={() => buyService(service.id)}>
                        Buy Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No services available at the moment</div>
            </div>
          )}
        </section>

        {/* Orders Section */}
        <section style={{marginTop: '4rem'}}>
          <div className="section-header">
            <h2 className="section-title">My Recent Orders</h2>
          </div>

          {orders.length > 0 ? (
            <div style={{background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thread style={{background: '#f8faff', borderBottom: '2px solid #e2e8f0'}}>
                  <tr>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>Service</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>Category</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>Amount</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>Status</th>
                    <th style={{padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b', fontSize: '14px'}}>Date</th>
                  </tr>
                </thread>
                <body>
                  {orders.map(order => (
                    <tr key={order.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '1rem', color: '#1e293b'}}>{order.service_name}</td>
                      <td style={{padding: '1rem', color: '#64748b'}}>{order.category}</td>
                      <td style={{padding: '1rem', color: '#1e293b', fontWeight: '600'}}>Rs. {order.amount.toFixed(2)}</td>
                      <td style={{padding: '1rem'}}><span style={{background: '#d1fae5', color: '#065f46', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>{order.status}</span></td>
                      <td style={{padding: '1rem', color: '#64748b', fontSize: '13px'}}>{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </body>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">You haven't made any purchases yet</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserHome;