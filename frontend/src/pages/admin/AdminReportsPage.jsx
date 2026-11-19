import React, { useState, useEffect } from 'react';
import { BarChart3, Download, AlertTriangle, Package, RefreshCw, FileText } from 'lucide-react';
import { apiRequest, downloadApiFile } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reportTab, setReportTab] = useState('usage'); // 'usage', 'overdue', 'inventory'
  const [usageData, setUsageData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [u, o, i] = await Promise.all([
        apiRequest('/reports/usage/'),
        apiRequest('/reports/overdue/'),
        apiRequest('/reports/inventory/'),
      ]);
      setUsageData(Array.isArray(u) ? u : []);
      setOverdueData(Array.isArray(o) ? o : []);
      setInventoryData(Array.isArray(i) ? i : []);
    } catch (e) {
      console.error(e);
      setLoadError(e.message || 'The analytics reports could not be loaded.');
      showToast(e.message || 'Failed to load analytics reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      await downloadApiFile('/reports/export/rentals/', 'rental_history.csv');
    } catch (error) {
      showToast(error.message || 'Failed to export rental history', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Laboratory Analytics & Inventory Reports
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Real-time analytics on hardware utilization frequency, overdue compliance, and lab inventory health.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchReports}>
            <RefreshCw size={14} /> Refresh Reports
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${reportTab === 'usage' ? 'active' : ''}`}
          onClick={() => setReportTab('usage')}
        >
          Equipment Usage Statistics ({usageData.length})
        </button>
        <button
          className={`tab-btn ${reportTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setReportTab('overdue')}
        >
          Overdue Incident Report ({overdueData.length})
        </button>
        <button
          className={`tab-btn ${reportTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setReportTab('inventory')}
        >
          Complete Inventory Valuation ({inventoryData.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Generating analytical reports...
        </div>
      ) : loadError ? (
        <EmptyState
          title="Unable to load reports"
          description={loadError}
          action={<button className="btn btn-secondary" onClick={fetchReports}>Try again</button>}
        />
      ) : reportTab === 'usage' ? (
        /* Usage Report */
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Equipment Demand & Turnaround Frequency</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Hardware Item</th>
                  <th>Category</th>
                  <th>Total Units</th>
                  <th>Lifetime Requests</th>
                  <th>Currently In Use</th>
                  <th>Completed Returns</th>
                  <th>Avg. Turnaround (days)</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="card-code">{item.equipment_id}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ fontSize: '12px' }}>{item.category__name}</td>
                    <td>{item.total_qty}</td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{item.total_requests}</strong>
                    </td>
                    <td>{item.active_rentals}</td>
                    <td>{item.completed_rentals}</td>
                    <td>{item.average_turnaround_days ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : reportTab === 'overdue' ? (
        /* Overdue Report */
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Overdue Return Incidents Requiring Follow-Up</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Student Name</th>
                  <th>Enrollment Number</th>
                  <th>Hardware Item</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Accrued Fine</th>
                </tr>
              </thead>
              <tbody>
                {overdueData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#166534' }}>
                      No items are currently overdue! All students returned equipment on time.
                    </td>
                  </tr>
                ) : (
                  overdueData.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="res-code-tag">{r.reservation_code}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                      <td>
                        <strong>{r.student_enrollment}</strong>
                      </td>
                      <td>{r.equipment_name}</td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>{r.due_date}</td>
                      <td>
                        <span className="badge badge-overdue">{r.days_late} Days Late</span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>
                        ₹{(r.days_late * Number(r.late_fine_per_day)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Inventory Report */
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Lab Hardware Inventory & Condition Summary</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hardware Item</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Issued</th>
                  <th>In Repair</th>
                  <th>Unit Value</th>
                  <th>Inventory Value</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((eq) => (
                  <tr key={eq.id}>
                    <td>
                      <span className="card-code">{eq.equipment_id}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{eq.name}</td>
                    <td style={{ fontSize: '12px' }}>{eq.category}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{eq.lab_location}</td>
                    <td>{eq.total_qty}</td>
                    <td>
                      <strong style={{ color: eq.available_qty === 0 ? '#dc2626' : '#166534' }}>
                        {eq.available_qty}
                      </strong>
                    </td>
                    <td>{eq.issued_qty}</td>
                    <td style={{ color: eq.under_maintenance > 0 ? '#dc2626' : '#64748b' }}>
                      {eq.under_maintenance}
                    </td>
                    <td>₹{eq.unit_value}</td>
                    <td>₹{eq.inventory_value}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                      {eq.condition?.replace('_', ' ')}
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
