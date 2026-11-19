import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(username.trim(), password);
      showToast(`Welcome back, ${user.full_name || user.username}!`, 'success');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          padding: '36px 32px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: '#1d4ed8',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            LX
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>
            LabRentX Portal
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Hardware Requisition & Laboratory Inventory System
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>
            MIT School of Computing • MIT-ADT University
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              Enrollment No. / Admin Username <span className="required-star">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ADT23SOCB0050 or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Password <span className="required-star">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '8px', fontWeight: 600 }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
            Development-only demo accounts:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '12px', padding: '6px 12px' }}
            >
              <span>
                <strong>Admin:</strong> Lab Assistant
              </span>
              <span style={{ color: '#2563eb' }}>Development account</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('ADT23SOCB0050', 'student123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '12px', padding: '6px 12px' }}
            >
              <span>
                <strong>Student 1:</strong> Student account
              </span>
              <span style={{ color: '#2563eb' }}>Development account</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('ADT23SOCB0014', 'student123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '12px', padding: '6px 12px' }}
            >
              <span>
                <strong>Student 2:</strong> Student account
              </span>
              <span style={{ color: '#2563eb' }}>Development account</span>
            </button>
            </div>
          </div>
          )}
          </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
        LabRentX • Smart Hardware Rental & Inventory Management System
      </div>
    </div>
  );
}
