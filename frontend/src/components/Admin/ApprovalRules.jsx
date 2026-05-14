import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'sequential',
    approvers: [{ userId: '', label: '' }],
    minAmountThreshold: '',
    maxAmountThreshold: '',
    percentageThreshold: '',
    specificApproverId: '',
    isDefault: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, usersRes] = await Promise.all([
        api.get('/approval-rules'),
        api.get('/users') // To get managers/approvers for the dropdown
      ]);
      const rulesList = rulesRes.data.data || [];
      const usersList = usersRes.data.data || [];
      setRules(rulesList);
      // Only people who can approve (managers/admins or explicit approvers)
      setUsers(usersList.filter(u => u.isManagerApprover || u.role === 'manager' || u.role === 'admin'));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleApproverChange = (index, field, value) => {
    const newApprovers = [...formData.approvers];
    newApprovers[index][field] = value;
    setFormData({ ...formData, approvers: newApprovers });
  };

  const addApprover = () => {
    setFormData({
      ...formData,
      approvers: [...formData.approvers, { userId: '', label: '' }]
    });
  };

  const removeApprover = (index) => {
    const newApprovers = formData.approvers.filter((_, i) => i !== index);
    setFormData({ ...formData, approvers: newApprovers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Clean up empty fields
      const payload = { ...formData };
      if (payload.minAmountThreshold === '') delete payload.minAmountThreshold;
      if (payload.maxAmountThreshold === '') delete payload.maxAmountThreshold;
      if (payload.percentageThreshold === '') delete payload.percentageThreshold;
      if (payload.specificApproverId === '') delete payload.specificApproverId;
      
      // Remove approvers with no userId
      payload.approvers = payload.approvers.filter(a => a.userId !== '');
      
      await api.post('/approval-rules', payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await api.delete(`/approval-rules/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete rule');
      }
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'sequential': return 'bg-primary';
      case 'percentage': return 'bg-info text-dark';
      case 'specific': return 'bg-warning text-dark';
      case 'hybrid': return 'bg-purple text-white';
      default: return 'bg-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Approval Rules</h3>
          <p className="text-muted mb-0">Configure dynamic expense routing rules.</p>
        </div>
        <button className="btn btn-primary shadow-sm rounded-pill px-4" onClick={() => {
          setFormData({
            name: '', type: 'sequential', approvers: [{ userId: '', label: '' }],
            minAmountThreshold: '', maxAmountThreshold: '', percentageThreshold: '', specificApproverId: '', isDefault: false
          });
          setShowModal(true);
        }}>
          <i className="bi bi-plus-lg me-2"></i>New Rule
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : rules.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <i className="bi bi-diagram-3 fs-1 d-block mb-3"></i>
          <h5>No approval rules defined</h5>
          <p>Create rules to automatically route expenses to the right approvers.</p>
        </div>
      ) : (
        <div className="row g-4">
          {rules.map(rule => (
            <div className="col-md-6 col-lg-4" key={rule._id}>
              <div className="card custom-card h-100 border hover-shadow">
                <div className="card-body p-4 position-relative">
                  {rule.isDefault && (
                    <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-success px-3">
                      Default Rule
                    </span>
                  )}
                  
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold mb-0 text-truncate pe-2">{rule.name}</h5>
                    <span className={`badge ${getTypeBadgeColor(rule.type)}`}>{rule.type.toUpperCase()}</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="small text-muted fw-semibold mb-1">Amount Range</div>
                    <div>
                      {rule.minAmountThreshold !== undefined ? `Min: ${rule.minAmountThreshold}` : 'Min: 0'} - 
                      {rule.maxAmountThreshold !== undefined ? ` Max: ${rule.maxAmountThreshold}` : ' Max: Any'}
                    </div>
                  </div>
                  
                  {rule.type === 'percentage' || rule.type === 'hybrid' ? (
                    <div className="mb-3">
                      <div className="small text-muted fw-semibold mb-1">Threshold Percentage</div>
                      <div>{rule.percentageThreshold}%</div>
                    </div>
                  ) : null}

                  <div className="mb-4">
                    <div className="small text-muted fw-semibold mb-2">Approval Chain</div>
                    <div className="d-flex flex-column gap-2">
                      {rule.approvers.map((app, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-2 bg-light p-2 rounded small">
                          <span className="badge bg-secondary rounded-circle">{idx + 1}</span>
                          <span className="fw-semibold text-truncate">{app.userId?.name}</span>
                          <span className="text-muted ms-auto fst-italic">({app.label})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-auto border-top pt-3">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rule._id)}>
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Rule Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header bg-light border-0 p-4">
                  <h5 className="modal-title fw-bold">Create Approval Rule</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Rule Name</label>
                        <input type="text" className="form-control bg-light" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. High Value Tech Equip" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Rule Type</label>
                        <select className="form-select bg-light" name="type" value={formData.type} onChange={handleChange}>
                          <option value="sequential">Sequential (Manager -&gt; Finance)</option>
                          <option value="percentage">Percentage based</option>
                          <option value="specific">Specific Approver</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Min Amount (Optional)</label>
                        <input type="number" className="form-control bg-light" name="minAmountThreshold" value={formData.minAmountThreshold} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Max Amount (Optional)</label>
                        <input type="number" className="form-control bg-light" name="maxAmountThreshold" value={formData.maxAmountThreshold} onChange={handleChange} />
                      </div>
                    </div>

                    {(formData.type === 'percentage' || formData.type === 'hybrid') && (
                      <div className="mb-4">
                        <label className="form-label small fw-semibold text-muted">Percentage Threshold (%)</label>
                        <input type="number" className="form-control bg-light" name="percentageThreshold" value={formData.percentageThreshold} onChange={handleChange} min="1" max="100" required />
                      </div>
                    )}

                    {(formData.type === 'specific' || formData.type === 'hybrid') && (
                      <div className="mb-4">
                        <label className="form-label small fw-semibold text-muted">Specific Approver</label>
                        <select className="form-select bg-light" name="specificApproverId" value={formData.specificApproverId} onChange={handleChange} required>
                          <option value="">Select an approver</option>
                          {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                        </select>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-semibold text-muted mb-0">Approval Chain</label>
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={addApprover}>
                          <i className="bi bi-plus-lg me-1"></i> Add Step
                        </button>
                      </div>
                      
                      <div className="d-flex flex-column gap-2">
                        {formData.approvers.map((app, idx) => (
                          <div key={idx} className="bg-light p-3 rounded position-relative">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="badge bg-secondary rounded-circle">{idx + 1}</span>
                              <span className="small fw-bold text-muted uppercase">STEP {idx + 1}</span>
                              {formData.approvers.length > 1 && (
                                <button type="button" className="btn btn-sm btn-link text-danger ms-auto p-0 border-0" onClick={() => removeApprover(idx)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                            <div className="row g-2">
                              <div className="col-12 col-md-6">
                                <select className="form-select form-select-sm" value={app.userId} onChange={(e) => handleApproverChange(idx, 'userId', e.target.value)} required>
                                  <option value="">Select Approver</option>
                                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                              </div>
                              <div className="col-12 col-md-6">
                                <input type="text" className="form-control form-control-sm" placeholder="Label (e.g. Finance)" value={app.label} onChange={(e) => handleApproverChange(idx, 'label', e.target.value)} required />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-check form-switch mt-4">
                      <input className="form-check-input" type="checkbox" role="switch" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
                      <label className="form-check-label ms-2" htmlFor="isDefault">Set as Default Rule (Fallback)</label>
                    </div>
                  </div>
                  <div className="modal-footer border-0 p-4 pt-0">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm" /> : 'Save Rule'}
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

export default ApprovalRules;
