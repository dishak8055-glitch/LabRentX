import React, { useState, useEffect } from 'react';
import { X, HelpCircle, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function AddEquipmentModal({ isOpen, onClose, onSuccess, initialEquipment }) {
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [labLocation, setLabLocation] = useState('Lab 204 (IoT & Embedded Systems Lab)');
  const [totalQty, setTotalQty] = useState(5);
  const [unitValue, setUnitValue] = useState(0);
  const [condition, setCondition] = useState('good');
  const [maxRentalDays, setMaxRentalDays] = useState(7);
  const [lateFinePerDay, setLateFinePerDay] = useState(50);
  const [lowStockThreshold, setLowStockThreshold] = useState(2);
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [datasheetFile, setDatasheetFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await apiRequest('/equipment/categories/');
        const list = Array.isArray(res) ? res : res.results || [];
        setCategories(list);
        if (list.length > 0 && !categoryId) {
          setCategoryId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) {
      loadCats();
    }
  }, [isOpen]);

  // Set initial data if editing
  useEffect(() => {
    if (initialEquipment) {
      setName(initialEquipment.name || '');
      setCategoryId(initialEquipment.category?.id || initialEquipment.category || '');
      setBrand(initialEquipment.brand || '');
      setModelNumber(initialEquipment.model_number || '');
      setLabLocation(initialEquipment.lab_location || 'Lab 204 (IoT & Embedded Systems Lab)');
      setTotalQty(initialEquipment.total_qty || 1);
      setUnitValue(initialEquipment.unit_value || 0);
      setCondition(initialEquipment.condition || 'good');
      setMaxRentalDays(initialEquipment.max_rental_days || 7);
      setLateFinePerDay(initialEquipment.late_fine_per_day || 50);
      setLowStockThreshold(initialEquipment.low_stock_threshold || 2);
      setDescription(initialEquipment.description || '');
      setSpecifications(initialEquipment.specifications || '');
      setIsAvailable(initialEquipment.is_available ?? true);
    } else {
      setName('');
      setBrand('');
      setModelNumber('');
      setLabLocation('Lab 204 (IoT & Embedded Systems Lab)');
      setTotalQty(5);
      setUnitValue(0);
      setCondition('good');
      setMaxRentalDays(7);
      setLateFinePerDay(50);
      setLowStockThreshold(2);
      setDescription('');
      setSpecifications('');
      setIsAvailable(true);
      setImageFile(null);
      setDatasheetFile(null);
    }
    setError('');
  }, [initialEquipment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', categoryId);
      formData.append('brand', brand);
      formData.append('model_number', modelNumber);
      formData.append('lab_location', labLocation);
      formData.append('total_qty', totalQty);
      formData.append('unit_value', unitValue);
      formData.append('condition', condition);
      formData.append('max_rental_days', maxRentalDays);
      formData.append('late_fine_per_day', lateFinePerDay);
      formData.append('low_stock_threshold', lowStockThreshold);
      formData.append('description', description);
      formData.append('specifications', specifications);
      formData.append('is_available', isAvailable ? 'true' : 'false');

      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (datasheetFile) {
        formData.append('datasheet', datasheetFile);
      }

      if (initialEquipment?.id) {
        await apiRequest(`/equipment/${initialEquipment.id}/`, {
          method: 'PATCH',
          body: formData,
        });
        showToast('Equipment updated successfully', 'success');
      } else {
        await apiRequest('/equipment/', {
          method: 'POST',
          body: formData,
        });
        showToast('Equipment added to laboratory inventory', 'success');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
      showToast(err.message || 'Failed to save equipment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const labLocations = [
    'Lab 204 (IoT & Embedded Systems Lab)',
    'Lab 102 (Analog & Digital Circuits Lab)',
    'Lab 105 (Electrical Machines Lab)',
    'Lab 301 (Edge AI & High Performance Computing Lab)',
    'Lab 205 (PCB Fabrication & Soldering Workshop)',
    'Lab 308 (Robotics & Mechatronics Lab)',
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {initialEquipment ? `Edit Equipment: ${initialEquipment.equipment_id}` : 'Add New Lab Equipment'}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Register hardware items, specify inventory parameters, and configure fine policy
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* 3-Column Form Grid */}
            <div className="form-grid-3">
              <div className="form-group col-span-2">
                <label className="form-label">
                  Equipment Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rigol, Arduino, Fluke"
                  className="form-input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Model / Part Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DS1054Z or A000066"
                  className="form-input"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Laboratory / Location <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={labLocation}
                  onChange={(e) => setLabLocation(e.target.value)}
                  required
                >
                  {labLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Total Inventory Quantity <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={totalQty}
                  onChange={(e) => setTotalQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Inventory Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Hardware Condition <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="new">New / Factory Calibrated</option>
                  <option value="good">Good Condition</option>
                  <option value="fair">Fair (Normal Wear)</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Max Rental Days <span className="required-star">*</span>
                  <span className="tooltip-icon" title="Upper limit for student checkout"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={maxRentalDays}
                  onChange={(e) => setMaxRentalDays(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Late Fine Per Day (₹ INR) <span className="required-star">*</span>
                  <span className="tooltip-icon" title="Daily surcharge applied upon overdue return"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  className="form-input"
                  value={lateFinePerDay}
                  onChange={(e) => setLateFinePerDay(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Low-Stock Alert Threshold <span className="required-star">*</span>
                  <span className="tooltip-icon" title="Dashboard flags item when available stock hits this number"><HelpCircle size={12} /></span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Hardware Photo (Upload)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </div>

              <div className="form-group col-span-3">
                <label className="form-label">
                  Catalog Description <span className="required-star">*</span>
                </label>
                <textarea
                  rows="2"
                  className="form-textarea"
                  placeholder="Concise summary shown on the student catalog card..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group col-span-3">
                <label className="form-label">
                  Technical Specifications
                  <span className="tooltip-icon" title="Detailed pinouts, sampling rates, electrical ratings"><HelpCircle size={12} /></span>
                </label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  placeholder="e.g. Sampling Rate: 1 GSa/s, Bandwidth: 50 MHz, Input Voltage: 5V DC..."
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">
                  User Manual / Datasheet (PDF Upload)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-input"
                  onChange={(e) => setDatasheetFile(e.target.files[0])}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Available for Rent</label>
                <label className="checkbox-group" style={{ marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <span style={{ fontSize: '13px', color: '#334155' }}>
                    Active in student catalog
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : initialEquipment ? 'Update Hardware' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
