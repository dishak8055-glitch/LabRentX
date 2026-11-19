import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function MyRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/requests/mine/');
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load your requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this equipment request?')) return;
    try {
      await apiRequest(`/requests/${id}/cancel/`, { method: 'POST' });
      showToast('Request cancelled successfully', 'info');
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status.toLowerCase() === activeTab;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            My Requisitions & Rental History
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Track requisition status, view reservation codes for approved items, and monitor return deadlines.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchRequests} title="Refresh records">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        {['all', 'pending', 'approved', 'issued', 'returned', 'rejected'].map((tab) => {
          const count = tab === 'all' ? requests.length : requests.filter((r) => r.status.toLowerCase() === tab).length;
          return (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Request Cards / Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading your rental records...
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === 'all' ? '' : activeTab} requests`}
          description="You do not have any equipment requests matching this filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map((r) => {
            const isApproved = r.status === 'approved';
            const isIssued = r.status === 'issued';
            const isRejected = r.status === 'rejected';

            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="card-code">{r.equipment_id_display}</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                      {r.equipment_name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={r.status} isOverdue={r.is_overdue} />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Requested: {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* APPROVED HANDOVER HIGHLIGHT BANNER */}
                {isApproved && (
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>
                          Lab Counter Reservation Code:
                        </span>
                        <span className="res-code-tag" style={{ fontSize: '15px', padding: '4px 10px' }}>
                          {r.reservation_code}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#1e3a8a', marginTop: '4px' }}>
                        Visit the laboratory counter, present this code and your enrollment number (<strong>{r.enrollment_no}</strong>) to collect the hardware.
                      </p>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCancel(r.id)}
                      style={{ color: '#dc2626' }}
                    >
                      Cancel Requisition
                    </button>
                  </div>
                )}

                {/* REJECTED REMARK BANNER */}
                {isRejected && (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      color: '#475569',
                      fontSize: '13px',
                    }}
                  >
                    <strong style={{ color: '#0f172a' }}>Lab Assistant Remark: </strong>
                    <span>{r.admin_remark || 'No remark provided.'}</span>
                  </div>
                )}

                {/* ISSUED COUNTDOWN BANNER */}
                {isIssued && (
                  <div
                    style={{
                      backgroundColor: r.is_overdue ? '#fee2e2' : '#f0fdf4',
                      border: `1px solid ${r.is_overdue ? '#fecaca' : '#bbf7d0'}`,
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: r.is_overdue ? '#991b1b' : '#166534' }}>
                        {r.is_overdue
                          ? `OVERDUE: Return deadline passed on ${r.due_date}!`
                          : `Currently in your possession. Return due date: ${r.due_date}`}
                      </div>
                      <div style={{ fontSize: '12px', color: r.is_overdue ? '#b91c1c' : '#15803d', marginTop: '2px' }}>
                        Late Fine: ₹{r.late_fine_per_day} per day applies for late return.
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '12.5px',
                    color: '#334155',
                    backgroundColor: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Duration: </span>
                    <strong>{r.num_days} Days</strong> ({r.start_date} to {r.return_date})
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Purpose: </span>
                    <span title={r.reason} style={{ fontStyle: 'italic' }}>
                      "{r.reason?.length > 40 ? r.reason.slice(0, 40) + '...' : r.reason}"
                    </span>
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCancel(r.id)}
                        style={{ color: '#dc2626' }}
                      >
                        Cancel Requisition
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
