import React, { useState, useEffect } from 'react';
import { Search, UserCheck, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import IssueReturnModal from '../../components/IssueReturnModal';

export default function AdminIssueReturnPage({ initialCode }) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('approved'); // 'approved' or 'issued'
  const [approvedList, setApprovedList] = useState([]);
  const [issuedList, setIssuedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal handover state
  const [modalCode, setModalCode] = useState(initialCode || '');
  const [modalOpen, setModalOpen] = useState(!!initialCode);

  const fetchHandoverQueues = async () => {
    setLoading(true);
    try {
      const [approvedRes, issuedRes] = await Promise.all([
        apiRequest('/requests/all/?status=approved'),
        apiRequest('/requests/all/?status=issued'),
      ]);
      setApprovedList(Array.isArray(approvedRes) ? approvedRes : approvedRes.results || []);
      setIssuedList(Array.isArray(issuedRes) ? issuedRes : issuedRes.results || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load counter handover lists', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoverQueues();
  }, []);

  const openCounterModal = (code = '') => {
    setModalCode(code);
    setModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Lab Counter Handover & Return Station
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Physical handover counter: Enter reservation codes, match student enrollment cards, and inspect returned equipment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchHandoverQueues}>
            <RefreshCw size={14} /> Refresh Queue
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openCounterModal('')}>
            <Search size={14} /> Open Code Scanner / Lookup
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Awaiting Handover / Pickup ({approvedList.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'issued' ? 'active' : ''}`}
          onClick={() => setActiveTab('issued')}
        >
          Currently Issued / Awaiting Return ({issuedList.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading queue...
        </div>
      ) : activeTab === 'approved' ? (
        /* Approved List awaiting issue */
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Approved Hardware Ready for Student Handover</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Student must present their reservation code and college ID card
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reservation Code</th>
                  <th>Student Name & Roll</th>
                  <th>Hardware Item</th>
                  <th>Approved Period</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No approved reservations currently waiting for collection.
                    </td>
                  </tr>
                ) : (
                  approvedList.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="res-code-tag" style={{ fontSize: '14px' }}>
                          {r.reservation_code}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Roll: <strong>{r.student_enrollment}</strong> • {r.class_division}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.equipment_name}</div>
                        <div style={{ fontSize: '11px', color: '#2563eb' }}>{r.equipment_id_display}</div>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>
                        {r.num_days} Days ({r.start_date} to {r.return_date})
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openCounterModal(r.reservation_code)}
                        >
                          Verify & Issue
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Issued List awaiting return */
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Active Equipment in Student Possession</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Inspect physical condition and log damage/fine upon return
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reservation Code</th>
                  <th>Student & Roll</th>
                  <th>Equipment</th>
                  <th>Due Date</th>
                  <th>Status / Overdue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issuedList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No active equipment rentals currently issued.
                    </td>
                  </tr>
                ) : (
                  issuedList.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="res-code-tag">{r.reservation_code}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.student_enrollment}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.equipment_name}</div>
                        <div style={{ fontSize: '11px', color: '#2563eb' }}>{r.equipment_id_display}</div>
                      </td>
                      <td style={{ fontSize: '12.5px', fontWeight: r.is_overdue ? 700 : 400, color: r.is_overdue ? '#dc2626' : '#0f172a' }}>
                        {r.due_date || r.return_date}
                      </td>
                      <td>
                        <StatusBadge status={r.status} isOverdue={r.is_overdue} />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openCounterModal(r.reservation_code)}
                        >
                          Process Return
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      <IssueReturnModal
        isOpen={modalOpen}
        initialReservationCode={modalCode}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchHandoverQueues();
        }}
      />
    </div>
  );
}
