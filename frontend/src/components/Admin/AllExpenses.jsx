import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../Shared/StatusBadge';
import ApprovalTimeline from '../Shared/ApprovalTimeline';

const AllExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data } = await api.get('/expenses/all');
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

  const exportPDF = async () => {
    try {
      const response = await api.get('/expenses/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all_expenses_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('PDF Export failed', err);
      alert('Failed to export PDF');
    }
  };

  const filteredExpenses = filter === 'All' 
    ? expenses 
    : expenses.filter(e => e.status.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <h3 className="fw-bold mb-0">All Expenses</h3>
        <button className="btn btn-outline-primary shadow-sm rounded-pill px-4" onClick={exportPDF}>
          <i className="bi bi-file-earmark-pdf me-2"></i>Export All to PDF
        </button>
      </div>

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

      <div className="card custom-card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-receipt fs-1 d-block mb-3"></i>
              <h5>No expenses found</h5>
            </div>
          ) : (
            <>
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Employee</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp._id}>
                      <td className="ps-4 fw-semibold">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center small fw-bold" style={{ width: '32px', height: '32px' }}>
                            {exp.employee?.name?.charAt(0).toUpperCase()}
                          </div>
                          {exp.employee?.name}
                        </div>
                      </td>
                      <td>{exp.title}</td>
                      <td className="text-capitalize">{exp.category}</td>
                      <td>
                        <div className="fw-semibold">{exp.currency} {exp.amount.toLocaleString()}</div>
                        {exp.convertedAmount && exp.convertedAmount !== exp.amount && (
                          <div className="small text-muted">≈ {exp.companyCurrency} {exp.convertedAmount.toLocaleString()}</div>
                        )}
                      </td>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td><StatusBadge status={exp.status} /></td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-light" onClick={() => setSelectedExpense(exp)}>
                          <i className="bi bi-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="d-md-none px-3 py-2">
              {filteredExpenses.map(exp => (
                <div key={exp._id} className="mobile-data-card" onClick={() => setSelectedExpense(exp)}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center small fw-bold" style={{ width: '28px', height: '28px' }}>
                        {exp.employee?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="fw-bold small">{exp.employee?.name}</span>
                    </div>
                    <StatusBadge status={exp.status} />
                  </div>
                  <h6 className="fw-bold mb-1">{exp.title}</h6>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Amount</span>
                    <span className="mobile-data-value text-primary">{exp.currency} {exp.amount.toLocaleString()}</span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Date</span>
                    <span className="mobile-data-value">{new Date(exp.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Category</span>
                    <span className="mobile-data-value text-capitalize small">{exp.category}</span>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedExpense && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => setSelectedExpense(null)}>
            <div className="modal-dialog modal-dialog-centered modal-xl" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header bg-light border-0 p-4">
                  <div>
                    <h4 className="modal-title fw-bold mb-1">Expense Details</h4>
                    <span className="text-muted small">Submitted by {selectedExpense.employee?.name} on {new Date(selectedExpense.date).toLocaleDateString()}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedExpense(null)}></button>
                </div>
                
                <div className="modal-body p-0">
                  <div className="row g-0">
                    <div className="col-lg-7 p-4">
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
                          <div className="mt-2"><StatusBadge status={selectedExpense.status} /></div>
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
                    </div>
                    
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

export default AllExpenses;
