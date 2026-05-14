import React, { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import StatusBadge from '../Shared/StatusBadge';

const ApprovalHistory = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/expenses/all');
        const expenseList = data.data || [];
        
        // Filter where approvalChain has current user's _id with non-pending status
        const myHistory = expenseList.filter(exp => {
          const myStep = exp.approvalChain?.find(step => step.approverId?._id === user._id || step.approverId === user._id);
          return myStep && myStep.status !== 'pending';
        });
        
        // Sort descending by action date (or just date)
        myHistory.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        setHistory(myHistory);
      } catch (err) {
        console.error('Failed to fetch approval history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user._id]);

  const getMyAction = (exp) => {
    const myStep = exp.approvalChain?.find(step => step.approverId?._id === user._id || step.approverId === user._id);
    if (!myStep) return null;
    return myStep.status; // 'approved' or 'rejected'
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">Approval History</h3>

      <div className="card custom-card">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : history.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-clock-history fs-1 d-block mb-3"></i>
              <h5>No history found</h5>
              <p>You haven't reviewed any expenses yet.</p>
            </div>
          ) : (
            <>
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>My Action</th>
                    <th>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((exp) => {
                    const myAction = getMyAction(exp);
                    return (
                      <tr key={exp._id}>
                        <td className="fw-semibold">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center small fw-bold" style={{ width: '32px', height: '32px' }}>
                              {exp.employee?.name?.charAt(0).toUpperCase()}
                            </div>
                            {exp.employee?.name}
                          </div>
                        </td>
                        <td>{exp.title}</td>
                        <td>
                          <div className="fw-semibold">{exp.currency} {exp.amount.toLocaleString()}</div>
                        </td>
                        <td>{new Date(exp.date).toLocaleDateString()}</td>
                        <td>
                          {myAction === 'approved' ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i className="bi bi-check me-1"></i>Approved</span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i className="bi bi-x me-1"></i>Rejected</span>
                          )}
                        </td>
                        <td><StatusBadge status={exp.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="d-md-none">
              {history.map((exp) => {
                const myAction = getMyAction(exp);
                return (
                  <div key={exp._id} className="mobile-data-card p-3 border-bottom rounded-0 mb-0">
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
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">{new Date(exp.date).toLocaleDateString()}</span>
                      <span className="fw-bold text-primary">{exp.currency} {exp.amount.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-end">
                      <span className="small text-muted me-2">My Action:</span>
                      {myAction === 'approved' ? (
                        <span className="text-success small fw-bold">Approved</span>
                      ) : (
                        <span className="text-danger small fw-bold">Rejected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalHistory;
