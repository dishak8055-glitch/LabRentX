import React, { useState, useEffect } from 'react';
import { Search, UserCheck, ShieldAlert, RefreshCw, UserPlus } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/auth/users/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const data = await apiRequest(url);
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const toggleBlockStatus = async (user) => {
    const nextBlocked = !user.is_blocked;
    try {
      await apiRequest(`/auth/users/${user.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_blocked: nextBlocked }),
      });
      showToast(
        `User ${user.enrollment_no || user.username} has been ${nextBlocked ? 'blocked' : 'unblocked'}.`,
        'info'
      );
      fetchUsers();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Registered Students & Staff Directory
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Inspect student enrollment numbers, class divisions, active requisitions, and account access permissions.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
          <RefreshCw size={14} /> Refresh Directory
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by student roll (e.g. ADT23), name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading user database...
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="No accounts match your search parameters." />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll / Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Class / Department</th>
                  <th>Contact Info</th>
                  <th>Active Rentals</th>
                  <th>Fine Status</th>
                  <th>Status & Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>
                        {u.enrollment_no || u.username}
                      </strong>
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.full_name || `${u.first_name} ${u.last_name}`}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: u.role === 'admin' ? '#1e293b' : '#eff6ff',
                          color: u.role === 'admin' ? '#ffffff' : '#1d4ed8',
                          textTransform: 'capitalize',
                        }}
                      >
                        {u.role === 'admin' ? 'Lab Assistant' : 'Student'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>
                      {u.class_division || 'Department Staff'}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      <div>{u.email}</div>
                      <div style={{ color: '#64748b' }}>{u.phone || '—'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{u.active_request_count || 0}</span> / 3
                    </td>
                    <td>
                      {u.has_unpaid_fines ? (
                        <span className="badge badge-overdue">Unpaid Fine</span>
                      ) : (
                        <span className="badge badge-returned">Clear</span>
                      )}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${u.is_blocked ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => toggleBlockStatus(u)}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          {u.is_blocked ? 'Unblock' : 'Block Access'}
                        </button>
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
