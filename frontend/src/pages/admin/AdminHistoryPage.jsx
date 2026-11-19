import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, FileText } from 'lucide-react';
import { apiRequest, downloadApiFile } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';

export default function AdminHistoryPage() {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setLoadError('');
    try {
      let url = '/requests/all/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const data = await apiRequest(url);
      setHistory(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
      setLoadError(err.message || 'The rental history could not be loaded.');
      showToast(err.message || 'Failed to load rental history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  const handleExportCSV = async (endpoint, filename) => {
    try {
      await downloadApiFile(endpoint, filename);
    } catch (err) {
      showToast(err.message || 'CSV export failed', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Complete Rental & Transaction Ledger
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Historical audit log of all hardware reservations, issuances, return conditions, and fines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleExportCSV('/reports/export/rentals/', 'rental_history.csv')}>
            <Download size={14} /> Export Rentals
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('/reports/export/audit/', 'audit_ledger.csv')}>
            <FileText size={14} /> Export Audit
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by student, roll number, code, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading transaction ledger...
        </div>
      ) : loadError ? (
        <EmptyState
          title="Unable to load history"
          description={loadError}
          action={<button className="btn btn-secondary" onClick={fetchHistory}>Try again</button>}
        />
      ) : history.length === 0 ? (
        <EmptyState title="No transactions recorded" description="No rental records found matching your filter." />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Log #</th>
                  <th>Reservation Code</th>
                  <th>Student Info</th>
                  <th>Equipment Item</th>
                  <th>Dates (Issued / Returned)</th>
                  <th>Status</th>
                  <th>Return Condition</th>
                  <th>Overdue / Fine</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      {r.reservation_code ? (
                        <span className="res-code-tag">{r.reservation_code}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.student_enrollment}</div>
                    </td>
                    <td>
                      <div>{r.equipment_name}</div>
                      <div style={{ fontSize: '11px', color: '#2563eb' }}>{r.equipment_id_display}</div>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      <div>Start: {r.start_date}</div>
                      <div>Due: {r.due_date || r.return_date}</div>
                      {r.actual_return_date && (
                        <div style={{ color: '#166534' }}>
                          Ret: {new Date(r.actual_return_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={r.status} isOverdue={r.is_overdue} />
                    </td>
                    <td style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                      {r.return_condition || '—'}
                      {r.damage_notes && (
                        <div style={{ color: '#dc2626', fontSize: '11px' }}>
                          Note: {r.damage_notes}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.days_late > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>
                          {r.days_late}d late (₹{r.days_late * r.late_fine_per_day})
                        </span>
                      ) : (
                        <span style={{ color: '#166534', fontSize: '12px' }}>On Time</span>
                      )}
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
