import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, AlertTriangle, UserCheck, Calendar, IndianRupee } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useToast } from '../context/ToastContext';
import StatusBadge from './StatusBadge';

export default function IssueReturnModal({ isOpen, onClose, onSuccess, initialReservationCode }) {
  const { showToast } = useToast();

  const [reservationCode, setReservationCode] = useState(initialReservationCode || '');
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Issue verification
  const [enrollmentInput, setEnrollmentInput] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Return verification
  const [condition, setCondition] = useState('good');
  const [damageNotes, setDamageNotes] = useState('');
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReservationCode(initialReservationCode || '');
      setRequestData(null);
      setError('');
      setEnrollmentInput('');
      setCondition('good');
      setDamageNotes('');
    }
  }, [isOpen, initialReservationCode]);

  const handleLookup = async (codeToLookup) => {
    const code = codeToLookup || reservationCode;
    if (!code.trim()) {
      setError('Please enter a reservation code.');
      return;
    }

    setLoading(true);
    setError('');
    setRequestData(null);

    try {
      const data = await apiRequest('/requests/lookup/', {
        method: 'POST',
        body: JSON.stringify({ reservation_code: code.trim().toUpperCase() }),
      });
      setRequestData(data);
      setEnrollmentInput('');
    } catch (err) {
      setError(err.message || 'No reservation found for this code.');
      showToast(err.message || 'Lookup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!enrollmentInput.trim()) {
      setError('Please enter and verify the student enrollment number.');
      return;
    }

    setIssuing(true);
    setError('');

    try {
      const res = await apiRequest(`/requests/${requestData.id}/issue/`, {
        method: 'POST',
        body: JSON.stringify({
          enrollment_no: enrollmentInput.trim(),
          reservation_code: reservationCode.trim().toUpperCase(),
        }),
      });

      showToast(`Equipment handed over successfully! Due date set to ${res.due_date}.`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to issue equipment.');
      showToast(err.message || 'Issue failed', 'error');
    } finally {
      setIssuing(false);
    }
  };

  const handleReturn = async () => {
    setReturning(true);
    setError('');

    try {
      const res = await apiRequest(`/requests/${requestData.id}/return/`, {
        method: 'POST',
        body: JSON.stringify({
          reservation_code: reservationCode.trim().toUpperCase(),
          condition,
          damage_notes: damageNotes,
        }),
      });

      if (parseFloat(res.fine_amount) > 0) {
        showToast(
          `Equipment returned. Overdue by ${res.days_late} days. Late fine of ₹${res.fine_amount} recorded!`,
          'info'
        );
      } else {
        showToast('Equipment returned in good condition. Stock restored.', 'success');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process return.');
      showToast(err.message || 'Return failed', 'error');
    } finally {
      setReturning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Lab Counter Handover (Issue & Return)</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Software-only verification: check reservation code, match enrollment ID, and log return condition
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Lookup Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter Reservation Code (e.g. LRX-48213)"
                className="form-input"
                style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}
                value={reservationCode}
                onChange={(e) => setReservationCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLookup();
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleLookup()}
              disabled={loading}
              style={{ display: 'flex', gap: '6px' }}
            >
              <Search size={16} />
              {loading ? 'Searching...' : 'Lookup Code'}
            </button>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Details Card once looked up */}
          {requestData && (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '18px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="res-code-tag">{requestData.reservation_code}</span>
                  <StatusBadge status={requestData.status} isOverdue={requestData.is_overdue} />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Req ID: #{requestData.id}
                </span>
              </div>

              {/* Equipment and Student Snapshot */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  backgroundColor: '#ffffff',
                  padding: '14px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Hardware Requisitioned
                  </span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {requestData.equipment_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2563eb', fontFamily: 'monospace' }}>
                    {requestData.equipment_id_display}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Student In-Person
                  </span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {requestData.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Roll: <strong>{requestData.enrollment_no}</strong> • {requestData.class_division}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Rental Period
                  </span>
                  <div style={{ marginTop: '2px', color: '#334155' }}>
                    {requestData.num_days} days ({requestData.start_date} to {requestData.due_date || requestData.return_date})
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Late Fine Rate
                  </span>
                  <div style={{ marginTop: '2px', color: '#dc2626', fontWeight: 600 }}>
                    ₹{requestData.late_fine_per_day} per day
                  </div>
                </div>
              </div>

              {/* ISSUE FLOW (if Approved) */}
              {requestData.status === 'approved' && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 600 }}>
                    <UserCheck size={18} />
                    <span>Identity Verification for Handover</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#1e3a8a' }}>
                    Ask student for their MIT-ADT ID card and enter their enrollment number to confirm physical handover:
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Enter student roll (e.g. ${requestData.enrollment_no})`}
                      value={enrollmentInput}
                      onChange={(e) => setEnrollmentInput(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleIssue}
                      disabled={issuing}
                      style={{ minWidth: '160px' }}
                    >
                      {issuing ? 'Verifying...' : 'Mark as Issued'}
                    </button>
                  </div>
                </div>
              )}

              {/* RETURN FLOW (if Issued) */}
              {requestData.status === 'issued' && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600 }}>
                    <CheckCircle size={18} />
                    <span>Hardware Return Inspection</span>
                  </div>

                  {requestData.days_late > 0 && (
                    <div
                      style={{
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        padding: '10px',
                        borderRadius: '4px',
                        color: '#991b1b',
                        fontSize: '12px',
                      }}
                    >
                      <strong>Overdue Notice:</strong> This item is {requestData.days_late} days late! A late fine of <strong>₹{requestData.days_late * requestData.late_fine_per_day}</strong> will be logged upon confirmation.
                    </div>
                  )}

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Return Hardware Condition</label>
                      <select
                        className="form-select"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                      >
                        <option value="good">Good / Working Condition</option>
                        <option value="excellent">Excellent / Like New</option>
                        <option value="fair">Fair (Normal Wear)</option>
                        <option value="damaged">Damaged / Broken Parts</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Damage / Condition Notes</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={condition === 'damaged' ? 'Describe observed damage...' : 'Optional observations...'}
                        value={damageNotes}
                        onChange={(e) => setDamageNotes(e.target.value)}
                        required={condition === 'damaged'}
                      />
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleReturn}
                    disabled={returning}
                    style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                  >
                    {returning ? 'Processing Return...' : 'Mark as Returned'}
                  </button>
                </div>
              )}

              {/* Already returned/rejected status */}
              {['returned', 'rejected', 'cancelled'].includes(requestData.status) && (
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>
                  This request has already completed its lifecycle (Status: <strong>{requestData.status}</strong>). No handover actions pending.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
