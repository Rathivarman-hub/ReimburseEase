import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import StatusBadge from '../../components/Shared/StatusBadge';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/expenses/my'); // Need to fetch my expenses and calculate stats
        const allExpenses = data.data || [];
        
        const total = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        const pending = allExpenses.filter(e => e.status === 'pending').length;
        const approved = allExpenses.filter(e => e.status === 'approved').length;
        const rejected = allExpenses.filter(e => e.status === 'rejected').length;
        
        setStats({ total, pending, approved, rejected });
        
        // sort by date descending
        const sorted = allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecent(sorted.slice(0, 5));
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Welcome back, {user.name}!</h3>
          <p className="text-muted mb-0">Here's an overview of your expenses.</p>
        </div>
        <Link to="/employee/submit" className="btn btn-primary shadow-sm rounded-pill px-4">
          <i className="bi bi-plus-lg me-2"></i>New Expense
        </Link>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-6 col-md-3">
          <div className="card custom-card stat-card primary h-100 p-3">
            <div className="text-muted small fw-semibold mb-1">TOTAL</div>
            <h4 className="fw-bold mb-0 text-truncate">{user.company.currencySymbol}{(stats.total || 0).toLocaleString()}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card custom-card stat-card warning h-100 p-3">
            <div className="text-muted small fw-semibold mb-1">PENDING</div>
            <h4 className="fw-bold mb-0">{stats.pending}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card custom-card stat-card success h-100 p-3">
            <div className="text-muted small fw-semibold mb-1">APPROVED</div>
            <h4 className="fw-bold mb-0">{stats.approved}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card custom-card stat-card danger h-100 p-3">
            <div className="text-muted small fw-semibold mb-1">REJECTED</div>
            <h4 className="fw-bold mb-0">{stats.rejected}</h4>
          </div>
        </div>
      </div>

      <div className="card custom-card">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
          <h5 className="fw-bold">Recent Expenses</h5>
        </div>
        <div className="card-body p-4">
          {recent.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-receipt fs-1 d-block mb-2"></i>
              No expenses submitted yet.
            </div>
          ) : (
            <>
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((exp) => (
                    <tr key={exp._id}>
                      <td className="fw-semibold">{exp.title}</td>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="text-capitalize">{exp.category}</td>
                      <td>{exp.currency} {(exp.amount || 0).toLocaleString()}</td>
                      <td><StatusBadge status={exp.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="d-md-none">
              {recent.map((exp) => (
                <div key={exp._id} className="mobile-data-card border-bottom mb-0 rounded-0 py-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold">{exp.title}</span>
                    <StatusBadge status={exp.status} />
                  </div>
                  <div className="d-flex justify-content-between small text-muted">
                    <span>{exp.currency} {exp.amount.toLocaleString()}</span>
                    <span>{new Date(exp.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              <div className="text-center mt-3">
                <Link to="/employee/history" className="btn btn-sm btn-light w-100 rounded-pill">View All History</Link>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* FAB for Mobile */}
      <Link to="/employee/submit" className="fab d-md-none">
        <i className="bi bi-plus-lg"></i>
      </Link>
    </div>
  );
};

export default EmployeeDashboard;
