import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge ';
  let iconClass = '';
  let label = '';

  switch (status?.toLowerCase()) {
    case 'pending':
      badgeClass += 'badge-pending';
      iconClass = 'bi bi-clock';
      label = 'Pending';
      break;
    case 'approved':
      badgeClass += 'badge-approved';
      iconClass = 'bi bi-check-circle';
      label = 'Approved';
      break;
    case 'rejected':
      badgeClass += 'badge-rejected';
      iconClass = 'bi bi-x-circle';
      label = 'Rejected';
      break;
    default:
      badgeClass += 'bg-secondary';
      label = status || 'Unknown';
      break;
  }

  return (
    <span className={`${badgeClass} d-inline-flex align-items-center gap-1 px-2 py-1`}>
      {iconClass && <i className={iconClass}></i>}
      {label}
    </span>
  );
};

export default StatusBadge;
