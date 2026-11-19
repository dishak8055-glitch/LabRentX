import React, { useState, useRef, useEffect } from 'react';
import { Layers, FileText, IndianRupee, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function StudentNavbar({ currentTab, onTabChange }) {
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
    <header className="student-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#1d4ed8',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '15px',
            }}
          >
            LX
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a', letterSpacing: '-0.3px' }}>
                LabRentX
              </span>
              <span className="brand-badge" style={{ backgroundColor: '#2563eb' }}>
                Engineering Labs
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              MIT School of Computing • MIT-ADT
            </div>
          </div>
        </div>

        <nav className="student-nav-links">
          <button
            className={`nav-link-btn ${currentTab === 'catalog' ? 'active' : ''}`}
            onClick={() => onTabChange('catalog')}
          >
            <Layers size={16} />
            Equipment Catalog
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'requests' ? 'active' : ''}`}
            onClick={() => onTabChange('requests')}
          >
            <FileText size={16} />
            My Requests & History
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'fines' ? 'active' : ''}`}
            onClick={() => onTabChange('fines')}
          >
            <IndianRupee size={16} />
            Fines
          </button>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                backgroundColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              {user?.first_name ? user.first_name[0] : 'S'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{user?.full_name || user?.username}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{user?.enrollment_no}</div>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {profileOpen && (
            <div className="dropdown-menu" style={{ width: '240px' }}>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{user?.full_name}</p>
                <p style={{ fontSize: '11px', color: '#64748b' }}>{user?.email}</p>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#2563eb', fontWeight: 500 }}>
                  {user?.class_division}
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
