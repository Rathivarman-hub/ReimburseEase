import React from 'react';

const ApprovalTimeline = ({ approvalChain, currentIndex }) => {
  if (!approvalChain || approvalChain.length === 0) return null;

  return (
    <div className="timeline">
      {approvalChain.map((step, index) => {
        const isPending = step.status === 'pending';
        const isApproved = step.status === 'approved';
        const isRejected = step.status === 'rejected';
        
        let itemClass = 'timeline-item ';
        if (isApproved) itemClass += 'approved ';
        if (isRejected) itemClass += 'rejected ';
        if (isPending) itemClass += 'pending ';
        if (index === currentIndex) itemClass += 'active ';

        return (
          <div key={step._id || index} className={itemClass}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="timeline-item-title">
                {step.approverId ? step.approverId.name : 'Unknown Approver'}
              </div>
              {index === currentIndex && isPending && (
                <span className="badge bg-primary rounded-pill">
                  ⏳ Awaiting action
                </span>
              )}
              {isApproved && <span className="badge bg-success rounded-pill">Approved</span>}
              {isRejected && <span className="badge bg-danger rounded-pill">Rejected</span>}
            </div>
            
            <div className="timeline-item-subtitle mt-1">
              {step.label || 'Approver'}
            </div>
            
            {step.actionAt && (
              <div className="small text-muted mt-1">
                <i className="bi bi-clock me-1"></i>
                {new Date(step.actionAt).toLocaleString()}
              </div>
            )}
            
            {step.comment && (
              <div className="mt-2 p-2 bg-light border rounded small fst-italic">
                "{step.comment}"
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ApprovalTimeline;
