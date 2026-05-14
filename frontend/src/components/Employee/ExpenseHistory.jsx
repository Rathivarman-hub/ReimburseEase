import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../Shared/StatusBadge';
import ApprovalTimeline from '../Shared/ApprovalTimeline';

const ExpenseHistory = () => {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data } = await api.get('/expenses/my');
        const expenseList = data.data || [];
        // Sort descending
        setExpenses(expenseList.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (err) {
        console.error('Failed to fetch expenses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const filteredExpenses = filter === 'All' 
    ? expenses 
    : expenses.filter(e => e.status.toLowerCase() === filter.toLowerCase());

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
      <h3 className="fw-bold mb-4">My Expenses</h3>
      
      <div className="mb-4 d-flex gap-2 overflow-auto pb-2 no-scrollbar" style={{ whiteSpace: 'nowrap' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
          <button 
            key={f}
            className={`btn rounded-pill px-4 ${filter === f ? 'btn-primary shadow-sm' : 'btn-outline-secondary bg-white'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filteredExpenses.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <i className="bi bi-inbox fs-1 d-block mb-3"></i>
          <h5>No expenses found</h5>
        </div>
      ) : (
        <div className="row g-4">
          {filteredExpenses.map(exp => (
            <div className="col-md-6 col-lg-4" key={exp._id}>
              <div 
                className="card custom-card h-100 cursor-pointer border hover-shadow transition-all" 
                onClick={() => setSelectedExpense(exp)}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                      <i className={`bi ${getCategoryIcon(exp.category)} fs-5`}></i>
                    </div>
                    <StatusBadge status={exp.status} />
                  </div>
                  
                  <h5 className="fw-bold text-truncate mb-1">{exp.title}</h5>
                  <div className="text-muted small mb-3">{new Date(exp.date).toLocaleDateString()}</div>
                  
                  <h4 className="fw-bold text-primary mb-3">
                    {exp.currency} {exp.amount.toLocaleString()}
                  </h4>
                  
                  <p className="text-muted small text-truncate mb-4">
                    {exp.description || 'No description provided'}
                  </p>
                  
                  {exp.approvalChain && exp.approvalChain.length > 0 && (
                    <div>
                      <div className="d-flex justify-content-between small text-muted mb-1 fw-semibold">
                        <span>Approval Progress</span>
                        <span>Step {exp.currentApproverIndex} of {exp.approvalChain.length}</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div 
                          className={`progress-bar ${exp.status === 'rejected' ? 'bg-danger' : 'bg-success'}`} 
                          style={{ width: `${(exp.currentApproverIndex / exp.approvalChain.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
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
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => setSelectedExpense(null)}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header bg-light border-0 p-4">
                  <div>
                    <h4 className="modal-title fw-bold mb-1">{selectedExpense.title}</h4>
                    <span className="text-muted small">{new Date(selectedExpense.date).toLocaleDateString()}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedExpense(null)}></button>
                </div>
                
                <div className="modal-body p-0">
                  <div className="row g-0">
                    <div className="col-md-7 p-4">
                      {selectedExpense.status === 'rejected' && selectedExpense.finalComment && (
                        <div className="alert alert-danger mb-4 rounded-3">
                          <div className="fw-bold mb-1"><i className="bi bi-exclamation-triangle me-2"></i>Rejection Reason</div>
                          <div className="small">{selectedExpense.finalComment}</div>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                          <div className="text-muted small fw-semibold">Amount</div>
                          <h3 className="fw-bold mb-0 text-primary">{selectedExpense.currency} {selectedExpense.amount.toLocaleString()}</h3>
                          {selectedExpense.convertedAmount && selectedExpense.convertedAmount !== selectedExpense.amount && (
                            <div className="small text-muted mt-1">≈ {selectedExpense.companyCurrency} {selectedExpense.convertedAmount.toLocaleString()}</div>
                          )}
                        </div>
                        <div className="text-end">
                          <div className="text-muted small fw-semibold mb-1">Status</div>
                          <StatusBadge status={selectedExpense.status} />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-muted small fw-semibold mb-1">Category</div>
                        <div className="text-capitalize">{selectedExpense.category}</div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-muted small fw-semibold mb-1">Description</div>
                        <p className="mb-0">{selectedExpense.description || 'No description'}</p>
                      </div>

                      {selectedExpense.receiptUrl && (
                        <div>
                          <div className="text-muted small fw-semibold mb-2">Receipt</div>
                          <a href={selectedExpense.receiptUrl} target="_blank" rel="noreferrer">
                            <img src={selectedExpense.receiptUrl} alt="Receipt" className="img-thumbnail rounded" style={{ maxHeight: '150px' }} />
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="col-md-5 bg-light p-4 border-start">
                      <h6 className="fw-bold mb-4">Approval Timeline</h6>
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

export default ExpenseHistory;
