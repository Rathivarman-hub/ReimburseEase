import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// ChartJS registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, totalApprovedAmount: 0 });
  const [chartData, setChartData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        
        setStats({
          total: data.totalExpenses,
          pending: data.pendingExpenses,
          approved: data.approvedExpenses,
          rejected: data.rejectedExpenses,
          totalApprovedAmount: data.totalApprovedAmount
        });

        if (data.monthlyTotals) {
          setChartData({
            labels: data.monthlyTotals.map(m => m.month),
            datasets: [
              {
                label: `Amount (${user.company.currency})`,
                data: data.monthlyTotals.map(m => m.total),
                backgroundColor: '#4f46e5',
                borderRadius: 4,
              }
            ]
          });
        }

        if (data.categoryDistribution) {
          setPieData({
            labels: data.categoryDistribution.map(c => c._id),
            datasets: [
              {
                data: data.categoryDistribution.map(c => c.count),
                backgroundColor: [
                  '#4f46e5', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6'
                ],
                borderWidth: 1,
              }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user.company.currency]);

  const exportPDF = async () => {
    try {
      const response = await api.get('/expenses/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('PDF Export failed', err);
      alert('Failed to export PDF');
    }
  };

  if (loading) return <div className="p-4 text-center"><div className="spinner-border text-primary" /></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Company Dashboard</h3>
          <p className="text-muted mb-0">Overview of all company expenses.</p>
        </div>
        <button className="btn btn-outline-primary shadow-sm rounded-pill px-4" onClick={exportPDF}>
          <i className="bi bi-file-earmark-pdf me-2"></i>Export Report
        </button>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-6 col-md-3">
          <div className="card custom-card stat-card primary h-100 p-3">
            <div className="text-muted small fw-semibold mb-1">TOTAL APPROVED</div>
            <h4 className="fw-bold mb-0 text-primary text-truncate">{user.company.currencySymbol}{(stats.totalApprovedAmount || 0).toLocaleString()}</h4>
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

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card custom-card h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold">Monthly Expenses (Last 6 Months)</h5>
            </div>
            <div className="card-body p-4">
              {chartData ? (
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center text-muted py-5">No data available</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card custom-card h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold">Expenses by Category</h5>
            </div>
            <div className="card-body p-4 d-flex justify-content-center">
              {pieData ? (
                <div style={{ height: '250px' }}>
                  <Pie 
                    data={pieData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } }
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center text-muted py-5">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
