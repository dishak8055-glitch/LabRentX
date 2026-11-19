import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Components & Layouts
import StudentNavbar from './components/StudentNavbar';
import AdminSidebar from './components/AdminSidebar';
import AdminTopBar from './components/AdminTopBar';
import IssueReturnModal from './components/IssueReturnModal';
import AddEquipmentModal from './components/AddEquipmentModal';

// Pages
import LoginPage from './pages/LoginPage';
// Student Pages
import CatalogPage from './pages/student/CatalogPage';
import MyRequestsPage from './pages/student/MyRequestsPage';
import FinesPage from './pages/student/FinesPage';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminIssueReturnPage from './pages/admin/AdminIssueReturnPage';
import AdminEquipmentPage from './pages/admin/AdminEquipmentPage';
import AdminHistoryPage from './pages/admin/AdminHistoryPage';
import AdminFinesPage from './pages/admin/AdminFinesPage';
import AdminMaintenancePage from './pages/admin/AdminMaintenancePage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function MainApp() {
  const { user, loading, isAdmin, isStudent } = useAuth();

  // Navigation states
  const [studentTab, setStudentTab] = useState('catalog');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Global modals
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverInitialCode, setHandoverInitialCode] = useState('');
  const [addEquipmentModalOpen, setAddEquipmentModalOpen] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          color: '#64748b',
          fontSize: '14px',
        }}
      >
        Initializing LabRentX session...
      </div>
    );
  }

  // Not logged in -> Show Single Login page
  if (!user) {
    return <LoginPage />;
  }

  // STUDENT VIEW (Lighter layout with top nav)
  if (isStudent) {
    return (
      <div className="student-layout">
        <StudentNavbar currentTab={studentTab} onTabChange={setStudentTab} />
        <main className="page-content">
          {studentTab === 'catalog' && <CatalogPage />}
          {studentTab === 'requests' && <MyRequestsPage />}
          {studentTab === 'fines' && <FinesPage />}
        </main>
      </div>
    );
  }

  // ADMIN VIEW (Collapsible left sidebar + top bar with page title and primary action)
  const getAdminTitleAndAction = () => {
    switch (adminTab) {
      case 'dashboard':
        return {
          title: 'Laboratory Operations Dashboard',
          action: (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setHandoverInitialCode('');
                setHandoverModalOpen(true);
              }}
            >
              Counter Handover
            </button>
          ),
        };
      case 'requests':
        return {
          title: 'Equipment Requisition Review',
          action: null,
        };
      case 'issue-return':
        return {
          title: 'Lab Counter Station (Issue & Return)',
          action: (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setHandoverInitialCode('');
                setHandoverModalOpen(true);
              }}
            >
              Lookup Reservation Code
            </button>
          ),
        };
      case 'equipment':
        return {
          title: 'Hardware Inventory & Equipment Management',
          action: (
            <button className="btn btn-primary btn-sm" onClick={() => setAddEquipmentModalOpen(true)}>
              + Add Equipment
            </button>
          ),
        };
      case 'history':
        return {
          title: 'Rental Transaction Ledger & History',
          action: null,
        };
      case 'fines':
        return {
          title: 'Student Fines & Waivers Administration',
          action: null,
        };
      case 'maintenance':
        return {
          title: 'Equipment Maintenance & Diagnostic Ledger',
          action: null,
        };
      case 'reports':
        return {
          title: 'Institutional Analytics & Inventory Reports',
          action: null,
        };
      case 'users':
        return {
          title: 'Student & Staff User Directory',
          action: null,
        };
      case 'settings':
        return {
          title: 'Institutional Policies & System Settings',
          action: null,
        };
      default:
        return { title: 'LabRentX Admin', action: null };
    }
  };

  const { title: adminPageTitle, action: adminPageAction } = getAdminTitleAndAction();

  const handleOpenHandoverWithCode = (code) => {
    setHandoverInitialCode(code);
    setHandoverModalOpen(true);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        currentTab={adminTab}
        onTabChange={setAdminTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="main-wrapper">
        <AdminTopBar title={adminPageTitle} primaryAction={adminPageAction} />

        <main className="admin-content">
          {adminTab === 'dashboard' && (
            <AdminDashboard
              onNavigate={setAdminTab}
              onOpenHandover={() => {
                setHandoverInitialCode('');
                setHandoverModalOpen(true);
              }}
            />
          )}
          {adminTab === 'requests' && (
            <AdminRequestsPage onOpenHandoverWithCode={handleOpenHandoverWithCode} />
          )}
          {adminTab === 'issue-return' && (
            <AdminIssueReturnPage initialCode={handoverInitialCode} />
          )}
          {adminTab === 'equipment' && (
            <AdminEquipmentPage
              addModalOpen={addEquipmentModalOpen}
              setAddModalOpen={setAddEquipmentModalOpen}
            />
          )}
          {adminTab === 'history' && <AdminHistoryPage />}
          {adminTab === 'fines' && <AdminFinesPage />}
          {adminTab === 'maintenance' && <AdminMaintenancePage />}
          {adminTab === 'reports' && <AdminReportsPage />}
          {adminTab === 'users' && <AdminUsersPage />}
          {adminTab === 'settings' && <AdminSettingsPage />}
        </main>
      </div>

      {/* Global Handover Counter Modal */}
      <IssueReturnModal
        isOpen={handoverModalOpen}
        initialReservationCode={handoverInitialCode}
        onClose={() => setHandoverModalOpen(false)}
        onSuccess={() => {
          // Refresh views
        }}
      />

      {/* Global Add Equipment Modal */}
      <AddEquipmentModal
        isOpen={addEquipmentModalOpen}
        onClose={() => setAddEquipmentModalOpen(false)}
        onSuccess={() => {
          // Refreshed in equipment page
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
