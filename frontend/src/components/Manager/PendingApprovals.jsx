import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../Shared/StatusBadge';
import ApprovalTimeline from '../Shared/ApprovalTimeline';

const PendingApprovals = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/expenses/pending-approvals');
      setExpenses(data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (action) => {
    if (action === 'reject' && !comment.trim()) {
      setActionError('Comment is required for rejection');
      return;
    }
    
    setActionError('');
    setActionLoading(true);
    
    try {
      await api.patch(`/expenses/${selectedExpense._id}/${action}`, { comment });
      setSelectedExpense(null);
      setComment('');
      fetchPending(); // Refresh list
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${action} expense`);
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat?.toLowerCase()) {
      case 'travel': return 'bi-airplane';
      case 'food': return 'bi-cup-hot';
      case 'accommodation': return 'bi-building';
      case 'medical': return 'bi-heart-pulse';
      case 'office': return 'bi-laptop';
      case 'training': return 'bi-book';
      default: return 'bi-receipt';
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">Pending Approvals</h3>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : expenses.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <i className="bi bi-check-circle fs-1 d-block mb-3 text-success"></i>
          <h5>You're all caught up!</h5>
          <p>No expenses are waiting for your approval right now.</p>
        </div>
      ) : (
        <div className="row g-4">
          {expenses.map(exp => (
            <div className="col-md-6 col-xl-4" key={exp._id}>
              <div className="card custom-card h-100 border">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center small fw-bold" style={{ width: '36px', height: '36px' }}>
                        {exp.employee?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: '120px' }}>{exp.employee?.name}</div>
                    </div>
                    <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                      <i className={`bi ${getCategoryIcon(exp.category)}`}></i>
                    </div>
                  </div>
                  
                  <h5 className="fw-bold text-truncate mb-1">{exp.title}</h5>
                  <div className="text-muted small mb-3">{new Date(exp.date).toLocaleDateString()}</div>
                  
                  <h4 className="fw-bold text-primary mb-3">
                    {exp.currency} {exp.amount.toLocaleString()}
                  </h4>
                  {exp.convertedAmount && exp.convertedAmount !== exp.amount && (
                    <div className="small text-muted mb-3" style={{ marginTop: '-12px' }}>
                      ≈ {exp.companyCurrency} {exp.convertedAmount.toLocaleString()}
                    </div>
                  )}
                  
                  <p className="text-muted small mb-4 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {exp.description || 'No description provided'}
                  </p>
                  
                  <button 
                    className="btn btn-outline-primary w-100 rounded-pill fw-semibold"
                    onClick={() => { setSelectedExpense(exp); setComment(''); setActionError(''); }}
                  >
                    Review Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedExpense && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => !actionLoading && setSelectedExpense(null)}>
            <div className="modal-dialog modal-dialog-centered modal-xl" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header bg-light border-0 p-4">
                  <div>
                    <h4 className="modal-title fw-bold mb-1">Review Expense Request</h4>
                    <span className="text-muted small">Submitted by {selectedExpense.employee?.name} on {new Date(selectedExpense.date).toLocaleDateString()}</span>
                  </div>
                  <button type="button" className="btn-close" disabled={actionLoading} onClick={() => setSelectedExpense(null)}></button>
                </div>
                
                <div className="modal-body p-0">
                  <div className="row g-0">
                    {/* Left: Details */}
                    <div className="col-lg-7 p-4">
                      {actionError && <div className="alert alert-danger mb-4">{actionError}</div>}
                      
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                          <h5 className="fw-bold mb-1">{selectedExpense.title}</h5>
                          <div className="text-capitalize text-muted small">{selectedExpense.category}</div>
                        </div>
                        <div className="text-end">
                          <h3 className="fw-bold mb-0 text-primary">{selectedExpense.currency} {selectedExpense.amount.toLocaleString()}</h3>
                          {selectedExpense.convertedAmount && selectedExpense.convertedAmount !== selectedExpense.amount && (
                            <div className="small text-muted mt-1">≈ {selectedExpense.companyCurrency} {selectedExpense.convertedAmount.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-muted small fw-semibold mb-1">Description</div>
                        <p className="mb-0 bg-light p-3 rounded">{selectedExpense.description || 'No description provided.'}</p>
                      </div>

                      {selectedExpense.receiptUrl && (
                        <div className="mb-4">
                          <div className="text-muted small fw-semibold mb-2">Receipt Document</div>
                          <a href={selectedExpense.receiptUrl} target="_blank" rel="noreferrer">
                            <img src={selectedExpense.receiptUrl} alt="Receipt" className="img-thumbnail rounded" style={{ maxHeight: '200px' }} />
                          </a>
                        </div>
                      )}
                      
                      <hr className="my-4" />
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Add Comment</label>
                        <textarea 
                          className="form-control bg-light" 
                          rows="3" 
                          placeholder="Optional for approval, required for rejection"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          disabled={actionLoading}
                        ></textarea>
                      </div>
                      
                      <div className="d-flex gap-3">
                        <button 
                          className="btn btn-danger px-4 rounded-pill fw-semibold flex-grow-1"
                          onClick={() => handleAction('reject')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-x-lg me-2"></i>Reject</>}
                        </button>
                        <button 
                          className="btn btn-success px-4 rounded-pill fw-semibold flex-grow-1"
                          onClick={() => handleAction('approve')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-check-lg me-2"></i>Approve</>}
                        </button>
                      </div>
                    </div>
                    
                    {/* Right: Timeline */}
                    <div className="col-lg-5 bg-light p-4 border-start">
                      <h6 className="fw-bold mb-4">Approval Chain</h6>
                      <ApprovalTimeline 
                        approvalChain={selectedExpense.approvalChain} 
                        currentIndex={selectedExpense.currentApproverIndex} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PendingApprovals;
