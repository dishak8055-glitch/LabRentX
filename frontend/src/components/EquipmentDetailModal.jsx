import React from 'react';
import { X, Cpu, MapPin, AlertCircle, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiAssetUrl } from '../api/client';

export default function EquipmentDetailModal({ equipment, isOpen, onClose, onRequest }) {
  const { isStudent } = useAuth();

  if (!isOpen || !equipment) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="card-code">{equipment.equipment_id}</span>
            <h2 className="modal-title">{equipment.name}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top highlight bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Availability
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: equipment.available_qty > 0 ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                {equipment.available_qty} of {equipment.total_qty} Units
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Late Fine
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', marginTop: '2px' }}>
                ₹{equipment.late_fine_per_day} / day
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Max Rental Period
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {equipment.max_rental_days} Days
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Hardware Condition
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize', marginTop: '2px' }}>
                {equipment.condition?.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Category</strong>
              <div>{equipment.category_name || equipment.category?.name || 'General Hardware'}</div>
            </div>

            <div>
              <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Make / Model Number</strong>
              <div>{equipment.brand ? `${equipment.brand} - ` : ''}{equipment.model_number || 'Standard OEM'}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Laboratory & Counter Location</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#2563eb" />
                <span>{equipment.lab_location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Overview</h4>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>{equipment.description}</p>
          </div>

          {/* Specifications */}
          {equipment.specifications && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Technical Specifications</h4>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  whiteSpace: 'pre-line',
                  color: '#1e293b',
                  lineHeight: 1.6,
                }}
              >
                {equipment.specifications}
              </div>
            </div>
          )}

          {equipment.datasheet && (
            <div>
              <a
                href={getApiAssetUrl(equipment.datasheet)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}
              >
                <FileText size={14} />
                Download Datasheet / User Manual (PDF)
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {isStudent && (
            <button
              className="btn btn-primary"
              disabled={equipment.available_qty <= 0}
              onClick={() => {
                onClose();
                onRequest?.(equipment);
              }}
            >
              {equipment.available_qty > 0 ? 'Request this Equipment' : 'Currently Out of Stock'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
