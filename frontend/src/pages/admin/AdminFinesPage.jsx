import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle, ShieldOff, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function AdminFinesPage() {
  const { showToast } = useToast();
  const [fines, setFines] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Waiver Modal
  const [waiveTarget, setWaiveTarget] = useState(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [waiving, setWaiving] = useState(false);

  const fetchFines = async () => {
    setLoading(true);
    try {
      let url = '/fines/?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const data = await apiRequest(url);
      setFines(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load fines ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [statusFilter, search]);

  const handleMarkPaid = async (id) => {
    if (!window.confirm('Confirm receipt of cash payment at lab counter?')) return;
    try {
      await apiRequest(`/fines/${id}/mark-paid/`, { method: 'POST' });
      showToast('Fine marked as paid. Student restriction lifted.', 'success');
      fetchFines();
    } catch (err) {
      showToast(err.message || 'Failed to mark fine as paid', 'error');
    }
  };

  const handleWaiveFine = async () => {
    if (!waiverReason.trim() || waiverReason.trim().length < 5) {
      showToast('A detailed reason (at least 5 characters) is required to waive a fine.', 'error');
      return;
    }

    setWaiving(true);
    try {
      await apiRequest(`/fines/${waiveTarget.id}/waive/`, {
        method: 'POST',
        body: JSON.stringify({ reason: waiverReason.trim() }),
      });
      showToast('Fine successfully waived with recorded reason.', 'info');
      setWaiveTarget(null);
      setWaiverReason('');
      fetchFines();
    } catch (err) {
      showToast(err.message || 'Failed to waive fine', 'error');
    } finally {
      setWaiving(false);
    }
  };

  const totalUnpaid = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Late Fines & Penalties Ledger
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Process counter payments, review overdue charges, or grant official fee waivers with logged justifications.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchFines}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by student name or enrollment number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'unpaid', 'paid', 'waived'].map((tab) => (
            <button
              key={tab}
              className={`btn btn-sm ${statusFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading fines ledger...
        </div>
      ) : fines.length === 0 ? (
        <EmptyState title="No fines found" description="No fine records match your filter criteria." />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fine #</th>
                  <th>Student & Roll</th>
                  <th>Equipment Item</th>
                  <th>Reservation Code</th>
                  <th>Days Late</th>
                  <th>Fine Amount</th>
                  <th>Status</th>
                  <th>Waiver / Payment Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.id}>
                    <td>#{f.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{f.student_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{f.student_enrollment}</div>
                    </td>
                    <td>{f.equipment_name}</td>
                    <td>
                      <span className="res-code-tag">{f.reservation_code || 'N/A'}</span>
                    </td>
                    <td>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>{f.days_late} Days</span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '14px' }}>₹{f.amount}</td>
                    <td>
                      <StatusBadge status={f.status} />
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>
                      {f.status === 'waived' ? (
                        <div title={`Reason: ${f.waiver_reason}`}>
                          <strong style={{ color: '#0f172a' }}>By {f.waived_by_name}:</strong> {f.waiver_reason}
                        </div>
                      ) : f.status === 'paid' ? (
                        <span>Paid: {new Date(f.paid_at).toLocaleDateString()}</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>Pending Clearance</span>
                      )}
                    </td>
                    <td>
                      {f.status === 'unpaid' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkPaid(f.id)}
                            title="Mark fine as collected at counter"
                          >
                            Mark Paid
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setWaiveTarget(f);
                              setWaiverReason('');
                            }}
                            title="Waive fine with reason"
                          >
                            Waive
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waive Fine Modal */}
      {waiveTarget && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Authorize Fine Waiver: #{waiveTarget.id}</h2>
              <button className="btn-icon" onClick={() => setWaiveTarget(null)} style={{ border: 'none' }}>
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <div>
                  Student: <strong>{waiveTarget.student_name}</strong> ({waiveTarget.student_enrollment})
                </div>
                <div style={{ marginTop: '4px' }}>
                  Equipment: <strong>{waiveTarget.equipment_name}</strong>
                </div>
                <div style={{ marginTop: '4px', color: '#dc2626', fontWeight: 600 }}>
                  Fine Amount: ₹{waiveTarget.amount} ({waiveTarget.days_late} days late)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Official Waiver Justification <span className="required-star">*</span>
                </label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  placeholder="Explain why this fine is being waived (e.g. verified medical leave, authorized faculty project extension, lab closed for holiday)..."
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  required
                />
                <span className="form-helper">This reason will be logged in the permanent audit ledger.</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setWaiveTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleWaiveFine}
                disabled={waiving}
              >
                {waiving ? 'Processing...' : 'Confirm Waiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
