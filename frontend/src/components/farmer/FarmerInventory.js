import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import {
  Plus, Edit2, Trash2, Search, Filter, Download, RefreshCw, Eye, AlertTriangle,
  Package, Droplets, Leaf, Zap, Truck, TrendingDown, TrendingUp, Calendar, MapPin,
  Warehouse, ClipboardList, BarChart3, FileText, X, ChevronDown, CheckCircle, AlertCircle
} from "lucide-react";
import axios from "axios";
import "./FarmerInventory.css";
import "react-toastify/dist/ReactToastify.css";

const FarmerInventory = () => {
  const [activeTab, setActiveTab] = useState("items"); // items, analytics, low-stock
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const API_BASE = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const farmerId = localStorage.getItem('userId');
  const toastIdRef = useRef(null);

  // Helper function to show single toast at a time
  const showToast = (message, type = 'info') => {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
    }
    toastIdRef.current = toast[type](message, { autoClose: 3000 });
  };

  // Form state
  const [formData, setFormData] = useState({
    itemType: 'Seed',
    productName: '',
    quantity: '',
    unit: 'kg',
    storageLocation: { warehouse: '', bin: '', shelf: '' },
    expiryDate: '',
    supplierName: '',
    supplierEmail: '',
    unitCost: '',
    seedVariety: '',
    npkRatio: '',
    batchNumber: '',
    description: ''
  });

  const itemTypeIcons = {
    'Seed': <Leaf size={20} />,
    'Fertilizer': <Droplets size={20} />,
    'Chemical': <Zap size={20} />,
    'Fuel': <Truck size={20} />,
    'Equipment': <Package size={20} />
  };

  const itemTypeColors = {
    'Seed': '#10b981',
    'Fertilizer': '#f59e0b',
    'Chemical': '#ef4444',
    'Fuel': '#3b82f6',
    'Equipment': '#8b5cf6'
  };

  // Load inventory items
  useEffect(() => {
    loadInventory();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = inventoryItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seedVariety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.itemType === filterType);
    }

    // Low stock filter (for low-stock tab)
    if (activeTab === 'low-stock') {
      filtered = filtered.filter(item => {
        const threshold = item.itemType === 'Seed' ? 5 : 20;
        return item.quantity < threshold;
      });
    }

    setFilteredItems(filtered);
  }, [searchTerm, filterType, activeTab, inventoryItems]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      console.log('Loading inventory...', { API_BASE, farmerId, token: token ? 'exists' : 'missing' });
      
      if (!token || !farmerId) {
        showToast('Missing authentication. Please login again.', 'error');
        console.warn('Missing token or farmerId in localStorage');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE}/inventory?farmerId=${farmerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Inventory loaded:', response.data);
      setInventoryItems(response.data || []);
      showToast('Inventory loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading inventory:', error.response?.data || error.message);
      showToast(error.response?.data?.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      itemType: 'Seed',
      productName: '',
      quantity: '',
      unit: 'kg',
      storageLocation: { warehouse: '', bin: '', shelf: '' },
      expiryDate: '',
      supplierName: '',
      supplierEmail: '',
      unitCost: '',
      seedVariety: '',
      npkRatio: '',
      batchNumber: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemType: item.itemType || 'Seed',
      productName: item.productName || '',
      quantity: item.quantity || '',
      unit: item.unit || 'kg',
      storageLocation: item.storageLocation || { warehouse: '', bin: '', shelf: '' },
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      supplierName: item.supplierName || '',
      supplierEmail: item.supplierEmail || '',
      unitCost: item.unitCost || '',
      seedVariety: item.seedVariety || '',
      npkRatio: item.npkRatio || '',
      batchNumber: item.batchNumber || '',
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('storage_')) {
      const field = name.replace('storage_', '');
      setFormData(prev => ({
        ...prev,
        storageLocation: { ...prev.storageLocation, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.productName || !formData.quantity || !formData.supplierName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost) || 0,
        farmerId
      };

      console.log('Saving inventory item...', { isEdit: !!editingItem, payload });

      if (editingItem) {
        const response = await axios.put(
          `${API_BASE}/inventory/${editingItem._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Item updated:', response.data);
        showToast('Inventory item updated successfully', 'success');
      } else {
        const response = await axios.post(
          `${API_BASE}/inventory`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Item created:', response.data);
        showToast('Inventory item added successfully', 'success');
      }

      setShowModal(false);
      loadInventory();
    } catch (error) {
      console.error('Error saving inventory:', error.response?.data || error.message);
      showToast(error.response?.data?.message || 'Failed to save inventory item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE}/inventory/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Inventory item deleted successfully', 'success');
      loadInventory();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      showToast('Failed to delete inventory item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    return inventoryItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitCost || 0);
    }, 0).toFixed(2);
  };

  const calculateLowStockItems = () => {
    return inventoryItems.filter(item => {
      const threshold = item.itemType === 'Seed' ? 5 : 20;
      return item.quantity < threshold;
    }).length;
  };

  const calculateExpiredItems = () => {
    const today = new Date();
    return inventoryItems.filter(item => 
      item.expiryDate && new Date(item.expiryDate) < today
    ).length;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringsoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Type', 'Quantity', 'Unit', 'Expiry Date', 'Supplier', 'Cost'];
    const rows = filteredItems.map(item => [
      item.productName,
      item.itemType,
      item.quantity,
      item.unit,
      item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
      item.supplierName,
      item.unitCost
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Inventory exported successfully', 'success');
  };

  return (
    <div className="farmer-inventory-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="fi-header">
        <div className="fi-header-content">
          <h1>Inventory Management</h1>
          <p>Track seeds, fertilizers, chemicals, and equipment</p>
        </div>
        <div className="fi-header-actions">
          <button className="fi-btn fi-btn-primary" onClick={handleAddNew}>
            <Plus size={18} /> Add Item
          </button>
          <button className="fi-btn fi-btn-secondary" onClick={exportToCSV}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="fi-stats-grid">
        <div className="fi-stat-card">
          <div className="fi-stat-icon" style={{ backgroundColor: '#f0fdf4' }}>
            <Package size={24} color="#10b981" />
          </div>
          <div className="fi-stat-info">
            <p className="fi-stat-label">Total Items</p>
            <h3 className="fi-stat-value">{inventoryItems.length}</h3>
          </div>
        </div>

        <div className="fi-stat-card">
          <div className="fi-stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <TrendingDown size={24} color="#f59e0b" />
          </div>
          <div className="fi-stat-info">
            <p className="fi-stat-label">Low Stock</p>
            <h3 className="fi-stat-value">{calculateLowStockItems()}</h3>
          </div>
        </div>

        <div className="fi-stat-card">
          <div className="fi-stat-icon" style={{ backgroundColor: '#fee2e2' }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <div className="fi-stat-info">
            <p className="fi-stat-label">Expired Items</p>
            <h3 className="fi-stat-value">{calculateExpiredItems()}</h3>
          </div>
        </div>

        <div className="fi-stat-card">
          <div className="fi-stat-icon" style={{ backgroundColor: '#f0f9ff' }}>
            <BarChart3 size={24} color="#3b82f6" />
          </div>
          <div className="fi-stat-info">
            <p className="fi-stat-label">Total Value</p>
            <h3 className="fi-stat-value">₹{calculateTotalValue()}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="fi-tabs">
        <button
          className={`fi-tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          <Package size={18} /> All Items
        </button>
        <button
          className={`fi-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} /> Analytics
        </button>
        <button
          className={`fi-tab ${activeTab === 'low-stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('low-stock')}
        >
          <AlertTriangle size={18} /> Low Stock ({calculateLowStockItems()})
        </button>
      </div>

      {/* Filters and Search */}
      {(activeTab === 'items' || activeTab === 'low-stock') && (
        <div className="fi-controls">
          <div className="fi-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by product name, variety, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="fi-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Seed">Seeds</option>
            <option value="Fertilizer">Fertilizers</option>
            <option value="Chemical">Chemicals</option>
            <option value="Fuel">Fuel</option>
            <option value="Equipment">Equipment</option>
          </select>

          <button className="fi-btn fi-btn-secondary" onClick={loadInventory}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="fi-loading">Loading inventory...</div>}

      {/* Items List View */}
      {activeTab === 'items' && !loading && (
        <div className="fi-items-container">
          {filteredItems.length === 0 ? (
            <div className="fi-empty-state">
              <Package size={48} />
              <h3>No items found</h3>
              <p>Start by adding your first inventory item</p>
              <button className="fi-btn fi-btn-primary" onClick={handleAddNew}>
                <Plus size={18} /> Add First Item
              </button>
            </div>
          ) : (
            <div className="fi-items-grid">
              {filteredItems.map(item => (
                <div key={item._id} className="fi-item-card">
                  <div className="fi-item-header">
                    <div className="fi-item-type-badge" style={{ backgroundColor: itemTypeColors[item.itemType] + '20', borderLeft: `4px solid ${itemTypeColors[item.itemType]}` }}>
                      {itemTypeIcons[item.itemType]}
                      <span>{item.itemType}</span>
                    </div>
                    <div className="fi-item-actions">
                      <button className="fi-icon-btn" onClick={() => { setSelectedItem(item); setShowDetails(true); }} title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="fi-icon-btn" onClick={() => handleEdit(item)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="fi-icon-btn fi-icon-btn-danger" onClick={() => handleDelete(item._id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="fi-item-name">{item.productName}</h3>

                  {item.seedVariety && <p className="fi-item-meta">Variety: {item.seedVariety}</p>}
                  {item.npkRatio && <p className="fi-item-meta">NPK Ratio: {item.npkRatio}</p>}

                  <div className="fi-item-quantity">
                    <span className="fi-quantity-label">Quantity</span>
                    <span className="fi-quantity-value">{item.quantity} {item.unit}</span>
                  </div>

                  <div className="fi-item-footer">
                    <div className="fi-item-location">
                      <Warehouse size={14} />
                      <span>{item.storageLocation?.warehouse || 'Storage'} - {item.storageLocation?.bin || 'Bin'}</span>
                    </div>
                    
                    {item.expiryDate && (
                      <div className={`fi-item-expiry ${isExpired(item.expiryDate) ? 'expired' : isExpiringsoon(item.expiryDate) ? 'expiring' : 'valid'}`}>
                        <Calendar size={14} />
                        <span>{new Date(item.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {isExpired(item.expiryDate) && (
                    <div className="fi-item-alert expired">
                      <AlertCircle size={14} /> Expired
                    </div>
                  )}
                  {isExpiringsoon(item.expiryDate) && !isExpired(item.expiryDate) && (
                    <div className="fi-item-alert expiring">
                      <AlertTriangle size={14} /> Expiring Soon
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Low Stock View */}
      {activeTab === 'low-stock' && !loading && (
        <div className="fi-items-container">
          {filteredItems.length === 0 ? (
            <div className="fi-empty-state">
              <CheckCircle size={48} color="#10b981" />
              <h3>All items in stock</h3>
              <p>No items are below the minimum threshold</p>
            </div>
          ) : (
            <div className="fi-table-responsive">
              <table className="fi-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Current Stock</th>
                    <th>Min Threshold</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const threshold = item.itemType === 'Seed' ? 5 : 20;
                    return (
                      <tr key={item._id}>
                        <td className="fi-table-product">
                          <span className="fi-type-badge" style={{ color: itemTypeColors[item.itemType] }}>
                            {itemTypeIcons[item.itemType]}
                          </span>
                          <strong>{item.productName}</strong>
                        </td>
                        <td>{item.itemType}</td>
                        <td><strong>{item.quantity} {item.unit}</strong></td>
                        <td>{threshold} {item.unit}</td>
                        <td>
                          <span className="fi-status-badge critical">
                            Critical
                          </span>
                        </td>
                        <td>
                          <button className="fi-table-btn" onClick={() => handleEdit(item)}>
                            Reorder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && !loading && (
        <div className="fi-analytics-container">
          <div className="fi-analytics-grid">
            <div className="fi-analytics-card">
              <h3>Distribution by Type</h3>
              <div className="fi-chart">
                {['Seed', 'Fertilizer', 'Chemical', 'Fuel', 'Equipment'].map(type => {
                  const count = inventoryItems.filter(item => item.itemType === type).length;
                  const percentage = inventoryItems.length > 0 ? (count / inventoryItems.length * 100).toFixed(1) : 0;
                  return (
                    <div key={type} className="fi-chart-bar">
                      <div className="fi-bar-label">{type}</div>
                      <div className="fi-bar-container">
                        <div
                          className="fi-bar-fill"
                          style={{ width: `${percentage}%`, backgroundColor: itemTypeColors[type] }}
                        ></div>
                      </div>
                      <div className="fi-bar-value">{count} ({percentage}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fi-analytics-card">
              <h3>Storage Locations</h3>
              <div className="fi-locations-list">
                {Array.from(new Set(inventoryItems.map(item => item.storageLocation?.warehouse || 'Unknown'))).map(warehouse => {
                  const count = inventoryItems.filter(item => item.storageLocation?.warehouse === warehouse).length;
                  return (
                    <div key={warehouse} className="fi-location-item">
                      <Warehouse size={18} />
                      <div>
                        <p className="fi-location-name">{warehouse || 'Unknown'}</p>
                        <p className="fi-location-count">{count} items</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fi-analytics-card">
              <h3>Top Suppliers</h3>
              <div className="fi-suppliers-list">
                {Array.from(new Set(inventoryItems.map(item => item.supplierName).filter(Boolean))).slice(0, 5).map(supplier => {
                  const items = inventoryItems.filter(item => item.supplierName === supplier);
                  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitCost || 0), 0);
                  return (
                    <div key={supplier} className="fi-supplier-item">
                      <div>
                        <p className="fi-supplier-name">{supplier}</p>
                        <p className="fi-supplier-meta">{items.length} items</p>
                      </div>
                      <p className="fi-supplier-value">₹{totalValue.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fi-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="fi-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fi-modal-header">
              <h2>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
              <button className="fi-modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="fi-modal-body">
              <div className="fi-form-group">
                <label>Item Type *</label>
                <select name="itemType" value={formData.itemType} onChange={handleInputChange}>
                  <option value="Seed">Seed</option>
                  <option value="Fertilizer">Fertilizer</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>

              <div className="fi-form-row">
                <div className="fi-form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                  />
                </div>

                {formData.itemType === 'Seed' && (
                  <div className="fi-form-group">
                    <label>Variety</label>
                    <input
                      type="text"
                      name="seedVariety"
                      value={formData.seedVariety}
                      onChange={handleInputChange}
                      placeholder="E.g., Hybrid A"
                    />
                  </div>
                )}

                {(formData.itemType === 'Fertilizer' || formData.itemType === 'Chemical') && (
                  <div className="fi-form-group">
                    <label>NPK/Composition</label>
                    <input
                      type="text"
                      name="npkRatio"
                      value={formData.npkRatio}
                      onChange={handleInputChange}
                      placeholder="E.g., 10-20-10"
                    />
                  </div>
                )}
              </div>

              <div className="fi-form-row">
                <div className="fi-form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                    step="0.01"
                  />
                </div>

                <div className="fi-form-group">
                  <label>Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange}>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="lbs">Pound (lbs)</option>
                    <option value="L">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>

                <div className="fi-form-group">
                  <label>Unit Cost</label>
                  <input
                    type="number"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleInputChange}
                    placeholder="Cost per unit"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="fi-form-row">
                <div className="fi-form-group">
                  <label>Warehouse</label>
                  <input
                    type="text"
                    name="storage_warehouse"
                    value={formData.storageLocation.warehouse}
                    onChange={handleInputChange}
                    placeholder="E.g., Main Store"
                  />
                </div>

                <div className="fi-form-group">
                  <label>Bin/Section</label>
                  <input
                    type="text"
                    name="storage_bin"
                    value={formData.storageLocation.bin}
                    onChange={handleInputChange}
                    placeholder="E.g., Bin-1"
                  />
                </div>

                <div className="fi-form-group">
                  <label>Shelf</label>
                  <input
                    type="text"
                    name="storage_shelf"
                    value={formData.storageLocation.shelf}
                    onChange={handleInputChange}
                    placeholder="E.g., Shelf-A"
                  />
                </div>
              </div>

              <div className="fi-form-row">
                <div className="fi-form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    placeholder="Enter batch number"
                  />
                </div>

                <div className="fi-form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="fi-form-row">
                <div className="fi-form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="fi-form-group">
                  <label>Supplier Email</label>
                  <input
                    type="email"
                    name="supplierEmail"
                    value={formData.supplierEmail}
                    onChange={handleInputChange}
                    placeholder="supplier@example.com"
                  />
                </div>
              </div>

              <div className="fi-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="fi-modal-footer">
              <button className="fi-btn fi-btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="fi-btn fi-btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fi-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="fi-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fi-modal-header">
              <h2>{selectedItem.productName}</h2>
              <button className="fi-modal-close" onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="fi-modal-body">
              <div className="fi-details-grid">
                <div className="fi-detail-item">
                  <span className="fi-detail-label">Type</span>
                  <div className="fi-type-badge" style={{ color: itemTypeColors[selectedItem.itemType], fontSize: '14px' }}>
                    {itemTypeIcons[selectedItem.itemType]} {selectedItem.itemType}
                  </div>
                </div>

                <div className="fi-detail-item">
                  <span className="fi-detail-label">Quantity</span>
                  <p className="fi-detail-value">{selectedItem.quantity} {selectedItem.unit}</p>
                </div>

                <div className="fi-detail-item">
                  <span className="fi-detail-label">Current Value</span>
                  <p className="fi-detail-value">₹{(selectedItem.quantity * selectedItem.unitCost).toFixed(2)}</p>
                </div>

                {selectedItem.seedVariety && (
                  <div className="fi-detail-item">
                    <span className="fi-detail-label">Variety</span>
                    <p className="fi-detail-value">{selectedItem.seedVariety}</p>
                  </div>
                )}

                {selectedItem.npkRatio && (
                  <div className="fi-detail-item">
                    <span className="fi-detail-label">NPK Ratio</span>
                    <p className="fi-detail-value">{selectedItem.npkRatio}</p>
                  </div>
                )}

                {selectedItem.batchNumber && (
                  <div className="fi-detail-item">
                    <span className="fi-detail-label">Batch Number</span>
                    <p className="fi-detail-value">{selectedItem.batchNumber}</p>
                  </div>
                )}

                <div className="fi-detail-item">
                  <span className="fi-detail-label">Storage Location</span>
                  <p className="fi-detail-value">
                    {selectedItem.storageLocation?.warehouse} - {selectedItem.storageLocation?.bin}
                  </p>
                </div>

                {selectedItem.expiryDate && (
                  <div className="fi-detail-item">
                    <span className="fi-detail-label">Expiry Date</span>
                    <p className={`fi-detail-value ${isExpired(selectedItem.expiryDate) ? 'expired' : isExpiringsoon(selectedItem.expiryDate) ? 'warning' : ''}`}>
                      {new Date(selectedItem.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="fi-detail-item">
                  <span className="fi-detail-label">Supplier</span>
                  <p className="fi-detail-value">{selectedItem.supplierName}</p>
                </div>

                {selectedItem.supplierEmail && (
                  <div className="fi-detail-item">
                    <span className="fi-detail-label">Supplier Email</span>
                    <p className="fi-detail-value">{selectedItem.supplierEmail}</p>
                  </div>
                )}

                <div className="fi-detail-item">
                  <span className="fi-detail-label">Unit Cost</span>
                  <p className="fi-detail-value">₹{selectedItem.unitCost}</p>
                </div>
              </div>

              {selectedItem.description && (
                <div className="fi-detail-description">
                  <span className="fi-detail-label">Notes</span>
                  <p>{selectedItem.description}</p>
                </div>
              )}
            </div>

            <div className="fi-modal-footer">
              <button className="fi-btn fi-btn-secondary" onClick={() => setShowDetails(false)}>
                Close
              </button>
              <button className="fi-btn fi-btn-primary" onClick={() => { setShowDetails(false); handleEdit(selectedItem); }}>
                Edit Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerInventory;
