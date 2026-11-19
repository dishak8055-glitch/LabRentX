import React from 'react';
import { Settings, Shield, Info, CheckCircle2, Building, Award } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
          System Configuration & Institutional Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Overview of LabRentX institutional deployment parameters, rental policies, and project credits.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
        {/* Project & Institution Profile */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Institutional Affiliation</h3>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Building size={20} color="#2563eb" style={{ marginTop: '2px' }} />
              <div>
                <strong>Institution:</strong>
                <div>MIT School of Computing</div>
                <div style={{ color: '#64748b' }}>MIT-ADT University, Pune, Maharashtra</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Award size={20} color="#2563eb" style={{ marginTop: '2px' }} />
              <div>
                <strong>Capstone / PBL Project:</strong>
                <div>Team: Group BCAIAA64</div>
                <div>Project Guide: Prof. Dr. Nitin More</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                color: '#1e40af',
                lineHeight: 1.5,
              }}
            >
              <strong>Architecture Highlights:</strong>
              <div>• Zero-Hardware: Handover verified purely via software reservation codes</div>
              <div>• Strict Enforcement: Unpaid fines block new student requests</div>
              <div>• High Availability: Auto stock calculation handles concurrent reservations</div>
            </div>
          </div>
        </div>

        {/* Business Rules Summary */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Active Business Rules & Reservation Policies</h3>
          </div>
          <div className="panel-body">
            <div className="form-grid-2">
              <div
                style={{
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active Request Limit
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  3 Hardware Items
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Max simultaneous items held per student.
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Collection Grace Period
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  24 Hours (1 Day)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Hold duration after start date before reservation expires.
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Reservation Code Format
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', marginTop: '4px' }}>
                  LRX-XXXXX
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Cryptographically distinct 5-digit single-use reservation codes.
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Late Return Fine Calculation
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                  Days Late × Daily Fine Rate
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Calculated automatically on physical return.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
