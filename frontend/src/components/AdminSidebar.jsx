import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Package,
  History,
  IndianRupee,
  Wrench,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminSidebar({ currentTab, onTabChange, collapsed, onToggleCollapse }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Requests', icon: ClipboardList },
    { id: 'issue-return', label: 'Issue & Return', icon: CheckSquare },
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'history', label: 'Rental History', icon: History },
    { id: 'fines', label: 'Fines', icon: IndianRupee },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed ? (
          <div className="brand-title">
            <div
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: '#2563eb',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: '13px',
              }}
            >
              LX
            </div>
            <span>LabRentX</span>
            <span className="brand-badge">Admin</span>
          </div>
        ) : (
          <div
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#2563eb',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '13px',
              margin: '0 auto',
            }}
          >
            LX
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="btn-icon"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div>MIT-WPU / MIT-ADT University</div>
          <div style={{ color: '#475569', marginTop: '2px' }}>Lab Management v2.4</div>
        </div>
      )}
    </aside>
  );
}
