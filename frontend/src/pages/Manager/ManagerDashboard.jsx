import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import StatusBadge from '../../components/Shared/StatusBadge';

const ManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentPending, setRecentPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/expenses/pending-approvals');
        const list = data.data || [];
        setPendingCount(list.length);
        setRecentPending(list.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-4 text-center"><div className="spinner-border text-primary" /></div>;

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Welcome back, {user.name}!</h3>
        <p className="text-muted mb-0">Here's your approval dashboard.</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card custom-card stat-card warning h-100 p-3">
            <div className="text-muted small fw-semibold mb-1">PENDING APPROVALS</div>
            <div className="d-flex align-items-center justify-content-between">
              <h3 className="fw-bold mb-0">{pendingCount}</h3>
              <div className="bg-warning bg-opacity-10 text-warning rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-inbox fs-5"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card custom-card">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Recent Pending Requests</h5>
          <Link to="/manager/approvals" className="btn btn-sm btn-outline-primary rounded-pill px-3">View All</Link>
        </div>
        <div className="card-body p-4">
          {recentPending.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
              You're all caught up! No pending approvals.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPending.map((exp) => (
                    <tr key={exp._id}>
                      <td className="fw-semibold">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center small fw-bold" style={{ width: '32px', height: '32px' }}>
                            {exp.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                          {exp.userId?.name}
                        </div>
                      </td>
                      <td>{exp.title}</td>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td>
                        <div className="fw-semibold">{exp.currency} {(exp.amount || 0).toLocaleString()}</div>
                        {exp.convertedAmount && exp.convertedAmount !== exp.amount && (
                          <div className="small text-muted">≈ {exp.convertedCurrency} {(exp.convertedAmount || 0).toLocaleString()}</div>
                        )}
                      </td>
                      <td>
                        <Link to="/manager/approvals" className="btn btn-sm btn-primary rounded-pill">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
