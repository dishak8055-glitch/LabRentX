import React, { useState, useEffect } from 'react';
import { Search, Filter, Cpu, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiRequest, getApiAssetUrl } from '../../api/client';
import RequestModal from '../../components/RequestModal';
import EquipmentDetailModal from '../../components/EquipmentDetailModal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';

export default function CatalogPage() {
  const { showToast } = useToast();
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modals
  const [detailItem, setDetailItem] = useState(null);
  const [requestItem, setRequestItem] = useState(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setLoadError('');
    try {
      let url = '/equipment/?';
      if (selectedCategory) url += `category=${selectedCategory}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const data = await apiRequest(url);
      setEquipmentList(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      setEquipmentList([]);
      setLoadError(err.message || 'The equipment catalogue could not be loaded.');
      showToast(err.message || 'Failed to load equipment catalogue', 'error');
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
      showToast(e.message || 'Failed to load equipment categories', 'error');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, searchQuery]);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
          Laboratory Hardware Catalog
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Browse available embedded kits, test instruments, and prototyping modules for your academic projects.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, ID (e.g. ARD), or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            className={`btn btn-sm ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory('')}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`btn btn-sm ${selectedCategory === String(c.id) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Card Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading hardware inventory...
        </div>
      ) : loadError ? (
        <EmptyState
          title="Unable to load equipment"
          description={loadError}
          action={<button className="btn btn-secondary" onClick={fetchCatalog}>Try again</button>}
        />
      ) : equipmentList.length === 0 ? (
        <EmptyState
          title="No equipment found"
          description="Try clearing your search query or choosing a different category."
          action={
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="catalog-grid">
          {equipmentList.map((item) => {
            const isAvailable = item.available_qty > 0;
            return (
              <div key={item.id} className="equipment-card">
                <div className="card-img-wrap" onClick={() => setDetailItem(item)} style={{ cursor: 'pointer' }}>
                  {item.image ? (
                    <img src={getApiAssetUrl(item.image)} alt={item.name} className="card-img" />
                  ) : (
                    <Cpu size={48} className="card-placeholder-icon" />
                  )}
                  <span className="card-category-badge">{item.category_name}</span>
                </div>

                <div className="card-body">
                  <div className="card-header-meta">
                    <span className="card-code">{item.equipment_id}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{item.lab_location?.split('(')[0]}</span>
                  </div>

                  <h3
                    className="card-title"
                    onClick={() => setDetailItem(item)}
                    style={{ cursor: 'pointer' }}
                    title={item.name}
                  >
                    {item.name}
                  </h3>

                  <p className="card-desc">{item.description}</p>

                  <div className="card-footer-info">
                    <div>
                      <div className="stock-indicator">
                        <span className={`stock-dot ${item.available_qty === 0 ? 'out' : item.is_low_stock ? 'low' : ''}`} />
                        <span style={{ color: item.available_qty === 0 ? '#dc2626' : '#334155' }}>
                          {item.available_qty} of {item.total_qty} available
                        </span>
                      </div>
                      <div className="rate-text" style={{ marginTop: '2px' }}>
                        Fine: ₹{item.late_fine_per_day}/day
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDetailItem(item)}
                        title="View technical specifications"
                      >
                        Specs
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!isAvailable}
                        onClick={() => setRequestItem(item)}
                      >
                        {isAvailable ? 'Request' : 'Out'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EquipmentDetailModal
        equipment={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        onRequest={(eq) => {
          setDetailItem(null);
          setRequestItem(eq);
        }}
      />

      <RequestModal
        equipment={requestItem}
        isOpen={!!requestItem}
        onClose={() => setRequestItem(null)}
        onSuccess={() => {
          fetchCatalog();
        }}
      />
    </div>
  );
}
