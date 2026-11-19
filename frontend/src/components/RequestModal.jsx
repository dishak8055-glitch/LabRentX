import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { useToast } from '../context/ToastContext';

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RequestModal({ equipment, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [numDays, setNumDays] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [phone, setPhone] = useState('');
  const [classDivision, setClassDivision] = useState('');
  const [reason, setReason] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default to today
  useEffect(() => {
    if (isOpen && equipment) {
      setStartDate(getLocalDate());
      setNumDays(Math.min(3, equipment.max_rental_days || 3));
      setPhone(user?.phone || '');
      setClassDivision(user?.class_division || '');
      setReason('');
      setDeclarationAccepted(false);
      setError('');
    }
  }, [isOpen, equipment, user]);

  // Auto-calculate return date
  useEffect(() => {
    if (startDate && numDays) {
      const [year, month, day] = startDate.split('-').map(Number);
      const calculated = new Date(Date.UTC(year, month - 1, day));
      calculated.setUTCDate(calculated.getUTCDate() + parseInt(numDays, 10));
      setReturnDate(calculated.toISOString().split('T')[0]);
    }
  }, [startDate, numDays]);

  if (!isOpen || !equipment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numDays > equipment.max_rental_days) {
      setError(`Cannot exceed maximum rental period of ${equipment.max_rental_days} days for this item.`);
      return;
    }

    if (!declarationAccepted) {
      setError('You must accept the late fine declaration before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/requests/', {
        method: 'POST',
        body: JSON.stringify({
          equipment: equipment.id,
          num_days: parseInt(numDays, 10),
          start_date: startDate,
          return_date: returnDate,
          reason,
          full_name: user?.full_name || `${user?.first_name} ${user?.last_name}`,
          enrollment_no: user?.enrollment_no,
          email: user?.email,
          phone,
          class_division: classDivision,
          declaration_accepted: declarationAccepted,
        }),
      });

      showToast('Rental request submitted successfully! Awaiting lab admin approval.', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = getLocalDate();

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '820px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Equipment Requisition Form</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Standard lab hardware rental request for academic and capstone evaluation
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

            {/* Equipment Info summary banner */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="card-code">{equipment.equipment_id}</span>
                <span style={{ fontWeight: 600, fontSize: '14px', marginLeft: '8px', color: '#0f172a' }}>
                  {equipment.name}
                </span>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Location: {equipment.lab_location}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                  ₹{equipment.late_fine_per_day} / day fine
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Max: {equipment.max_rental_days} days limit
                </div>
              </div>
            </div>

            {/* 3-Column Grid for Dates & Duration */}
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">
                  Equipment <span className="tooltip-icon" title="Fixed equipment name"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={equipment.name}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Number of Days <span className="required-star">*</span>
                  <span className="tooltip-icon" title={`Cannot exceed ${equipment.max_rental_days} days`}><HelpCircle size={12} /></span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={equipment.max_rental_days}
                  className="form-input"
                  value={numDays}
                  onChange={(e) => setNumDays(e.target.value)}
                  required
                />
                <span className="form-helper">Max allowed: {equipment.max_rental_days} days</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Start Date <span className="required-star">*</span>
                  <span className="tooltip-icon" title="Date of collection"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Return Date (Auto) <span className="tooltip-icon" title="Auto-calculated"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={returnDate}
                  readOnly
                  disabled
                />
                <span className="form-helper">Calculated from start date + days</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Student Name <span className="tooltip-icon" title="From student profile"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.full_name || ''}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Enrollment Number <span className="tooltip-icon" title="University roll number"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.enrollment_no || ''}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Official Email <span className="tooltip-icon" title="College email"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Contact Phone <span className="required-star">*</span>
                </label>
                <input
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  placeholder="10-digit mobile"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Class / Division <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TY B.Tech CSE - Div B"
                  className="form-input"
                  value={classDivision}
                  onChange={(e) => setClassDivision(e.target.value)}
                  required
                />
              </div>

              <div className="form-group col-span-3">
                <label className="form-label">
                  Detailed Purpose / Justification <span className="required-star">*</span>
                  <span className="tooltip-icon" title="Lab assistant reviews project context"><HelpCircle size={12} /></span>
                </label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  placeholder="State the academic project, lab experiment, or capstone module requiring this hardware..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
                <span className="form-helper">Provide sufficient context to facilitate rapid approval.</span>
              </div>

              <div className="form-group col-span-3">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    required
                  />
                  <span style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
                    <strong>Student Declaration:</strong> I undertake full responsibility for the safety and intact return of this equipment. I agree to pay the late fine of <strong>₹{equipment.late_fine_per_day} per day</strong> if returned past the due date ({returnDate}), and compensate for any physical damage as determined by the lab assistant.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting Request...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
