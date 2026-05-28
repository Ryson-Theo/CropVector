import React, { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Eye, AlertCircle, Zap, CheckCircle,
  Upload, X, MapPin, Package, DollarSign, TrendingUp, Image as ImageIcon, ShieldCheck
} from "lucide-react";
import { toast } from "react-toastify";
import "./farmer_crop_market.css";

/**
 * Farmer Crop Market Component
 * Allows farmers to list crops for sale and manage their marketplace listings.
 */

const UNIT_CONVERSIONS = {
  kg: 1,
  quintal: 100, // 1 quintal = 100 kg
  ton: 1000,    // 1 ton = 1000 kg
};

const CROPS_CATEGORIES = [
  "Cereals", "Vegetables", "Fruits", "Pulses", "Spices", "Dairy", "Organic"
];

const FarmerCropMarket = () => {
  const [activeTab, setActiveTab] = useState("listings"); // listings, add-crop
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // Form state for new listing
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Cereals",
    quantity: "",
    unit: "kg",
    basePrice: "", // Price per unit
    location: "",
    images: [],
    imageFiles: [],
    tags: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [lastPrice, setLastPrice] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const farmerId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

  // Load listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    if (!token || !farmerId) {
      console.warn("Skipping fetch: missing token or farmerId");
      return;
    }
    setLoading(true);
    try {
      // Try to fetch all listings - backend will filter by farmerId if needed
      const res = await fetch(
        `${API_URL}/api/marketplace/listings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      let allListings = data.listings || [];
      
      // Filter by current farmer if backend didn't
      allListings = allListings.filter(l => {
        const listingFarmerId = l.farmerId?._id || l.farmerId;
        return listingFarmerId === farmerId || l.farmerId === farmerId;
      });
      
      setListings(allListings);
      console.log("✓ Loaded", allListings.length, "listings for farmer", farmerId);
    } catch (err) {
      console.error("Error fetching listings:", err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    setPreviewImages([...previewImages, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...files],
    }));
  };

  const removeImage = (id) => {
    setPreviewImages(previewImages.filter((img) => img.id !== id));
    setFormData((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, idx) => idx !== id),
    }));
  };

  const _convertPrice = (price, fromUnit, toUnit = "kg") => {
    const fromFactor = UNIT_CONVERSIONS[fromUnit] || 1;
    const toFactor = UNIT_CONVERSIONS[toUnit] || 1;
    return (price * fromFactor) / toFactor;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check authentication
    if (!token || !farmerId) {
      toast.error(" Please log in first");
      console.warn("Missing authentication", { token: !!token, farmerId: !!farmerId });
      return;
    }

    if (
      !formData.title ||
      !formData.quantity ||
      !formData.basePrice ||
      !formData.location
    ) {
      toast.error(" Please fill all required fields");
      return;
    }

    setLoading(true);
    const formDataObj = new FormData();
    formDataObj.append("title", formData.title);
    formDataObj.append("description", formData.description);
    formDataObj.append("category", formData.category);
    formDataObj.append("quantity", parseFloat(formData.quantity));
    formDataObj.append("unit", formData.unit);
    formDataObj.append("price", parseFloat(formData.basePrice));
    formDataObj.append("location", formData.location);
    formDataObj.append("tags", formData.tags || "");
    formDataObj.append("userId", farmerId);

    // Apply discount if set
    if (discountPercent > 0) {
      const discountedPrice =
        parseFloat(formData.basePrice) * (1 - discountPercent / 100);
      formDataObj.append("discountPrice", discountedPrice);
      formDataObj.append("discountPercent", discountPercent);
    }

    previewImages.forEach((img) => {
      formDataObj.append("images", img.file);
    });

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `${API_URL}/api/marketplace/listings/${editingId}`
        : `${API_URL}/api/marketplace/listings`;

      console.log(" Submitting to:", url);
      console.log(" Token present:", !!token);
      console.log(" Farmer ID:", farmerId);

      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`
        },
        body: formDataObj,
      });

      const responseData = await res.json();
      console.log(" API Response:", responseData);
      console.log("Status Code:", res.status);

      if (!res.ok) {
        const errorMsg = responseData.message || responseData.error || "Failed to save listing";
        throw new Error(errorMsg);
      }

      toast.success(" " + (editingId ? "Listing updated!" : "Crop listed successfully!"));
      resetForm();
      setActiveTab("listings");
      await fetchListings();
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(" Error saving listing:", err);
      toast.error(` ${err.message || 'Failed to save listing'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Cereals",
      quantity: "",
      unit: "kg",
      basePrice: "",
      location: "",
      images: [],
      imageFiles: [],
      tags: "",
    });
    setPreviewImages([]);
    setEditingId(null);
    setDiscountPercent(0);
  };

  const startEdit = (listing) => {
    setFormData({
      title: listing.title,
      description: listing.description || "",
      category: listing.category || "Cereals",
      quantity: listing.quantity,
      unit: listing.unit || "kg",
      basePrice: listing.price,
      location: listing.location || "",
      images: listing.images || [],
      imageFiles: [],
      tags: listing.tags?.join(", ") || "",
    });
    setEditingId(listing._id);
    setActiveTab("add-crop");
    window.scrollTo(0, 0);
  };

  const handleViewListing = async (listing) => {
    setSelectedListing(listing);
    try {
      const res = await fetch(`${API_URL}/api/marketplace/listings/${listing._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.listing) {
        setSelectedListing(data.listing);
      }
    } catch (err) {
      console.error("Error fetching listing details:", err);
    }
  };

  const deleteListing = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/marketplace/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Listing deleted");
      fetchListings();
    } catch (err) {
      console.error("Error deleting listing:", err);
      toast.error("Failed to delete listing");
    } finally {
      setLoading(false);
    }
  };

  const getPriceWithDiscount = (basePrice) => {
    if (discountPercent <= 0) return basePrice;
    return (basePrice * (1 - discountPercent / 100)).toFixed(2);
  };

  return (
    <div className="marketplace-container">
      {/* TAB NAVIGATION */}
      <div className="marketplace-header" style={{ marginBottom: '20px' }}>
        <h1>🌾 My Crop Market</h1>
        <p>Manage your listings and reach buyers directly</p>
      </div>

      <div className="view-controls" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button
          className={`view-btn ${activeTab === "listings" ? "active" : ""}`}
          onClick={() => setActiveTab("listings")}
          style={{ padding: '10px 20px', fontSize: '1rem' }}
        >
          <Package size={18} /> My Listings ({listings.length})
        </button>
        <button
          className={`view-btn ${activeTab === "add-crop" ? "active" : ""}`}
          onClick={() => {
            resetForm();
            setActiveTab("add-crop");
          }}
          style={{ padding: '10px 20px', fontSize: '1rem' }}
        >
          <Plus size={18} /> {editingId ? "Edit Crop" : "Add Crop to Market"}
        </button>
      </div>

      {/* LISTINGS TAB */}
      {activeTab === "listings" && (
        <div className="marketplace-main">
            {listings.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>No crops listed yet. Start by adding your first crop!</p>
                <button
                  className="reset-filters-btn"
                  onClick={() => setActiveTab("add-crop")}
                  style={{ marginTop: '12px', fontSize: '1rem' }}
                >
                  <Plus size={16} /> Add Your First Crop
                </button>
              </div>
            ) : (
              <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {listings.map((listing) => (
                  <div key={listing._id} className="listing-item">
                    {/* IMAGE SECTION */}
                    <div className="listing-image-wrapper" style={{ height: '200px' }}>
                      <img
                        src={
                          listing.images?.[0]
                            ? `${BASE_URL}/${listing.images[0].replace(/\\/g, "/")}`
                            : "https://via.placeholder.com/250?text=No+Image"
                        }
                        alt={listing.title}
                        className="listing-image"
                      />
                      <span className="live-badge" style={{ top: '10px', left: '10px' }}>
                        {listing.status === "active" ? (
                          <>
                            <Zap size={12} /> Live
                          </>
                        ) : (
                          "Inactive"
                        )}
                      </span>
                      {listing.discountPercent && (
                        <span className="discount-label">
                          {listing.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* CONTENT SECTION */}
                    <div className="listing-details">
                      <h3 className="listing-title">{listing.title}</h3>

                      <div className="farmer-info">
                        <ShieldCheck size={14} className="trust-badge" />
                        <span className="farmer-text">My Listing</span>
                        <span className="location-text">
                          <MapPin size={12} /> {listing.location || "Unknown"}
                        </span>
                      </div>

                      <div className="category-section">
                        {listing.category && (
                          <span className="category-tag">{listing.category}</span>
                        )}
                        <span className="availability">
                          {listing.quantity} {listing.unit} in stock
                        </span>
                      </div>

                      {/* PRICE SECTION */}
                      <div className="price-section">
                        <div className="price-group">
                          {listing.discountPrice ? (
                            <>
                              <span className="original-price">₹{listing.price.toFixed(2)}</span>
                              <span className="price">₹{listing.discountPrice.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="price">₹{listing.price.toFixed(2)}</span>
                          )}
                          <span className="unit-label">/{listing.unit}</span>
                        </div>
                      </div>

                      <p className="listing-description">
                        {listing.description?.substring(0, 80)}
                        {(listing.description?.length || 0) > 80 ? "..." : ""}
                      </p>

                      {/* ACTION BUTTONS */}
                      <div className="listing-actions">
                        <button
                          className="action-btn details-btn"
                          onClick={() => handleViewListing(listing)}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          className="action-btn order-btn"
                          style={{ background: '#3b82f6' }}
                          onClick={() => startEdit(listing)}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="action-btn order-btn"
                          style={{ background: '#ef4444' }}
                          onClick={() => deleteListing(listing._id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ADD/EDIT CROP TAB */}
      {activeTab === "add-crop" && (
        <div className="add-crop-view" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit} className="crop-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              {editingId ? "Edit Crop Listing" : "List Your Crop for Sale"}
            </h3>

            <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Crop Name *</label>
              <input
                type="text"
                placeholder="e.g., Premium Basmati Rice"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', background: '#fff' }}
                >
                  {CROPS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Quantity Available *</label>
                <input
                  type="number"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                />
              </div>

              <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', background: '#fff' }}
                >
                  {Object.keys(UNIT_CONVERSIONS).map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Price per {formData.unit} in ₹ *</label>
                <input
                  type="number"
                  placeholder="50"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => {
                    setFormData({ ...formData, basePrice: e.target.value });
                    // Auto fetch last price for comparison
                    setLastPrice(parseFloat(e.target.value) * 1.1);
                  }}
                  required
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                />
              </div>

              <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#374151' }}>Discount % (Auto-applied)</label>
                <div className="discount-input-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value))}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', width: '80px' }}
                  />
                  {discountPercent > 0 && (
                    <span className="discount-result" style={{ color: '#16a34a', fontWeight: '600' }}>
                      Final: ₹{getPriceWithDiscount(formData.basePrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {lastPrice && (
              <div className="price-comparison" style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', color: '#0369a1' }}>
                <AlertCircle size={16} />
                <div>
                  <strong>Last Price:</strong> ₹{lastPrice.toFixed(2)}
                  <br />
                  <strong>Your Price:</strong> ₹{formData.basePrice}
                  <br />
                  <strong>Difference:</strong>{" "}
                  {parseFloat(formData.basePrice) > lastPrice
                    ? "↑ Higher"
                    : "↓ Lower"}
                </div>
              </div>
            )}

            <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Location *</label>
              <input
                type="text"
                placeholder="e.g., Indore, Madhya Pradesh"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
              />
            </div>

            <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Description</label>
              <textarea
                placeholder="Describe your crop - quality, farming method, certifications, etc."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="4"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., organic, pesticide-free, fresh"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
              />
            </div>

            {/* IMAGE UPLOAD */}
            <div className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Crop Images (Max 6)</label>
              <div className="image-upload-area" style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb' }}>
                <label className="upload-label" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                  <ImageIcon size={24} />
                  <span>Click to upload or drag & drop</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {previewImages.length > 0 && (
                <div className="image-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {previewImages.map((img) => (
                    <div key={img.id} className="preview-item" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '100px' }}>
                      <img src={img.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(img.id)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setActiveTab("listings");
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Listing"
                  : "List Crop"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedListing && (
        <div className="modal-overlay" onClick={() => setSelectedListing(null)}>
          <div className="listing-details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedListing(null)}
            >
              <X size={24} />
            </button>
            <div className="modal-content">
              {/* LISTING IMAGE */}
              {selectedListing.images?.[0] && (
                <div className="modal-image">
                  <img
                    src={`${BASE_URL}/${selectedListing.images[0].replace(/\\/g, "/")}`}
                    alt={selectedListing.title}
                  />
                </div>
              )}

              <div className="modal-details">
                {/* TITLE & PRICE */}
                <div>
                  <h2 className="modal-title">{selectedListing.title}</h2>
                  <div className="modal-price">
                    <span className="price" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
                      {selectedListing.discountPrice ? `₹${selectedListing.discountPrice.toFixed(2)}` : `₹${selectedListing.price.toFixed(2)}`}
                    </span>
                    {selectedListing.discountPrice && <span className="original-price" style={{ textDecoration: 'line-through', marginLeft: '10px', color: '#999' }}>₹{selectedListing.price.toFixed(2)}</span>}
                    <span className="unit-label">/ {selectedListing.unit}</span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                {selectedListing.description && (
                  <div className="modal-section">
                    <h4>Description</h4>
                    <p>{selectedListing.description}</p>
                  </div>
                )}

                {/* PRODUCT DETAILS */}
                <div className="modal-section">
                  <h4>Product Details</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{selectedListing.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Available:</span>
                      <span className="detail-value">{selectedListing.quantity} {selectedListing.unit}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{selectedListing.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value status-${selectedListing.status}`}>{selectedListing.status}</span>
                    </div>
                  </div>
                </div>

                {/* REVIEWS */}
                <div className="modal-section">
                  <h4>Reviews ({selectedListing.reviews?.length || 0})</h4>
                  {selectedListing.reviews && selectedListing.reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {selectedListing.reviews.map((review, idx) => (
                        <div key={idx} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{review.reviewerId?.fullName || 'Buyer'}</strong>
                            <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                          </div>
                          {review.comment && <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#4b5563' }}>{review.comment}</p>}
                          <small style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '8px' }}>No reviews yet.</p>
                  )}
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setSelectedListing(null)}>
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={() => { startEdit(selectedListing); setSelectedListing(null); }}>
                    <Edit2 size={16} /> Edit Listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerCropMarket;
