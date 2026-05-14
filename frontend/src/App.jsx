import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Shared/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './components/Admin/UserManagement';
import AllExpenses from './components/Admin/AllExpenses';
import ApprovalRules from './components/Admin/ApprovalRules';

// Manager Pages
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import PendingApprovals from './components/Manager/PendingApprovals';
import ApprovalHistory from './components/Manager/ApprovalHistory';

// Employee Pages
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import SubmitExpense from './components/Employee/SubmitExpense';
import ExpenseHistory from './components/Employee/ExpenseHistory';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const [showSidebar, setShowSidebar] = React.useState(false);

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'manager') return <Navigate to="/manager" replace />;
    return <Navigate to="/employee" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="mobile-header d-lg-none">
        <button className="btn border-0 p-0" onClick={() => setShowSidebar(true)}>
          <i className="bi bi-list fs-2"></i>
        </button>
        <h5 className="mb-0 fw-bold">ReimburseEase</h5>
        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
      
      <div className="d-flex flex-grow-1">
        <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
        <div className="main-content flex-grow-1 bg-light">
          <Outlet />
        </div>
      </div>

      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="modal-backdrop fade show d-lg-none" 
          style={{ zIndex: 1045 }} 
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </div>
  );
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" /></div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <Register />} />
        <Route path="/" element={<Navigate to={user ? `/${user.role}` : "/login"} replace />} />

        {/* Admin Routes */}
        <Route element={<PrivateRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/expenses" element={<AllExpenses />} />
          <Route path="/admin/approval-rules" element={<ApprovalRules />} />
        </Route>

        {/* Manager Routes */}
        <Route element={<PrivateRoute allowedRoles={['manager']} />}>
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/approvals" element={<PendingApprovals />} />
          <Route path="/manager/history" element={<ApprovalHistory />} />
        </Route>

        {/* Employee Routes - Manager can also access employee routes for their own expenses */}
        <Route element={<PrivateRoute allowedRoles={['employee', 'manager']} />}>
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/submit" element={<SubmitExpense />} />
          <Route path="/employee/history" element={<ExpenseHistory />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
