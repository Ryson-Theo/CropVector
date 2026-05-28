import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Edit2, Trash2, MapPin, X, AlertCircle, Calendar } from "lucide-react";

const FarmerMyEquipment = () => {
  const farmerId = localStorage.getItem("farmerId");
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  
  // DEBUG: Log localStorage on mount
  useEffect(() => {
    console.log("=== LOCALSTORAGE DEBUG ===");
    console.log("farmerId:", farmerId);
    console.log("userRole:", localStorage.getItem("userRole"));
    console.log("userName:", localStorage.getItem("userName"));
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log("========================");
  }, []);

  // DEBUG: Fetch ALL equipment from DB to see what exists
  useEffect(() => {
    const debugFetchAll = async () => {
      try {
        console.log(" DEBUG: Fetching ALL equipment from backend...");
        const res = await fetch("http://localhost:5000/api/machinery");
        const data = await res.json();
        console.log(" ALL equipment in DB:", data);
        console.log(`   Total count: ${data.length}`);
        data.forEach(item => {
          console.log(`   - ${item.machineName} (Owner: ${item.ownerFarmerId?._id || item.ownerFarmerId}, Available: ${item.availableForRent})`);
        });
      } catch (err) {
        console.error("❌ DEBUG: Error fetching all equipment:", err);
      }
    };
    debugFetchAll();
  }, []);

  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialFormState = {
    _id: null,
    machineName: "",
    category: "Tractor",
    brand: "",
    hourlyRate: "",
    location: "",
    condition: "good",
    availableForRent: true,
    nextServiceDate: "",
    description: "",
    image: null, // Can be a file or a URL string
  };
  const [form, setForm] = useState(initialFormState);

  const categories = ["Tractor", "Harvester", "Sprayer", "Tiller", "Other"];
  const conditions = ["excellent", "good", "needs-service"];

  // --- HELPER FUNCTIONS ---

  const closeModal = () => {
    setShowModal(false);
    setForm(initialFormState);
    setIsEditing(false);
  };

  const openAddModal = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    // Normalize image field for legacy data support
    const formData = { ...item };
    if (!formData.image && formData.images && formData.images.length > 0) {
      formData.image = formData.images[0];
    }
    setForm(formData);
    setIsEditing(true);
    setShowModal(true);
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "excellent":
        return { bg: "#dcfce7", text: "#16a34a", label: "Excellent" };
      case "good":
        return { bg: "#fef3c7", text: "#d97706", label: "Good" };
      case "needs-service":
        return { bg: "#fee2e2", text: "#dc2626", label: "Needs Service" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", label: "Unknown" };
    }
  };

  const getServiceStatus = (nextServiceDate) => {
    if (!nextServiceDate) return { status: "ok", message: "", icon: null };
    
    const serviceDate = new Date(nextServiceDate);
    const today = new Date();
    const daysUntilService = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilService < 0) {
      return { status: "overdue", message: `${Math.abs(daysUntilService)} days overdue`, color: "#dc2626" };
    } else if (daysUntilService <= 7) {
      return { status: "upcoming", message: `Service in ${daysUntilService} days`, color: "#d97706" };
    }
    return { status: "ok", message: `Service in ${daysUntilService} days`, color: "#16a34a" };
  };

  // --- API CALLS ---

  useEffect(() => {
    if (farmerId && farmerId !== "null") {
      fetchMyEquipment();
    }
  }, [farmerId]);

  const fetchMyEquipment = async () => {
    try {
      console.log(" Fetching equipment for farmerId:", farmerId);
      const res = await fetch(`${BASE_URL}/api/machinery?owner=${farmerId}&_t=${Date.now()}`);
      if (!res.ok) {
        console.error(" Backend response error:", res.status);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log(" All equipment from backend:", data);

      const myItems = data.filter(l => {
        const ownerIdFromDB = l.ownerFarmerId?._id || l.ownerFarmerId;
        const matches = String(ownerIdFromDB) === String(farmerId);
        console.log(`   Checking: ${l.machineName} - Owner: ${ownerIdFromDB} vs ${farmerId} = ${matches}`);
        return matches;
      });

      console.log(" Filtered my equipment:", myItems);
      setListings(myItems);
    } catch (err) {
      console.error(" Error fetching equipment:", err);
      toast.error("Failed to load equipment");
    }
  };

  const handleSave = async () => {
    if (!form.machineName || !form.hourlyRate || !form.location) {
      toast.warn("Please fill in all required fields");
      return;
    }

    // FIX: Ensure farmerId is set
    if (!farmerId || farmerId === "null") {
      console.error(" CRITICAL: farmerId is not set in localStorage!");
      console.log("Current localStorage:", {
        farmerId: localStorage.getItem("farmerId"),
        userRole: localStorage.getItem("userRole"),
        userName: localStorage.getItem("userName"),
      });
      toast.error(" CRITICAL: Not logged in properly. Please log out and log back in.");
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('machineName', form.machineName);
    formDataPayload.append('category', form.category);
    formDataPayload.append('brand', form.brand);
    formDataPayload.append('hourlyRate', Number(form.hourlyRate));
    formDataPayload.append('location', form.location);
    formDataPayload.append('condition', form.condition);
    formDataPayload.append('availableForRent', form.availableForRent);
    formDataPayload.append('ownerFarmerId', farmerId);
    
    if (form.nextServiceDate) {
      formDataPayload.append('nextServiceDate', form.nextServiceDate);
    }
    if (form.description) {
      formDataPayload.append('description', form.description);
    }

    // Append image only if it's a new file
    if (form.image && form.image instanceof File) {
      formDataPayload.append('image', form.image);
      console.log(" Appending new image file:", form.image.name);
    }

    console.log(" Saving equipment with FormData...");

    try {
      let url = `${BASE_URL}/api/machinery/add`;
      let method = "POST";

      if (isEditing && form._id) {
        url = `${BASE_URL}/api/machinery/update/${form._id}`; // The backend should handle FormData for updates too
        method = "PUT";
      }

      console.log(` ${method} request to ${url}`);

      const res = await fetch(url, {
        method: method,
        // No 'Content-Type' header, browser sets it for FormData
        body: formDataPayload,
      });

      console.log(` Response status: ${res.status}`);
      const responseData = await res.json();
      console.log("Response data:", responseData);

      if (res.ok) {
        toast.success(isEditing ? "Updated successfully" : "Added successfully");
        
        // Immediately update the UI with the response from the server for a better UX
        const updatedItem = responseData.machinery;
        if (isEditing) {
          setListings(prev => prev.map(l => l._id === updatedItem._id ? updatedItem : l));
        } else {
          setListings(prev => [updatedItem, ...prev]);
        }

        closeModal();
      } else {
        toast.error("Operation failed: " + (responseData.message || "Unknown error"));
      }
    } catch (err) {
      console.error(" Error saving equipment:", err);
      toast.error("Operation failed");
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const newStatus = !item.availableForRent;

      setListings(listings.map(l => l._id === item._id ? { ...l, availableForRent: newStatus } : l));

      await fetch(`${BASE_URL}/api/machinery/update/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableForRent: newStatus }),
      });

      toast.success(newStatus ? "Listed in marketplace" : "Hidden from marketplace");
    } catch {
      toast.error("Update failed");
      fetchMyEquipment();
    }
  };

  const handleDelete = async (id) => {
    // Just show confirmation modal
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/machinery/delete/${deleteConfirmId}`, { 
        method: "DELETE" 
      });
      if (res.ok) {
        toast.success("Equipment removed successfully");
        setDeleteConfirmId(null);
        fetchMyEquipment();
      } else {
        toast.error("Failed to delete equipment");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
    toast.info("Delete cancelled");
  };

  // --- FILTERING & SORTING ---
  const filteredListings = listings.filter(item => {
    if (filter === "available") return item.availableForRent === true;
    if (filter === "hidden") return item.availableForRent === false;
    if (filter === "needs-service") return item.condition === "needs-service";
    return true;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.machineName.localeCompare(b.machineName);
      case "rate-high":
        return b.hourlyRate - a.hourlyRate;
      case "rate-low":
        return a.hourlyRate - b.hourlyRate;
      case "date":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // --- STYLES ---
  const styles = {
    container: { padding: "24px", background: "#f0f4f8", minHeight: "100vh" },
    header: { marginBottom: "32px" },
    headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    title: { fontSize: "2rem", fontWeight: "800", color: "#1e293b", margin: 0 },
    subtitle: { color: "#64748b", fontSize: "0.95rem", marginTop: "4px" },
    controls: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" },
    filterBtn: (active) => ({
      padding: "8px 16px",
      borderRadius: "20px",
      border: "none",
      background: active ? "#2563eb" : "#e2e8f0",
      color: active ? "white" : "#475569",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s",
      fontSize: "13px",
    }),
    select: {
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      background: "white",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "13px",
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
    card: {
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "20px",
      border: "1px solid rgba(255,255,255,0.5)",
      boxShadow: "0 8px 16px -2px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    },
    cardHover: { boxShadow: "0 16px 24px -4px rgba(0,0,0,0.12)" },
    badge: (bg, text) => ({
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "700",
      backgroundColor: bg,
      color: text,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }),
    priceSection: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "16px" },
    price: { fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" },
    priceUnit: { fontSize: "0.8rem", color: "#64748b" },
    actionButtons: { display: "flex", gap: "8px", marginTop: "16px" },
    actionBtn: (color) => ({
      flex: 1,
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      background: "white",
      color: color || "#475569",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      transition: "all 0.2s",
    }),
  };

  // --- MODAL STYLES ---
  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    content: {
      background: "white",
      borderRadius: "16px",
      padding: "28px",
      width: "90%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    formGroup: { marginBottom: "18px" },
    label: { display: "block", fontWeight: "600", marginBottom: "6px", color: "#1e293b", fontSize: "13px" },
    input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" },
    select: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" },
    radioGroup: { display: "flex", gap: "16px" },
    radio: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
    toggleSwitch: { display: "flex", alignItems: "center", gap: "12px" },
    switch: {
      width: "48px",
      height: "28px",
      borderRadius: "14px",
      border: "none",
      cursor: "pointer",
      background: "#cbd5e1",
      transition: "background 0.3s",
    },
    buttonGroup: { display: "flex", gap: "12px", marginTop: "24px" },
    saveBtn: { flex: 1, padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" },
    cancelBtn: { flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" },
  };

  return (
    <div style={styles.container}>
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "400px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>Delete Equipment</h3>
            <p style={{ margin: "0 0 20px 0", color: "#64748b" }}>
              Are you sure you want to delete this equipment? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button 
                onClick={cancelDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* DEBUG PANEL - Only show if farmerId is missing */}
      {(!farmerId || farmerId === "null") && (
        <div style={{ background: "#fee2e2", border: "2px solid #dc2626", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#dc2626" }}>⚠️ CRITICAL ERROR: Not Logged In Properly</h3>
          <p style={{ margin: "0 0 12px 0", color: "#991b1b" }}>
            <strong>farmerId is not set!</strong> Please log out completely and log back in.
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#7f1d1d" }}>
            Current farmerId: <code>{farmerId || "undefined"}</code>
          </p>
        </div>
      )}
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>My Equipment</h1>
            <p style={styles.subtitle}>Manage and list your machinery for rent</p>
          </div>
          <button
            onClick={openAddModal}
            style={{
              padding: "12px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <Plus size={18} /> Add Equipment
          </button>
        </div>

        {/* Filters & Sort */}
        <div style={styles.controls}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={styles.filterBtn(filter === "all")} onClick={() => setFilter("all")}>
              All ({listings.length})
            </button>
            <button style={styles.filterBtn(filter === "available")} onClick={() => setFilter("available")}>
              Available
            </button>
            <button style={styles.filterBtn(filter === "hidden")} onClick={() => setFilter("hidden")}>
              Hidden
            </button>
            <button style={styles.filterBtn(filter === "needs-service")} onClick={() => setFilter("needs-service")}>
              Needs Service
            </button>
          </div>

          <select style={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Sort: Recent</option>
            <option value="name">Sort: Name</option>
            <option value="rate-high">Sort: Price (High)</option>
            <option value="rate-low">Sort: Price (Low)</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      <div style={styles.grid}>
        {sortedListings.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <AlertCircle size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
            <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>No Equipment Found</h3>
            <p>Add your first equipment to get started with the rental marketplace.</p>
          </div>
        ) : (
          sortedListings.map((item) => {
            const conditionColor = getConditionColor(item.condition);
            const serviceStatus = getServiceStatus(item.nextServiceDate);

            return (
              <div
                key={item._id}
                style={styles.card}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = styles.cardHover.boxShadow)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = styles.card.boxShadow)}
              >
                {/* Image Placeholder */}
                <div
                  style={{
                    width: "100%",
                    height: "160px",
                    borderRadius: "12px",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    overflow: "hidden",
                  }}
                >
                  {(item.image || (item.images && item.images.length > 0)) ? (
                    <img 
                      src={`${BASE_URL}/${(item.image || item.images[0]).replace(/\\/g, '/')}?t=${new Date(item.updatedAt || Date.now()).getTime()}`} 
                      alt={item.machineName} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const span = document.createElement('span');
                        span.style.color = '#94a3b8';
                        span.style.fontSize = '3rem';
                        span.innerText = '🚜';
                        e.target.parentNode.appendChild(span);
                      }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '3rem' }}>🚜</span>
                  )}
                </div>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", color: "#0f172a" }}>{item.machineName}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>{item.brand}</p>
                  </div>
                  <span style={styles.badge(item.availableForRent ? "#dcfce7" : "#fee2e2", item.availableForRent ? "#16a34a" : "#dc2626")}>
                    {item.availableForRent ? "Available" : "Hidden"}
                  </span>
                </div>

                {/* Category & Condition */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <span style={styles.badge("#e0e7ff", "#2563eb")}>{item.category}</span>
                  <span style={styles.badge(conditionColor.bg, conditionColor.text)}>{conditionColor.label}</span>
                </div>

                {/* Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", fontSize: "0.85rem", color: "#475569" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin size={14} color="#94a3b8" /> {item.location || "Not specified"}
                  </div>
                  {item.nextServiceDate && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={14} color={serviceStatus.color} />
                      <span style={{ color: serviceStatus.color }}>
                        {serviceStatus.status === "overdue" && "⚠️ "}
                        {serviceStatus.message}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Section */}
                <div style={styles.priceSection}>
                  <div>
                    <div style={styles.price}>₹{item.hourlyRate}</div>
                    <div style={styles.priceUnit}>per hour</div>
                  </div>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: "1px solid #cbd5e1",
                      background: item.availableForRent ? "#dcfce7" : "#fee2e2",
                      color: item.availableForRent ? "#16a34a" : "#dc2626",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    {item.availableForRent ? "Hide" : "List"}
                  </button>
                </div>

                {/* Action Buttons */}
                <div style={styles.actionButtons}>
                  <button onClick={() => openEditModal(item)} style={{ ...styles.actionBtn("#2563eb"), color: "#2563eb" }}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item._id)} style={{ ...styles.actionBtn("#dc2626"), color: "#dc2626" }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <div style={modalStyles.header}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#1e293b" }}>{isEditing ? "Edit Equipment" : "Add New Equipment"}</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>
                <X size={24} color="#64748b" />
              </button>
            </div>

            {/* Form */}
            <div>
              {/* Machine Name */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Machine Name *</label>
                <input
                  style={modalStyles.input}
                  value={form.machineName}
                  onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                  placeholder="e.g., John Deere Tractor"
                />
              </div>

              {/* Category */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Category *</label>
                <select style={modalStyles.select} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type/Model */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Type / Model</label>
                <input
                  style={modalStyles.input}
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g., Model 5090R"
                />
              </div>

              {/* Hourly Rate */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Hourly Rate (₹) *</label>
                <input
                  style={modalStyles.input}
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>

              {/* Location */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Location *</label>
                <input
                  style={modalStyles.input}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Village, District"
                />
              </div>

              {/* Image Upload */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Equipment Image</label>
                <input
                  style={modalStyles.input}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                />
                {/* Image Preview */}
                {form.image && (
                  <div style={{ marginTop: "12px" }}>
                    <img 
                      src={typeof form.image === 'string' ? `${BASE_URL}/${form.image.replace(/\\/g, '/')}?t=${new Date(form.updatedAt).getTime()}` : URL.createObjectURL(form.image)} 
                      alt="Preview" 
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                    />
                  </div>
                )}
              </div>

              {/* Condition */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Condition *</label>
                <div style={modalStyles.radioGroup}>
                  {conditions.map((cond) => (
                    <label key={cond} style={modalStyles.radio}>
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={form.condition === cond}
                        onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      />
                      <span style={{ fontWeight: "500" }}>{getConditionColor(cond).label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Next Service Date */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Next Service Date</label>
                <input
                  style={modalStyles.input}
                  type="date"
                  value={form.nextServiceDate ? form.nextServiceDate.split("T")[0] : ""}
                  onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })}
                />
              </div>

              {/* Available for Rent Toggle */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Available for Rent</label>
                <div style={modalStyles.toggleSwitch}>
                  <button
                    style={{
                      ...modalStyles.switch,
                      background: form.availableForRent ? "#2563eb" : "#cbd5e1",
                    }}
                    onClick={() => setForm({ ...form, availableForRent: !form.availableForRent })}
                  >
                    <span style={{ display: "inline-block", width: "24px", height: "24px", borderRadius: "50%", background: "white", transition: "transform 0.3s", transform: form.availableForRent ? "translateX(20px)" : "translateX(0px)" }} />
                  </button>
                  <span style={{ fontWeight: "500", color: form.availableForRent ? "#16a34a" : "#dc2626" }}>
                    {form.availableForRent ? "Yes, list it" : "No, keep it private"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Description</label>
                <textarea
                  style={{ ...modalStyles.input, minHeight: "80px", fontFamily: "inherit" }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Add any additional details about the equipment..."
                />
              </div>

              {/* Buttons */}
              <div style={modalStyles.buttonGroup}>
                <button onClick={handleSave} style={modalStyles.saveBtn}>
                  {isEditing ? "Update Equipment" : "Add Equipment"}
                </button>
                <button onClick={closeModal} style={modalStyles.cancelBtn}>
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

export default FarmerMyEquipment;