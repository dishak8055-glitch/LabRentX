import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Cpu, Check, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AddEquipmentModal from '../../components/AddEquipmentModal';
import EquipmentDetailModal from '../../components/EquipmentDetailModal';
import EmptyState from '../../components/EmptyState';

export default function AdminEquipmentPage({ onOpenAddModal, addModalOpen, setAddModalOpen }) {
  const { showToast } = useToast();
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let url = '/equipment/?';
      if (selectedCat) url += `category=${selectedCat}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const data = await apiRequest(url);
      setEquipmentList(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load equipment catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/equipment/categories/');
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [selectedCat, search]);

  const toggleRentAvailability = async (item) => {
    try {
      const updated = !item.is_available;
      await apiRequest(`/equipment/${item.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: updated }),
      });
      showToast(`${item.name} is now ${updated ? 'available' : 'hidden'} from student catalog`, 'info');
      fetchEquipment();
    } catch (err) {
      showToast('Failed to update rent status', 'error');
    }
  };

  return (
    <div>
      {/* Search and Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, name, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button className="btn btn-secondary btn-sm" onClick={fetchEquipment}>
            <RefreshCw size={14} /> Refresh
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Add Equipment
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading equipment inventory...
        </div>
      ) : equipmentList.length === 0 ? (
        <EmptyState
          title="No equipment items found"
          description="Click '+ Add Equipment' to register items into the database."
          action={
            <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
              <Plus size={16} /> Add First Equipment
            </button>
          }
        />
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Hardware Name & Make</th>
                  <th>Category</th>
                  <th>Lab Location</th>
                  <th>Stock (Avail / Total)</th>
                  <th>Fine / Day</th>
                  <th>Condition</th>
                  <th>For Rent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="card-code" style={{ fontSize: '12px' }}>
                        {item.equipment_id}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                        onClick={() => setDetailItem(item)}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.brand} {item.model_number}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{item.category_name}</td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>{item.lab_location}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: item.available_qty === 0 ? '#dc2626' : item.is_low_stock ? '#d97706' : '#166534',
                        }}
                      >
                        {item.available_qty}
                      </span>{' '}
                      / {item.total_qty}
                      {item.is_low_stock && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          Low
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{item.late_fine_per_day}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                      {item.condition?.replace('_', ' ')}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleRentAvailability(item)}
                        style={{
                          border: 'none',
                          background: item.is_available ? '#dcfce7' : '#fee2e2',
                          color: item.is_available ? '#166534' : '#991b1b',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {item.is_available ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingItem(item)}
                          title="Edit details"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEquipmentModal
        isOpen={addModalOpen || !!editingItem}
        initialEquipment={editingItem}
        onClose={() => {
          setAddModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          fetchEquipment();
        }}
      />

      {/* Detail Modal */}
      <EquipmentDetailModal
        equipment={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}
