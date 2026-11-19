import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function AdminRequestsPage({ onOpenHandoverWithCode }) {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [reviewRequest, setReviewRequest] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let url = '/requests/all/?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const data = await apiRequest(url);
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, search]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiRequest(`/requests/${id}/decide/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      });
      showToast(`Request Approved! Reservation Code: ${res.reservation_code}`, 'success');
      setReviewRequest(null);
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectRemark.trim()) {
      showToast('A remark is strictly required when rejecting a request.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await apiRequest(`/requests/${id}/decide/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', remark: rejectRemark.trim() }),
      });
      showToast('Request rejected with remark.', 'info');
      setReviewRequest(null);
      setIsRejecting(false);
      setRejectRemark('');
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by student roll, name, code, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchRequests}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        {['all', 'pending', 'approved', 'issued', 'returned', 'rejected'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests found"
          description="There are currently no requests matching your selected criteria."
        />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Student Info</th>
                  <th>Equipment Requisition</th>
                  <th>Duration & Dates</th>
                  <th>Reservation Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {r.student_enrollment} • {r.class_division}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.equipment_name}</div>
                      <div style={{ fontSize: '11px', color: '#2563eb' }}>{r.equipment_id_display}</div>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      <strong>{r.num_days} days</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {r.start_date} to {r.return_date}
                      </div>
                    </td>
                    <td>
                      {r.reservation_code ? (
                        <span className="res-code-tag">{r.reservation_code}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={r.status} isOverdue={r.is_overdue} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setReviewRequest(r);
                            setIsRejecting(false);
                            setRejectRemark('');
                          }}
                        >
                          Review
                        </button>
                        {r.status === 'approved' && onOpenHandoverWithCode && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onOpenHandoverWithCode(r.reservation_code)}
                          >
                            Issue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Requisition Modal */}
      {reviewRequest && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="modal-title">Requisition Review: #{reviewRequest.id}</h2>
                <StatusBadge status={reviewRequest.status} isOverdue={reviewRequest.is_overdue} />
              </div>
              <button
                className="btn-icon"
                onClick={() => setReviewRequest(null)}
                style={{ border: 'none' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Student & Equipment summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Student Details
                  </span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '3px' }}>
                    {reviewRequest.student_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Enrollment: <strong>{reviewRequest.student_enrollment}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Class: {reviewRequest.class_division}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Phone: {reviewRequest.phone} | {reviewRequest.email}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Equipment Requested
                  </span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '3px' }}>
                    {reviewRequest.equipment_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2563eb' }}>
                    ID: {reviewRequest.equipment_id_display}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Period: {reviewRequest.num_days} Days ({reviewRequest.start_date} to {reviewRequest.return_date})
                  </div>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>
                    Late fine rate: ₹{reviewRequest.late_fine_per_day}/day
                  </div>
                </div>
              </div>

              {/* Justification Textarea display */}
              <div>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  Project Justification / Academic Context
                </h4>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: '#1e293b',
                    lineHeight: 1.5,
                  }}
                >
                  "{reviewRequest.reason}"
                </div>
              </div>

              {/* Reservation code if approved */}
              {reviewRequest.reservation_code && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
                    Reservation Code:
                  </span>
                  <span className="res-code-tag">{reviewRequest.reservation_code}</span>
                </div>
              )}

              {/* Rejection remark section if rejecting */}
              {isRejecting && (
                <div
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    padding: '14px',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <label className="form-label" style={{ color: '#9f1239' }}>
                    Administrative Rejection Reason <span className="required-star">*</span>
                  </label>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="Specify reason (e.g. equipment reserved for faculty lab, incomplete details, dates conflict)..."
                    value={rejectRemark}
                    onChange={(e) => setRejectRemark(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsRejecting(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(reviewRequest.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReviewRequest(null)}>
                Close
              </button>

              {reviewRequest.status === 'pending' && !isRejecting && (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={() => setIsRejecting(true)}
                    disabled={actionLoading}
                  >
                    Reject Requisition
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApprove(reviewRequest.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Approving...' : 'Approve & Issue Code'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
