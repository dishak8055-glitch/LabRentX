import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function AdminTopBar({ title, primaryAction }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="top-bar">
      <div className="page-title-wrap">
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="top-bar-actions">
        {primaryAction && <div>{primaryAction}</div>}

        <NotificationDropdown />

        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {user?.first_name ? user.first_name[0] : 'A'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{user?.full_name || 'Admin'}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Lab Assistant</div>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {profileOpen && (
            <div className="dropdown-menu" style={{ width: '220px' }}>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{user?.full_name}</p>
                <p style={{ fontSize: '11px', color: '#64748b' }}>{user?.email}</p>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#2563eb', fontWeight: 500 }}>
                  <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Lab Administrator
                </div>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                style={{ color: '#dc2626' }}
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
