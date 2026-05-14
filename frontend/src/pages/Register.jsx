import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    country: '',
    currency: '',
    currencySymbol: ''
  });
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { data } = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
        // Sort alphabetically
        const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      } catch (err) {
        console.error('Failed to fetch countries', err);
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const country = countries.find(c => c.name.common === countryName);
    
    let currencyCode = '';
    let currSymbol = '';
    
    if (country && country.currencies) {
      currencyCode = Object.keys(country.currencies)[0];
      currSymbol = country.currencies[currencyCode].symbol || currencyCode;
    }

    setFormData({
      ...formData,
      country: countryName,
      currency: currencyCode,
      currencySymbol: currSymbol
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data } = await api.post('/auth/register', formData);
      register(data.user, data.token);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ background: 'var(--primary-gradient)' }}>
      <div className="card shadow-lg border-0 rounded-4" style={{ width: '100%', maxWidth: '600px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary mb-1">ReimburseEase</h2>
            <p className="text-muted">Create your company account</p>
          </div>
          
          {error && <div className="alert alert-danger py-2">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Full Name</label>
                <input type="text" name="name" className="form-control bg-light" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Email Address</label>
                <input type="email" name="email" className="form-control bg-light" value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Password</label>
              <input type="password" name="password" className="form-control bg-light" value={formData.password} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Company Name</label>
              <input type="text" name="companyName" className="form-control bg-light" value={formData.companyName} onChange={handleChange} required />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Country</label>
                <select name="country" className="form-select bg-light" value={formData.country} onChange={handleCountryChange} required>
                  <option value="">Select Country</option>
                  {countries.map((c, i) => (
                    <option key={i} value={c.name.common}>{c.name.common}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Currency</label>
                <input type="text" className="form-control bg-light" value={formData.currency ? `${formData.currency} (${formData.currencySymbol})` : ''} readOnly disabled />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100 btn-lg rounded-pill mb-3 fw-semibold shadow-sm"
              disabled={loading}
              style={{ background: 'var(--primary-gradient)' }}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Register
            </button>
          </form>
          
          <div className="text-center mt-4">
            <span className="text-muted">Already have an account? </span>
            <Link to="/login" className="text-primary text-decoration-none fw-semibold">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
