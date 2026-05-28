//frontend\src\components\farmer\farmer_rental_market.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Tractor, Search, MapPin, Info, 
  Calendar, Clock, X, Filter, MessageSquare, Send
} from "lucide-react";
import { toast } from "react-toastify";

const FarmerRentalMarket = () => {
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [selected, setSelected] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [messageModal, setMessageModal] = useState(null);
  const [messageText, setMessageText] = useState("");

  const farmerId = localStorage.getItem("farmerId");
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

  const categories = ["All", "Tractor", "Harvester", "Sprayer", "Tiller", "Other"];

  useEffect(() => {
    fetchMachinery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMachinery = async () => {
    try {
      console.log(" Fetching marketplace equipment for farmerId:", farmerId);
      const res = await fetch("http://localhost:5000/api/machinery");
      const data = await res.json();
      console.log(" All equipment from backend:", data);
      console.log(`   Total equipment in DB: ${data.length}`);
      
      // Only show items marked as availableForRent and not owned by current user
      const marketItems = data.filter(l => {
        const isAvailable = l.availableForRent || l.availability;
        // ownerFarmerId can be an object (when populated) or a string (when not)
        const ownerId = l.ownerFarmerId?._id || l.ownerFarmerId;
        const isNotOwned = ownerId && ownerId !== farmerId;
        console.log(`   Checking: "${l.machineName}" → Available=${isAvailable}, OwnerID=${ownerId}, CurrentFarmerId=${farmerId}, NotOwned=${isNotOwned} → SHOW=${isAvailable && isNotOwned}`);
        return isAvailable && isNotOwned;
      });
      
      console.log(` Filtered market items: ${marketItems.length} equipment(s) to display`);
      marketItems.forEach(item => {
        console.log(`   ✓ ${item.machineName} by ${item.ownerFarmerId?.userId?.fullName || "Unknown"}`);
      });
      
      setListings(marketItems);
      setFiltered(marketItems);
    } catch (err) {
      console.error("❌ Error fetching marketplace:", err);
      toast.error("Failed to load marketplace");
    }
  };

  const handleFilter = (q, category) => {
    setQuery(q);
    let temp = listings.filter((l) =>
      l.machineName.toLowerCase().includes(q.toLowerCase()) ||
      l.category?.toLowerCase().includes(q.toLowerCase()) ||
      l.location?.toLowerCase().includes(q.toLowerCase())
    );

    if (category !== "All") {
      temp = temp.filter(l => l.category === category);
    }
    setFiltered(temp);
  };

  const submitBooking = async () => {
    if (!startDate || !endDate) {
      toast.warn("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      toast.error("End date must be after start date");
      return;
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const totalCost = Math.max(1, Math.ceil(hours)) * selected.hourlyRate;

    try {
      const res = await fetch("http://localhost:5000/api/machinery/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineryId: selected._id,
          ownerFarmerId: selected.ownerFarmerId?._id,
          renterFarmerId: farmerId,
          startDate,
          endDate,
          totalCost
        })
      });

      if (!res.ok) throw new Error();
      toast.success(`Booking request for ${selected.machineName} sent!`);
      setSelected(null);
      setStartDate("");
      setEndDate("");
    } catch {
      toast.error("Booking request failed");
    }
  };

  const getConditionStyle = (condition) => {
    switch (condition) {
      case "excellent": return { bg: "#dcfce7", text: "#166534" };
      case "good": return { bg: "#fef9c3", text: "#854d0e" };
      default: return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const styles = {
    container: { padding: "24px", background: "#f8fafc", minHeight: "100vh" },
    searchBar: {
      display: "flex", gap: "12px", background: "white", padding: "12px",
      borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "20px"
    },
    categoryBtn: (active) => ({
      padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
      background: active ? "#2563eb" : "#e2e8f0", color: active ? "white" : "#475569",
      transition: "all 0.2s", fontWeight: "500"
    }),
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
    card: {
      background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(8px)",
      borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)", position: "relative"
    },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    modalContent: { background: "white", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "450px" }
  };

  return (
    <div style={styles.container}>
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
      
      {/* Header & Search */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>
          Rental Marketplace
        </h1>
        
        <div style={styles.searchBar}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8" }} size={20} />
            <input 
              style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
              placeholder="Search by name, category, or location..."
              value={query}
              onChange={(e) => handleFilter(e.target.value, activeCategory)}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => { setActiveCategory(cat); handleFilter(query, cat); }}
                style={styles.categoryBtn(activeCategory === cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#64748b" }}>
            <Tractor size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
            <p>No equipment found matching your criteria.</p>
          </div>
        ) : (
          filtered.map((l) => {
            const cond = getConditionStyle(l.condition);
            return (
              <div key={l._id} style={styles.card}>
                <div style={{ height: '180px', background: '#e2e8f0', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden', position: 'relative' }}>
                  {l.image ? (
                    <img src={`${BASE_URL}/${l.image.replace(/\\/g, '/')}?t=${new Date(l.updatedAt).getTime()}`} alt={l.machineName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Tractor size={48} />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {l.category}
                  </span>
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", backgroundColor: cond.bg, color: cond.text }}>
                    {l.condition?.toUpperCase() || "GOOD"}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.2rem", margin: "0 0 4px 0", color: "#0f172a" }}>{l.machineName}</h3>
                <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 16px 0" }}>{l.model || l.brand}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#475569" }}>
                    <MapPin size={16} color="#94a3b8" /> {l.location || "Local Area"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#475569" }}>
                    <Info size={16} color="#94a3b8" /> Owner: <strong>{l.ownerFarmerId?.userId?.fullName || "Unknown Farmer"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>₹{l.hourlyRate}</span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}> / hr</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => setMessageModal(l)}
                      title="Message owner about this equipment"
                      style={{ background: "#f1f5f9", color: "#2563eb", padding: "10px 12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button 
                      onClick={() => setSelected(l)}
                      style={{ background: "#0f172a", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}
                    >
                      Rent Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Booking Modal */}
      {selected && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Book Equipment</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X /></button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontWeight: "600" }}>{selected.machineName}</p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Rate: ₹{selected.hourlyRate}/hr</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>Pickup Date & Time</label>
                <input 
                  type="datetime-local" 
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>Return Date & Time</label>
                <input 
                  type="datetime-local" 
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {startDate && endDate && (
              <div style={{ marginTop: "20px", padding: "16px", background: "#f0f7ff", borderRadius: "8px", border: "1px solid #e0e7ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Estimated Total</span>
                  <span style={{ fontWeight: "800" }}>
                    ₹{Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60))) * selected.hourlyRate}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>* Final price confirmed by owner</p>
              </div>
            )}

            <button 
              onClick={submitBooking}
              style={{ width: "100%", marginTop: "24px", padding: "14px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
            >
              Send Rental Request
            </button>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <div style={styles.modalOverlay} onClick={() => setMessageModal(null)}>
          <div 
            style={{...styles.modalContent, maxWidth: "500px"}}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0f172a" }}>Message Owner</h2>
              <button 
                onClick={() => setMessageModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#0f172a" }}>
                {messageModal.machineName}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                {messageModal.category} • ₹{messageModal.hourlyRate}/hr
              </p>
            </div>

            <textarea
              placeholder={`Hi! I'm interested in renting your ${messageModal.machineName}. Can we discuss the details?`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontFamily: "inherit",
                fontSize: "14px",
                resize: "vertical",
                minHeight: "100px",
                boxSizing: "border-box",
                marginBottom: "16px"
              }}
            />

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setMessageModal(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#cbd5e1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!messageText.trim()) {
                    toast.warn("Please type a message");
                    return;
                  }

                  try {
                    const receiverId = messageModal.ownerFarmerId?._id || messageModal.ownerFarmerId;
                    
                    const res = await fetch(`${BASE_URL}/api/messages/send`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        senderId: farmerId,
                        receiverId: receiverId,
                        content: messageText
                      })
                    });

                    if (res.ok) {
                      toast.success("Message sent successfully!");
                      setMessageModal(null);
                      setMessageText("");
                    } else {
                      throw new Error("Failed to send message");
                    }
                  } catch (err) {
                    console.error('Error sending message:', err);
                    toast.error('Failed to send message');
                  }
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}
              >
                <Send size={16} /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerRentalMarket;