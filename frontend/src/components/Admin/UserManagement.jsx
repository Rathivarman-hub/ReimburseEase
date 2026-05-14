import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [managers, setManagers] = useState([]);
  
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    email: '',
    password: 'Password@123',
    role: 'employee',
    managerId: '',
    isManagerApprover: false
  });
  
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      const usersList = data.data || [];
      setUsers(usersList);
      setManagers(usersList.filter(u => u.role === 'manager' || u.role === 'admin'));
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (user) => {
    setFormData({
      _id: user._id,
      name: user.name,
      email: user.email,
      password: '', // Don't show existing password
      role: user.role,
      managerId: user.managerId?._id || '',
      isManagerApprover: user.isManagerApprover || false
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({
      _id: '',
      name: '',
      email: '',
      password: 'Password@123',
      role: 'employee',
      managerId: '',
      isManagerApprover: false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password on edit
      
      if (payload._id) {
        await api.put(`/users/${payload._id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">User Management</h3>
        <button className="btn btn-primary shadow-sm rounded-pill px-4" onClick={handleAddNew}>
          <i className="bi bi-plus-lg me-2"></i>Add User
        </button>
      </div>

      <div className="card custom-card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <>
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="ps-4 fw-semibold">{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'manager' ? 'bg-info' : 'bg-secondary'}`}>
                          {u.role.toUpperCase()}
                        </span>
                        {u.isManagerApprover && <span className="badge bg-success ms-1" title="Can approve expenses"><i className="bi bi-check-circle"></i></span>}
                      </td>
                      <td>{u.managerId?.name || '-'}</td>
                      <td>
                        {u.status === 'active' ? (
                          <span className="badge bg-success bg-opacity-10 text-success">Active</span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger">Inactive</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-light me-2" onClick={() => handleEdit(u)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        {u.status === 'active' && (
                          <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(u._id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="d-md-none px-3 py-2">
              {users.map(u => (
                <div key={u._id} className="mobile-data-card">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="fw-bold">{u.name}</div>
                    <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'manager' ? 'bg-info' : 'bg-secondary'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="small text-muted mb-3">{u.email}</div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Status</span>
                    <span className="mobile-data-value">
                      {u.status === 'active' ? (
                        <span className="text-success">Active</span>
                      ) : (
                        <span className="text-danger">Inactive</span>
                      )}
                    </span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Manager</span>
                    <span className="mobile-data-value">{u.managerId?.name || 'None'}</span>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-sm btn-light flex-grow-1" onClick={() => handleEdit(u)}>
                      <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                    {u.status === 'active' && (
                      <button className="btn btn-sm btn-light text-danger flex-grow-1" onClick={() => handleDelete(u._id)}>
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header bg-light border-0 p-4">
                  <h5 className="modal-title fw-bold">{formData._id ? 'Edit User' : 'Add New User'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Full Name</label>
                      <input type="text" className="form-control bg-light" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Email Address</label>
                      <input type="email" className="form-control bg-light" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    
                    {!formData._id && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">Password</label>
                        <input type="text" className="form-control bg-light" name="password" value={formData.password} onChange={handleChange} required />
                        <div className="form-text">Default password for new users.</div>
                      </div>
                    )}
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Role</label>
                        <select className="form-select bg-light" name="role" value={formData.role} onChange={handleChange}>
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Assign Manager</label>
                        <select className="form-select bg-light" name="managerId" value={formData.managerId} onChange={handleChange}>
                          <option value="">None</option>
                          {managers.map(m => (
                            <option key={m._id} value={m._id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-check form-switch mt-4">
                      <input className="form-check-input" type="checkbox" role="switch" id="isApprover" name="isManagerApprover" checked={formData.isManagerApprover} onChange={handleChange} />
                      <label className="form-check-label ms-2" htmlFor="isApprover">Can Approve Expenses</label>
                    </div>
                  </div>
                  <div className="modal-footer border-0 p-4 pt-0">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm" /> : 'Save User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
