import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function AdminMaintenancePage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Log Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [equipmentId, setEquipmentId] = useState('');
  const [logType, setLogType] = useState('repair');
  const [notes, setNotes] = useState('');
  const [qtyAffected, setQtyAffected] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/maintenance/');
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load maintenance logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await apiRequest('/equipment/');
      const list = Array.isArray(data) ? data : data.results || [];
      setEquipmentList(list);
      if (list.length > 0 && !equipmentId) {
        setEquipmentId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMaintenance();
    fetchEquipment();
  }, []);

  const handleCreateLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/maintenance/', {
        method: 'POST',
        body: JSON.stringify({
          equipment: equipmentId,
          log_type: logType,
          notes,
          quantity_affected: parseInt(qtyAffected, 10),
        }),
      });
      showToast('Maintenance ticket created and stock adjusted.', 'success');
      setModalOpen(false);
      setNotes('');
      fetchMaintenance();
    } catch (err) {
      showToast(err.message || 'Failed to create log', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this maintenance issue as resolved and return hardware to inventory?')) return;
    try {
      await apiRequest(`/maintenance/${id}/resolve/`, { method: 'POST' });
      showToast('Maintenance resolved and stock restored.', 'success');
      fetchMaintenance();
    } catch (err) {
      showToast(err.message || 'Failed to resolve', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Equipment Maintenance & Damage Ledger
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Track damaged hardware, repairs, and calibration cycles. Items under repair are automatically deducted from available stock.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchMaintenance}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Log Maintenance / Damage
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading maintenance tickets...
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance logs"
          description="All laboratory equipment is functional and available for requisition."
          action={
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Log First Issue
            </button>
          }
        />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Hardware Item</th>
                  <th>Type</th>
                  <th>Qty Affected</th>
                  <th>Status</th>
                  <th>Notes / Failure Symptoms</th>
                  <th>Logged By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.equipment_name}</div>
                      <div style={{ fontSize: '11px', color: '#2563eb' }}>{log.equipment_id_display}</div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 500, fontSize: '12px' }}>
                        {log.log_type}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#dc2626' }}>{log.quantity_affected}</strong> unit(s)
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: log.status === 'resolved' ? '#d1fae5' : '#fee2e2',
                          color: log.status === 'resolved' ? '#065f46' : '#991b1b',
                          textTransform: 'capitalize',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#334155', maxWidth: '300px' }}>
                      {log.notes}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {log.logged_by_name || 'Lab Staff'}
                    </td>
                    <td>
                      {log.status !== 'resolved' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleResolve(log.id)}
                        >
                          Resolve & Release
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 500 }}>
                          Resolved on {new Date(log.resolved_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Maintenance Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Log Hardware Maintenance Ticket</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)} style={{ border: 'none' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLog}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Select Equipment <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                    required
                  >
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.equipment_id} - {eq.name} (Available: {eq.available_qty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Issue Type <span className="required-star">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                    >
                      <option value="damage">Damage Report</option>
                      <option value="repair">Under Repair</option>
                      <option value="service">Scheduled Service</option>
                      <option value="calibration">Laboratory Calibration</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Quantity Out of Service <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={qtyAffected}
                      onChange={(e) => setQtyAffected(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Diagnostic / Repair Notes <span className="required-star">*</span>
                  </label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="Describe symptoms, blown fuse, broken display, or calibration schedule..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                  <span className="form-helper">This quantity will be placed on hold until marked resolved.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Logging Ticket...' : 'Log Ticket & Hold Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
