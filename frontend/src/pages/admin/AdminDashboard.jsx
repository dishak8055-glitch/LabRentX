import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  PackageX,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function AdminDashboard({ onNavigate, onOpenHandover }) {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest('/dashboard/summary/');
      setSummary(data);
    } catch (err) {
      console.error(err);
      setLoadError(err.message || 'The dashboard summary could not be loaded.');
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading laboratory operations dashboard...
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={loadError}
        action={<button className="btn btn-secondary" onClick={fetchSummary}>Try again</button>}
      />
    );
  }

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div
          className="metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('requests')}
        >
          <div className="metric-info">
            <span className="metric-label">Pending Requisitions</span>
            <span className="metric-value" style={{ color: summary?.pending_requests > 0 ? '#d97706' : '#0f172a' }}>
              {summary?.pending_requests || 0}
            </span>
          </div>
          <div className="metric-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <ClipboardList size={22} />
          </div>
        </div>

        <div
          className="metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('issue-return')}
        >
          <div className="metric-info">
            <span className="metric-label">Currently Issued</span>
            <span className="metric-value">{summary?.issued_items || 0}</span>
          </div>
          <div className="metric-icon-wrap" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
            <CheckSquare size={22} />
          </div>
        </div>

        <div
          className={`metric-card ${summary?.overdue_items > 0 ? 'alert' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('reports')}
        >
          <div className="metric-info">
            <span className="metric-label">Overdue Items</span>
            <span className="metric-value">{summary?.overdue_items || 0}</span>
          </div>
          <div className="metric-icon-wrap">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div
          className={`metric-card ${summary?.low_stock_items?.length > 0 ? 'alert' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('equipment')}
        >
          <div className="metric-info">
            <span className="metric-label">Low Stock Alerts</span>
            <span className="metric-value">{summary?.low_stock_items?.length || 0}</span>
          </div>
          <div className="metric-icon-wrap">
            <PackageX size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Requests & Urgent Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
        {/* Left: Recent Requisitions */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Recent Equipment Requests</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('requests')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student & Roll</th>
                  <th>Equipment</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recent_requests?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No recent requests
                    </td>
                  </tr>
                ) : (
                  summary?.recent_requests?.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{req.student_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{req.student_enrollment}</div>
                      </td>
                      <td>
                        <div>{req.equipment_name}</div>
                        <div style={{ fontSize: '11px', color: '#2563eb' }}>{req.equipment_id_display}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {req.num_days}d ({req.start_date})
                      </td>
                      <td>
                        <StatusBadge status={req.status} isOverdue={req.is_overdue} />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onNavigate('requests')}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock & Quick Counter Handover */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Counter Action Card */}
          <div
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <span className="brand-badge" style={{ backgroundColor: '#2563eb' }}>
                Lab Counter Handover
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '8px' }}>
                Counter Verification Terminal
              </h3>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                A student is at the counter? Verify their reservation code (e.g. LRX-48213) and check their enrollment card.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={onOpenHandover}
              style={{ backgroundColor: '#2563eb', border: 'none' }}
            >
              Open Handover Counter
            </button>
          </div>

          {/* Low Stock Items Panel */}
          <div className="panel" style={{ margin: 0 }}>
            <div className="panel-header">
              <h3 className="panel-title">Low Stock Equipment</h3>
              <span className="badge badge-overdue">{summary?.low_stock_items?.length || 0} Critical</span>
            </div>

            <div className="panel-body" style={{ padding: '12px' }}>
              {summary?.low_stock_items?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '13px' }}>
                  All items adequately stocked.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {summary?.low_stock_items?.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fff5f5',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {item.equipment_id}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                          {item.available_qty} / {item.total_qty} Left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
