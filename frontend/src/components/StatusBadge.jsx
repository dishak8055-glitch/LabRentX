import React from 'react';

export default function StatusBadge({ status, isOverdue }) {
  if (isOverdue && status === 'issued') {
    return <span className="badge badge-overdue">Overdue</span>;
  }

  switch (status?.toLowerCase()) {
    case 'pending':
      return <span className="badge badge-pending">Pending Review</span>;
    case 'approved':
      return <span className="badge badge-approved">Approved</span>;
    case 'issued':
      return <span className="badge badge-issued">Currently Issued</span>;
    case 'returned':
      return <span className="badge badge-returned">Returned</span>;
    case 'rejected':
      return <span className="badge badge-rejected">Rejected</span>;
    case 'cancelled':
      return <span className="badge badge-cancelled">Cancelled</span>;
    case 'expired':
      return <span className="badge badge-rejected">Expired</span>;
    case 'unpaid':
      return <span className="badge badge-overdue">Unpaid Fine</span>;
    case 'paid':
      return <span className="badge badge-returned">Paid</span>;
    case 'waived':
      return <span className="badge badge-rejected">Waived</span>;
    default:
      return <span className="badge badge-rejected">{status}</span>;
  }
}
