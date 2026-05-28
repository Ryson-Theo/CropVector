import React, { useEffect, useState } from "react";
import {
  Filter, Zap, ShieldCheck, ShoppingCart, Star, MapPin,
  Package, RotateCw, Heart,
  Leaf, X, MessageCircle, User, Info, Clock
} from "lucide-react";
import { toast } from "react-toastify";
import "./marketplace.css";

let cachedMarketplaceListings = null;
let marketplaceListingsPromise = null;

/**
 * Buyer Marketplace 
 * Browse, filter, and purchase crops from farmers
 */

const CROP_TYPES = [
  "All Crops", "Cereals", "Vegetables", "Fruits", "Pulses", "Spices", "Organic", "Dairy"
];

const UNIT_TYPES = ["kg", "quintal", "ton"];

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [farmerStats, setFarmerStats] = useState(null);
  const [listingReviews, setListingReviews] = useState([]);
  const [loadingFarmer, setLoadingFarmer] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  
  // Order form state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    deliveryType: 'pickup',
    deliveryAddress: '',
    city: '',
    postalCode: '',
    phone: '',
    instructions: ''
  });
  const [quantityWarning, setQuantityWarning] = useState('');

  const [filters, setFilters] = useState({
    search: "",
    category: "All Crops",
    minPrice: "",
    maxPrice: "",
    location: "",
    unit: "",
  });

  const [sortBy, setSortBy] = useState("newest");
  const [viewType, setViewType] = useState("grid");
  const [favorites, setFavorites] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  
  // Ensure API_URL includes /api
  const getApiUrl = (endpoint) => {
    const baseUrl = API_URL.includes('/api') ? API_URL : `${API_URL}/api`;
    return `${baseUrl}${endpoint}`;
  };

  // Fetch listings
  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, filters, sortBy]);

  const fetchListings = async () => {
    if (cachedMarketplaceListings) {
      setListings(cachedMarketplaceListings);
      return;
    }
    if (marketplaceListingsPromise) {
      const cached = await marketplaceListingsPromise;
      if (cached) setListings(cached);
      return;
    }

    setLoading(true);
    const promise = (async () => {
      try {
        const res = await fetch(getApiUrl('/marketplace/listings'));
        const data = await res.json();
        const listingsData = data.listings || [];
        cachedMarketplaceListings = listingsData;
        setListings(listingsData);
        return listingsData;
      } catch (err) {
        console.error("Error fetching listings:", err);
        return null;
      } finally {
        setLoading(false);
      }
    })();

    marketplaceListingsPromise = promise;
    try {
      await promise;
    } finally {
      marketplaceListingsPromise = null;
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...listings];

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          l.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category !== "All Crops") {
      filtered = filtered.filter((l) => l.category === filters.category);
    }

    if (filters.minPrice) {
      filtered = filtered.filter((l) => l.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((l) => l.price <= parseFloat(filters.maxPrice));
    }

    if (filters.location) {
      filtered = filtered.filter((l) =>
        l.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.unit) {
      filtered = filtered.filter((l) => l.unit === filters.unit);
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    }

    setFilteredListings(filtered);
  };

  const handleQuantityChange = (value) => {
    const quantity = Number(value);
    if (isNaN(quantity) || quantity < 1) {
      setQuantityWarning('Please enter a quantity of at least 1.');
      setOrderForm((prev) => ({ ...prev, quantity: quantity || '' }));
      return;
    }

    if (selectedListing && quantity > selectedListing.quantity) {
      setQuantityWarning('⚠️ Quantity exceeds available stock. Farmer can reject booking request.');
    } else {
      setQuantityWarning('');
    }

    setOrderForm((prev) => ({ ...prev, quantity }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "All Crops",
      minPrice: "",
      maxPrice: "",
      location: "",
      unit: "",
    });
    setSortBy("newest");
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const placeOrder = async (listing) => {
    const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!currentToken) {
      toast.error("Please login to place orders");
      return;
    }

    setLoadingFarmer(true);
    
    try {
      // Fetch full listing details to ensure all farmer fields are populated
      const res = await fetch(getApiUrl(`/marketplace/listings/${listing._id}`));
      const data = await res.json();
      const fullListing = data.listing;
      
      // Ensure listing is set with complete data
      setSelectedListing(fullListing);
      
      // Show order form instead of immediately placing order
      setOrderForm({
        quantity: 1,
        deliveryType: 'pickup',
        deliveryAddress: '',
        city: '',
        postalCode: '',
        phone: '',
        instructions: ''
      });
      setQuantityWarning('');
      setShowReviewForm(false); // Close review form if open
      setShowOrderForm(true);
    } catch (err) {
      console.error('Error fetching listing details:', err);
      setSelectedListing(listing);
      setShowOrderForm(true);
    } finally {
      setLoadingFarmer(false);
    }
  };

  const submitOrder = async (listing) => {
    const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!currentToken) {
      toast.error("Please login to place orders");
      return;
    }

    if (!orderForm.quantity || orderForm.quantity < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (selectedListing && Number(orderForm.quantity) > selectedListing.quantity) {
      toast.error("Quantity exceeds available stock. Farmer may reject this booking.");
      return;
    }

    if (orderForm.deliveryType === 'delivery') {
      if (!orderForm.deliveryAddress || !orderForm.city) {
        toast.error("Please enter delivery address and city");
        return;
      }
    }

    if (!orderForm.phone) {
      toast.error("Please enter your phone number");
      return;
    }

    try {
      const res = await fetch(getApiUrl('/marketplace/orders'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          listingId: listing._id,
          quantity: parseInt(orderForm.quantity),
          deliveryType: orderForm.deliveryType,
          deliveryAddress: orderForm.deliveryAddress,
          city: orderForm.city,
          postalCode: orderForm.postalCode,
          phone: orderForm.phone,
          instructions: orderForm.instructions
        }),
      });

      if (res.ok) {
        await res.json();
        toast.success("✓ Order created successfully! Please contact the farmer to confirm delivery details.");
        setShowOrderForm(false);
        setSelectedListing(null);
        setQuantityWarning('');
      } else {
        const error = await res.json();
        toast.error(`Error: ${error.message || error.error || 'Failed to place order'}`);
      }
    } catch (err) {
      console.error("Order error:", err);
      toast.error("Failed to place order");
    }
  };

  const fetchFarmerDetails = async (listing) => {
    setLoadingFarmer(true);
    setShowReviewForm(false);
    
    try {
      // Get listing details including reviews
      const listingRes = await fetch(getApiUrl(`/marketplace/listings/${listing._id}`));
      const listingData = await listingRes.json();
      const fullListing = listingData.listing;
      
      // Set the complete listing with all populated fields
      setSelectedListing(fullListing);
      
      if (fullListing) {
        setListingReviews(fullListing.reviews || []);
      }
      
      // Get farmer stats
      if (fullListing.farmerId && (fullListing.farmerId._id || fullListing.farmerId)) {
        const farmerId = fullListing.farmerId._id || fullListing.farmerId;
        const farmerRes = await fetch(getApiUrl(`/marketplace/farmer/${farmerId}/stats`));
        const farmerData = await farmerRes.json();
        setFarmerStats(farmerData);
      }
    } catch (err) {
      console.error('Error fetching farmer details:', err);
    } finally {
      setLoadingFarmer(false);
    }
  };
  
  const handleSubmitReview = async () => {
    const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!currentToken) {
      toast.error("Please login to submit a review");
      return;
    }

    if (!reviewForm.rating || !selectedListing) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      const res = await fetch(getApiUrl('/marketplace/reviews'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          listingId: selectedListing._id,
          subjectId: selectedListing.farmerId._id,
          rating: parseInt(reviewForm.rating),
          comment: reviewForm.comment,
        }),
      });

      if (res.ok) {
        toast.success("Review submitted successfully!");
        setReviewForm({ rating: 5, comment: '' });
        setShowReviewForm(false);
        // Refresh reviews
        fetchFarmerDetails(selectedListing);
      } else {
        const error = await res.json();
        toast.error(`Error: ${error.message || 'Failed to submit review'}`);
      }
    } catch (err) {
      console.error("Review error:", err);
      toast.error("Failed to submit review");
    }
  };

  return (
    <div className="marketplace-container">
      {/* HEADER */}
      <div className="marketplace-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Leaf size={26} /> Live Crop Marketplace
        </h1>
        <p>Fresh produce directly from verified farmers</p>
      </div>

      <div className="marketplace-content">
        {/* SIDEBAR FILTERS */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>
              <Filter size={18} /> Filters
            </h3>
            <button className="reset-filters-btn" onClick={resetFilters}>
              <RotateCw size={14} /> Reset
            </button>
          </div>

          {/* SEARCH */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search crops..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="filter-input"
            />
          </div>

          {/* CATEGORY */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="filter-select"
            >
              {CROP_TYPES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* PRICE RANGE */}
          <div className="filter-group">
            <label>Price Range (₹)</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="filter-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          {/* UNIT */}
          <div className="filter-group">
            <label>Unit</label>
            <select
              value={filters.unit}
              onChange={(e) => handleFilterChange("unit", e.target.value)}
              className="filter-select"
            >
              <option value="">All Units</option>
              {UNIT_TYPES.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* LOCATION */}
          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="City/Region"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="filter-input"
            />
          </div>

          {/* RESULT COUNT */}
          <div className="filter-result">
            <span className="result-count">{filteredListings.length}</span>
            <small>matches found</small>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="marketplace-main">
          {/* TOP BAR */}
          <div className="marketplace-topbar">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="view-controls">
              <button
                className={`view-btn ${viewType === "grid" ? "active" : ""}`}
                onClick={() => setViewType("grid")}
              >
                ⊞⊞ Grid
              </button>
              <button
                className={`view-btn ${viewType === "list" ? "active" : ""}`}
                onClick={() => setViewType("list")}
              >
                ⋮⋮ List
              </button>
            </div>
          </div>

          {/* EMPTY/LOADING STATE */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading marketplace...</p>
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="empty-state">
              <Package size={48} />
              <p>No crops found matching your filters</p>
              <button className="reset-filters-btn" onClick={resetFilters}>
                Clear Filters
              </button>
            </div>
          )}

          {/* LISTINGS GRID/LIST */}
          <div className={`listings-${viewType}`}>
            {filteredListings.map((listing) => (
              <div
                key={listing._id}
                className={`listing-item ${viewType}`}
              >
                {/* IMAGE SECTION */}
                <div className="listing-image-wrapper">
                  <img
                    src={
                      listing.images?.[0]
                        ? `${BASE_URL}/${listing.images[0].replace(/\\/g, "/")}`
                        : "https://via.placeholder.com/300?text=No+Image"
                    }
                    alt={listing.title}
                    className="listing-image"
                  />
                  <span className="live-badge">
                    <Zap size={12} /> LIVE
                  </span>

                  <button
                    className={`favorite-btn ${
                      favorites.includes(listing._id) ? "active" : ""
                    }`}
                    onClick={() => toggleFavorite(listing._id)}
                  >
                    <Heart size={18} />
                  </button>

                  {listing.discountPercent && (
                    <span className="discount-label">
                      {listing.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* CONTENT SECTION */}
                <div className="listing-details">
                  {/* TITLE AND FARMER */}
                  <h3 className="listing-title">{listing.title}</h3>

                  <div className="farmer-info">
                    <ShieldCheck size={14} className="trust-badge" />
                    <span className="farmer-text">Verified Farmer</span>
                    <span className="location-text">
                      <MapPin size={12} /> {listing.location || "Unknown"}
                    </span>
                  </div>

                  {/* CATEGORY AND AVAILABILITY */}
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
                          <span className="original-price">
                            ₹{listing.price.toFixed(2)}
                          </span>
                          <span className="discount-price">
                            ₹{listing.discountPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="price">₹{listing.price.toFixed(2)}</span>
                      )}
                      <span className="unit-label">/{listing.unit}</span>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  {listing.description && viewType === "list" && (
                    <p className="listing-description">
                      {listing.description.substring(0, 100)}...
                    </p>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="listing-actions">
                    <button
                      className="action-btn details-btn"
                      onClick={() => fetchFarmerDetails(listing)}
                    >
                      View Details
                    </button>
                    <button
                      className="action-btn order-btn"
                      onClick={() => placeOrder(listing)}
                    >
                      <ShoppingCart size={14} /> Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* LISTING DETAILS MODAL */}
      {selectedListing && (
        <div className="modal-overlay" onClick={() => setSelectedListing(null)}>
          <div className="listing-details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedListing(null)}
              aria-label="Close"
            >
              <X size={20} />
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
                    <span className="price" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>₹{selectedListing.price}</span>
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

                {/* FARMER DETAILS */}
                        {selectedListing && selectedListing.farmerId ? (
                          <div className="modal-section farmer-section" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}>
                          <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><User size={18} /> Farmer Information</h4>
                          <div className="modal-farmer-profile" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div className="farmer-avatar-placeholder" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', flexShrink: 0 }}>
                            {selectedListing.farmerId.fullName ? selectedListing.farmerId.fullName.charAt(0).toUpperCase() : 'F'}
                            </div>
                            <div className="farmer-info">
                            <div className="farmer-info-content">
                              <h5 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '600' }}>{selectedListing.farmerId.fullName || 'Unknown Farmer'}</h5>
                              <p style={{ margin: '4px 0', opacity: '0.9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={14} /> {selectedListing.farmerId.place || 'Location N/A'}
                              </p>
                              {selectedListing.farmerId.status === 'approved' && (
                              <span className="status-approved" style={{ fontSize: '0.85rem', fontWeight: '600', background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                <ShieldCheck size={14} />
                                Verified Farmer
                              </span>
                              )}
                            </div>
                            </div>
                          </div>
                          </div>
                        ) : null}

                        {/* FARMER RATINGS */}
                        {farmerStats && (
                          <div className="modal-section farmer-ratings" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.2)' }}>
                          <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: '#78350f' }}><Star size={18} /> Farmer Rating & Reviews</h4>
                          <div className="rating-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                            <div className="rating-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div className="rating-stars" style={{ display: 'flex', gap: '4px', fontSize: '22px' }}>
                              {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ color: i < Math.floor(farmerStats.avgRating || 0) ? '#ffbf00' : 'rgba(255,255,255,0.4)' }}>
                                ★
                              </span>
                              ))}
                            </div>
                            <span className="rating-number" style={{ fontSize: '1.3rem', fontWeight: '700', color: '#78350f' }}>{farmerStats.avgRating ? parseFloat(farmerStats.avgRating).toFixed(1) : 'No'} / 5</span>
                            </div>
                            <div className="rating-stats" style={{ display: 'flex', gap: '24px', color: '#78350f' }}>
                            <span className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <strong style={{ fontSize: '1.3rem' }}>{farmerStats.reviewCount || 0}</strong>
                              <small>reviews</small>
                            </span>
                            <span className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <strong style={{ fontSize: '1.3rem' }}>{farmerStats.listingCount || 0}</strong>
                              <small>active listings</small>
                            </span>
                            </div>
                          </div>
                          </div>
                        )}

                        {/* LISTING REVIEWS */}
                        <div className="modal-section reviews-section" style={{ borderLeft: '4px solid #10b981' }}>
                          <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><MessageCircle size={18} /> Buyer Reviews</h4>
                          <button
                            className="btn-add-review"
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.3s ease' }}
                          >
                            {showReviewForm ? <><X size={14} /> Hide Form</> : <><MessageCircle size={14} /> Write a Review</>}
                          </button>
                          </div>

                          {/* REVIEW FORM */}
                          {showReviewForm && (
                          <div className="review-form" style={{ background: '#f0fdf4', border: '2px solid #dcfce7', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                            <div className="form-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', color: '#065f46' }}>Your Rating:</label>
                            <select
                              value={reviewForm.rating}
                              onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                              className="form-dfinput"
                              style={{ width: '100%', padding: '10px', border: '2px solid #d1fae5', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer' }}
                            >
                              <option value="5">5 - Excellent</option>
                              <option value="4">4 - Good</option>
                              <option value="3">3 - Average</option>
                              <option value="2">2 - Poor</option>
                              <option value="1">1 - Terrible</option>
                            </select>
                            </div>
                            <div className="form-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', color: '#065f46' }}>Your Experience (Optional):</label>
                            <textarea
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                              placeholder="Share your experience about this product and farmer..."
                              className="form-textarea"
                              rows="3"
                              style={{ width: '100%', padding: '10px', border: '2px solid #d1fae5', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
                            />
                            </div>
                            <button 
                            className="btn btn-primary" 
                            onClick={handleSubmitReview}
                            style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}
                            >
                            ✓ Submit Review
                            </button>
                          </div>
                          )}

                          {/* REVIEWS LIST */}
                          {loadingFarmer ? (
                          <p className="loading-text" style={{ textAlign: 'center', color: '#6b7280', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Clock size={16} /> Loading reviews...</p>
                          ) : listingReviews.length > 0 ? (
                          <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {listingReviews.map((review) => (
                            <div key={review._id} className="review-item" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', transition: 'all 0.3s ease' }}>
                              <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                              <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{review.reviewerId?.fullName || 'Anonymous Buyer'}</strong>
                              <div className="review-stars" style={{ display: 'flex', gap: '2px', fontSize: '16px' }}>
                                {[...Array(5)].map((_, i) => (
                                <span key={i} style={{ color: i < review.rating ? '#ffb700' : '#777777' }}>
                                  ★
                                </span>
                                ))}
                              </div>
                              </div>
                              {review.comment && <p className="review-comment" style={{ margin: '8px 0', color: '#374151', fontSize: '0.9rem', lineHeight: '1.5' }}>{review.comment}</p>}
                              <small className="review-date" style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                              {new Date(review.createdAt).toLocaleDateString('en-IN')}
                              </small>
                            </div>
                            ))}
                          </div>
                          ) : (
                          <p className="no-reviews" style={{ textAlign: 'center', color: '#6b7280', padding: '20px', fontStyle: 'italic', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Info size={16} /> No reviews yet. Be the first to share your experience!</p>
                          )}
                        </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => placeOrder(selectedListing)}
                  >
                    <ShoppingCart size={16} /> Buy Now
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedListing(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER FORM MODAL */}
      {showOrderForm && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="listing-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              className="modal-close-btn"
              onClick={() => setShowOrderForm(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="modal-details">
              <h2 className="modal-title">Complete Your Order</h2>
              
              {/* ORDER SUMMARY */}
              <div className="modal-section" style={{ background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                <h4>Order Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><strong>Product:</strong> {selectedListing.title}</div>
                  <div><strong>Unit Price:</strong> ₹{selectedListing.price}/{selectedListing.unit}</div>
                  <div><strong>Quantity:</strong> {orderForm.quantity} {selectedListing.unit}</div>
                  <div><strong>Total:</strong> ₹{(selectedListing.price * orderForm.quantity).toFixed(2)}</div>
                </div>
              </div>

              {/* QUANTITY AND DELIVERY TYPE */}
              <div className="modal-section">
                <h4>Order Details</h4>
                <div className="form-group">
                  <label>Quantity *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      max={selectedListing.quantity}
                      value={orderForm.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="form-dfinput"
                      style={{ maxWidth: '100px' }}
                    />
                    <span>{selectedListing.unit} available: {selectedListing.quantity}</span>
                  </div>
                  {quantityWarning && (
                    <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginTop: '8px' }}>
                      {quantityWarning}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>Delivery Method *</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={orderForm.deliveryType === 'pickup'}
                        onChange={(e) => setOrderForm({...orderForm, deliveryType: e.target.value})}
                      />
                      <span>Pickup from Farmer</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={orderForm.deliveryType === 'delivery'}
                        onChange={(e) => setOrderForm({...orderForm, deliveryType: e.target.value})}
                      />
                      <span>Home Delivery</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* DELIVERY ADDRESS (if delivery selected) */}
              {orderForm.deliveryType === 'delivery' && (
                <div className="modal-section" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                  <h4>Delivery Address *</h4>
                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      value={orderForm.deliveryAddress}
                      onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                      className="form-dfinput"
                    />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      placeholder="New Delhi"
                      value={orderForm.city}
                      onChange={(e) => setOrderForm({...orderForm, city: e.target.value})}
                      className="form-dfinput"
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      placeholder="110001"
                      value={orderForm.postalCode}
                      onChange={(e) => setOrderForm({...orderForm, postalCode: e.target.value})}
                      className="form-dfinput"
                    />
                  </div>
                </div>
              )}

              {/* CONTACT AND INSTRUCTIONS */}
              <div className="modal-section">
                <h4>Contact Information</h4>
                <div className="form-group">
                  <label>Your Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91-XXXXXXXXXX"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                    className="form-dfinput"
                  />
                </div>
                <div className="form-group">
                  <label>Special Instructions or Notes</label>
                  <textarea
                    placeholder="e.g., Preferred delivery time, packaging preference, etc."
                    value={orderForm.instructions}
                    onChange={(e) => setOrderForm({...orderForm, instructions: e.target.value})}
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>

              {/* FARMER CONTACT */}
              <div className="modal-section" style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                <h4>Farmer Details</h4>
                <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                  <strong>Name:</strong> {selectedListing.farmerId?.fullName || 'Farmer'}
                </p>
                {selectedListing.farmerId?.phone && selectedListing.farmerId.phone !== 'N/A' ? (
                  <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                    <strong>Phone:</strong> <a href={`tel:${selectedListing.farmerId.phone}`} style={{ color: '#16a34a', textDecoration: 'none' }}>{selectedListing.farmerId.phone}</a>
                  </p>
                ) : (
                  <p style={{ margin: '8px 0', fontSize: '0.9rem', color: '#6b7280' }}>
                    <strong>Phone:</strong> Contact via messaging after placing order
                  </p>
                )}
                <p style={{ margin: '8px 0', fontSize: '0.9rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageCircle size={14} /> After placing the order, you can message the farmer to confirm delivery details.
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => submitOrder(selectedListing)}
                >
                  <ShoppingCart size={16} /> Place Order
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowOrderForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;