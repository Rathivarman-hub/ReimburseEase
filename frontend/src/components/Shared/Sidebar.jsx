import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Sidebar = ({ show, onClose }) => {
  const { user, logout, notifications } = useContext(AuthContext);

  if (!user) return null;

  const role = user.role;

  const renderLinks = () => {
    if (role === 'admin') {
      return (
        <>
          <NavLink to="/admin" end className="sidebar-nav-link">
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
          <NavLink to="/admin/users" className="sidebar-nav-link">
            <i className="bi bi-people"></i> Users
          </NavLink>
          <NavLink to="/admin/expenses" className="sidebar-nav-link">
            <i className="bi bi-receipt"></i> All Expenses
          </NavLink>
          <NavLink to="/admin/approval-rules" className="sidebar-nav-link">
            <i className="bi bi-sliders"></i> Approval Rules
          </NavLink>
        </>
      );
    } else if (role === 'manager') {
      return (
        <>
          <NavLink to="/manager" end className="sidebar-nav-link">
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
          <NavLink to="/manager/approvals" className="sidebar-nav-link">
            <i className="bi bi-inbox"></i> Pending Approvals
          </NavLink>
          <NavLink to="/manager/history" className="sidebar-nav-link">
            <i className="bi bi-clock-history"></i> Approval History
          </NavLink>
          <NavLink to="/employee/history" className="sidebar-nav-link">
            <i className="bi bi-wallet2"></i> My Expenses
          </NavLink>
        </>
      );
    } else {
      return (
        <>
          <NavLink to="/employee" end className="sidebar-nav-link">
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
          <NavLink to="/employee/submit" className="sidebar-nav-link">
            <i className="bi bi-plus-circle"></i> Submit Expense
          </NavLink>
          <NavLink to="/employee/history" className="sidebar-nav-link">
            <i className="bi bi-clock-history"></i> My History
          </NavLink>
        </>
      );
    }
  };

  return (
    <>
    <div className={`sidebar shadow ${show ? 'show' : ''}`}>
      <div className="p-4 d-flex align-items-center justify-content-between">
        <h4 className="m-0 fw-bold">ReimburseEase</h4>
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-sm btn-outline-light d-lg-none" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
          <div className="position-relative">
            <i className="bi bi-bell fs-5"></i>
            {notifications.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="d-flex flex-column flex-grow-1 mt-3">
        <div onClick={() => window.innerWidth < 992 && onClose()}>
          {renderLinks()}
        </div>
      </div>
      <div className="p-3 mt-auto border-top border-secondary">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <div className="text-truncate fw-semibold">{user.name}</div>
            <div className="text-truncate small text-white-50">{user.email}</div>
          </div>
          <button className="btn btn-sm btn-outline-light border-0" onClick={logout} title="Logout">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>

    {/* Bottom Nav for Mobile */}
    <div className="bottom-nav d-lg-none">
      {role === 'admin' ? (
        <>
          <NavLink to="/admin" end className="bottom-nav-item">
            <i className="bi bi-speedometer2"></i><span>Home</span>
          </NavLink>
          <NavLink to="/admin/users" className="bottom-nav-item">
            <i className="bi bi-people"></i><span>Users</span>
          </NavLink>
          <NavLink to="/admin/expenses" className="bottom-nav-item">
            <i className="bi bi-receipt"></i><span>Expenses</span>
          </NavLink>
          <NavLink to="/admin/approval-rules" className="bottom-nav-item">
            <i className="bi bi-sliders"></i><span>Rules</span>
          </NavLink>
        </>
      ) : role === 'manager' ? (
        <>
          <NavLink to="/manager" end className="bottom-nav-item">
            <i className="bi bi-speedometer2"></i><span>Home</span>
          </NavLink>
          <NavLink to="/manager/approvals" className="bottom-nav-item">
            <i className="bi bi-inbox"></i><span>Pending</span>
          </NavLink>
          <NavLink to="/manager/history" className="bottom-nav-item">
            <i className="bi bi-clock-history"></i><span>History</span>
          </NavLink>
          <NavLink to="/employee/history" className="bottom-nav-item">
            <i className="bi bi-wallet2"></i><span>Personal</span>
          </NavLink>
        </>
      ) : (
        <>
          <NavLink to="/employee" end className="bottom-nav-item">
            <i className="bi bi-speedometer2"></i><span>Home</span>
          </NavLink>
          <NavLink to="/employee/submit" className="bottom-nav-item">
            <i className="bi bi-plus-circle"></i><span>Submit</span>
          </NavLink>
          <NavLink to="/employee/history" className="bottom-nav-item">
            <i className="bi bi-clock-history"></i><span>History</span>
          </NavLink>
        </>
      )}
    </div>
    </>
  );
};

export default Sidebar;
