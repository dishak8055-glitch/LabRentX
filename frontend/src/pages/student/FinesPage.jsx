import React, { useState, useEffect } from 'react';
import { IndianRupee, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function FinesPage() {
  const { showToast } = useToast();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchFines = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest('/fines/');
      setFines(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      setFines([]);
      setLoadError(err.message || 'The fines ledger could not be loaded.');
      showToast(err.message || 'Failed to load fines', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const totalUnpaid = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
          Late Fines & Penalties
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Overview of late return surcharges calculated automatically based on days overdue.
        </p>
      </div>

      {totalUnpaid > 0 && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={24} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '14px' }}>
                Outstanding Fine Notice: ₹{totalUnpaid.toFixed(2)} Pending
              </div>
              <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '2px' }}>
                New equipment requests are blocked while fines remain unpaid. Please clear with the lab assistant at Lab 204.
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading fines ledger...
        </div>
      ) : loadError ? (
        <EmptyState
          title="Unable to load fines"
          description={loadError}
          action={<button className="btn btn-secondary" onClick={fetchFines}>Try again</button>}
        />
      ) : fines.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No fines recorded"
          description="Your rental record is completely clear. All hardware was returned on time."
        />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fine ID</th>
                  <th>Equipment Requisition</th>
                  <th>Reservation Code</th>
                  <th>Days Overdue</th>
                  <th>Fine Amount</th>
                  <th>Status</th>
                  <th>Details / Waiver</th>
                  <th>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.id}>
                    <td>#{f.id}</td>
                    <td style={{ fontWeight: 600 }}>{f.equipment_name}</td>
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
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {f.status === 'waived' ? (
                        <span title={`Waived by ${f.waived_by_name || 'Admin'}: ${f.waiver_reason}`}>
                          Waived: {f.waiver_reason}
                        </span>
                      ) : f.status === 'paid' ? (
                        <span>Paid on {new Date(f.paid_at).toLocaleDateString()}</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>Payable at Counter</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
