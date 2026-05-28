//frontend\src\components\farmer\farmer_rental_booking.js

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Calendar, Clock, Tractor, XCircle, CheckCircle2, AlertCircle, MessageSquare, Send, X, Download } from "lucide-react";

const FarmerRentalBooking = () => {
  const farmerId = localStorage.getItem("farmerId");
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  const [myBookings, setMyBookings] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-requests");
  const [messageModal, setMessageModal] = useState(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    fetchAllBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      // Fetch renter's bookings (bookings made by this farmer)
      console.log(" Fetching MY bookings for farmerId:", farmerId);
      const myRes = await fetch(`${BASE_URL}/api/machinery/my-bookings/${farmerId}`);
      const myData = await myRes.json();
      console.log(" MY bookings from backend:", myData);
      setMyBookings(Array.isArray(myData) ? myData : []);

      // Fetch incoming requests (bookings for equipment this farmer owns)
      console.log(" Fetching INCOMING requests for equipment owner:", farmerId);
      const incomingRes = await fetch(`${BASE_URL}/api/machinery/owner-requests/${farmerId}`);
      const incomingData = await incomingRes.json();
      console.log(" INCOMING requests from backend:", incomingData);
      setIncomingRequests(Array.isArray(incomingData) ? incomingData : []);
    } catch (err) {
      console.error(" Error fetching bookings:", err);
      toast.error("Failed to load bookings");
      setMyBookings([]);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await fetch(`${BASE_URL}/api/machinery/booking/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Status updated to ${newStatus}`);
      fetchAllBookings();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Could not update status");
    }
  };

  const getRenterActions = (booking) => {
    const now = new Date();
    const pickupTime = new Date(booking.startDate);
    const returnTime = new Date(booking.endDate);
    const status = booking.status;
    
    // Can mark as picked up once pickup time has passed
    if (status === "approved" && now >= pickupTime) {
      return { action: "picked-up", label: "✓ Mark as Picked Up", color: "#16a34a" };
    }
    
    // Can mark as returning once rental period has started and not yet returned
    if (status === "picked-up" && now >= returnTime) {
      return { action: "returning", label: "← Returning Equipment", color: "#9333ea" };
    }
    
    return null;
  };

  const getOwnerActions = (booking) => {
    const now = new Date();
    const pickupTime = new Date(booking.startDate);
    const status = booking.status;
    
    // Can confirm pickup after pickup time passes
    if (status === "picked-up") {
      return { 
        buttons: [
          { action: "returned", label: "✓ Confirm Returned", color: "#059669" }
        ]
      };
    }
    
    // Can confirm returning
    if (status === "returning") {
      return { 
        buttons: [
          { action: "returned", label: "✓ Confirm Returned", color: "#059669" }
        ]
      };
    }
    
    if (status === "returned") {
      return { 
        buttons: [
          { action: "completed", label: "✓ Complete Rental", color: "#059669" }
        ]
      };
    }
    
    return null;
  };

  const handleDownloadReceipt = async (bookingId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/machinery/booking/${bookingId}/receipt`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (!res.ok) {
        throw new Error('Receipt generation failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `booking-receipt-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Receipt downloaded!");
    } catch (err) {
      console.error("Error downloading receipt:", err);
      toast.error("Could not download receipt.");
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return { color: "#2563eb", bg: "#dbeafe", icon: <CheckCircle2 size={16} />, label: "Ready to Pickup" };
      case "picked-up":
        return { color: "#16a34a", bg: "#dcfce7", icon: <CheckCircle2 size={16} />, label: "In Transit" };
      case "returning":
        return { color: "#9333ea", bg: "#f3e8ff", icon: <Clock size={16} />, label: "Being Returned" };
      case "returned":
        return { color: "#059669", bg: "#d1fae5", icon: <CheckCircle2 size={16} />, label: "Returned" };
      case "completed":
        return { color: "#059669", bg: "#d1fae5", icon: <CheckCircle2 size={16} />, label: "Completed" };
      case "rejected":
        return { color: "#dc2626", bg: "#fee2e2", icon: <XCircle size={16} />, label: "Rejected" };
      default:
        return { color: "#d97706", bg: "#fef3c7", icon: <Clock size={16} />, label: "Pending Approval" };
    }
  };

  const styles = {
    container: { padding: "24px", background: "#f8fafc", minHeight: "100vh" },
    header: { marginBottom: "32px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px" },
    card: {
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(12px)",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    },
    statusBadge: (config) => ({
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
      backgroundColor: config.bg,
      color: config.color,
      width: "fit-content"
    }),
    detailRow: { display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "14px" }
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

      {/* Header Area */}
      <div style={styles.header}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b", margin: 0 }}>Rental Management</h1>
        <p style={{ color: "#64748b", marginTop: "4px" }}>Manage your rental requests and equipment bookings.</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("my-requests")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: activeTab === "my-requests" ? "#2563eb" : "transparent",
            color: activeTab === "my-requests" ? "white" : "#64748b",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          My Rental Requests ({myBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: activeTab === "incoming" ? "#2563eb" : "transparent",
            color: activeTab === "incoming" ? "white" : "#64748b",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Booking Requests on Your Equipment ({incomingRequests.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading your bookings...</div>
      ) : activeTab === "my-requests" ? (
        // MY BOOKINGS TAB
        myBookings.length === 0 ? (
          <div style={{ background: "white", padding: "60px", borderRadius: "16px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
            <Tractor size={48} style={{ margin: "0 auto 16px", color: "#cbd5e1" }} />
            <h3 style={{ color: "#1e293b", margin: "0 0 8px 0" }}>No Rental Requests Made</h3>
            <p style={{ color: "#64748b", margin: 0 }}>You haven't requested any equipment yet. Browse the marketplace to rent equipment.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {myBookings.map((b) => {
              const config = getStatusConfig(b.status);
              return (
                <div key={b._id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "#0f172a" }}>
                        {b.machineryId?.machineName || "Equipment"}
                      </h3>
                      <div style={styles.statusBadge(config)}>
                        {config.icon} {config.label}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>₹{b.totalCost}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>TOTAL COST</div>
                    </div>
                  </div>

                  <div style={{ background: "#f1f5f9", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={styles.detailRow}>
                      <Calendar size={16} color="#64748b" />
                      <span>
                        <strong>Pickup:</strong> {new Date(b.startDate).toLocaleDateString()} at {new Date(b.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <Clock size={16} color="#64748b" />
                      <span>
                        <strong>Return:</strong> {new Date(b.endDate).toLocaleDateString()} at {new Date(b.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>Equipment Owner</div>
                        <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: "600" }}>{b.ownerName || b.ownerFarmerId?.userId?.fullName || "Equipment Owner"}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <div style={{ fontSize: "11px", padding: "4px 10px", background: new Date(b.startDate) > new Date() ? "#fef3c7" : new Date(b.endDate) > new Date() ? "#dcfce7" : "#f3f4f6", color: new Date(b.startDate) > new Date() ? "#854d0e" : new Date(b.endDate) > new Date() ? "#166534" : "#374151", borderRadius: "6px", fontWeight: "600" }}>
                          {new Date(b.startDate) > new Date() ? "📅 Upcoming" : new Date(b.endDate) > new Date() ? "⏳ In Progress" : "✅ Completed"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", color: "#64748b", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>📍 Scheduled Pickup</span>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(b.startDate).toLocaleDateString("en-IN")}</span>
                        <span style={{ fontSize: "11px" }}>{new Date(b.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>📍 Scheduled Return</span>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(b.endDate).toLocaleDateString("en-IN")}</span>
                        <span style={{ fontSize: "11px" }}>{new Date(b.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setMessageModal({ booking: b, otherFarmerId: b.ownerFarmerId._id, otherFarmerName: b.ownerFarmerId?.userId?.fullName || b.ownerName })}
                      style={{
                        background: "#f1f5f9",
                        color: "#2563eb",
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s"
                      }}
                      title="Message equipment owner"
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                    
                    {b.status === "pending" && (
                      <button 
                        onClick={() => handleStatusUpdate(b._id, "null")}
                        style={{ 
                          background: "none", border: "none", color: "#ef4444", 
                          fontSize: "13px", fontWeight: "600", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "4px"
                        }}
                      >
                        <AlertCircle size={14} /> Cancel Request
                      </button>
                    )}
                    {getRenterActions(b) && (
                      <button
                        onClick={() => handleStatusUpdate(b._id, getRenterActions(b).action)}
                        style={{
                          background: getRenterActions(b).color,
                          color: "white",
                          padding: "8px 14px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {getRenterActions(b).label}
                      </button>
                    )}
                    {b.status === "completed" && (
                      <button
                        onClick={() => handleDownloadReceipt(b._id)}
                        style={{
                          background: "#059669",
                          color: "white",
                          padding: "8px 14px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Download size={14} /> Download Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // INCOMING REQUESTS TAB
        incomingRequests.length === 0 ? (
          <div style={{ background: "white", padding: "60px", borderRadius: "16px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
            <Tractor size={48} style={{ margin: "0 auto 16px", color: "#cbd5e1" }} />
            <h3 style={{ color: "#1e293b", margin: "0 0 8px 0" }}>No Booking Requests</h3>
            <p style={{ color: "#64748b", margin: 0 }}>No farmer has requested to rent your equipment yet. Make sure your equipment is marked as available in "My Equipment".</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {incomingRequests.map((b) => {
              const config = getStatusConfig(b.status);
              return (
                <div key={b._id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "#0f172a" }}>
                        {b.machineryId?.machineName || "Equipment"}
                      </h3>
                      <div style={styles.statusBadge(config)}>
                        {config.icon} {config.label}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>₹{b.totalCost}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>TOTAL COST</div>
                    </div>
                  </div>

                  <div style={{ background: "#f1f5f9", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={styles.detailRow}>
                      <Calendar size={16} color="#64748b" />
                      <span>
                        <strong>Pickup:</strong> {new Date(b.startDate).toLocaleDateString()} at {new Date(b.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <Clock size={16} color="#64748b" />
                      <span>
                        <strong>Return:</strong> {new Date(b.endDate).toLocaleDateString()} at {new Date(b.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>Requested by</div>
                        <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: "600" }}>{b.renterName || b.renterFarmerId?.userId?.fullName || "A Farmer"}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <div style={{ fontSize: "11px", padding: "4px 10px", background: new Date(b.startDate) > new Date() ? "#fef3c7" : new Date(b.endDate) > new Date() ? "#dcfce7" : "#f3f4f6", color: new Date(b.startDate) > new Date() ? "#854d0e" : new Date(b.endDate) > new Date() ? "#166534" : "#374151", borderRadius: "6px", fontWeight: "600" }}>
                          {new Date(b.startDate) > new Date() ? "📅 Upcoming" : new Date(b.endDate) > new Date() ? "⏳ In Progress" : "✅ Completed"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", color: "#64748b", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>📍 Scheduled Pickup</span>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(b.startDate).toLocaleDateString("en-IN")}</span>
                        <span style={{ fontSize: "11px" }}>{new Date(b.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>📍 Scheduled Return</span>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>{new Date(b.endDate).toLocaleDateString("en-IN")}</span>
                        <span style={{ fontSize: "11px" }}>{new Date(b.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setMessageModal({ booking: b, otherFarmerId: b.renterFarmerId._id, otherFarmerName: b.renterFarmerId?.userId?.fullName || b.renterName })}
                      style={{
                        background: "#f1f5f9",
                        color: "#2563eb",
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s"
                      }}
                      title="Message renter"
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                    
                    {b.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          onClick={() => handleStatusUpdate(b._id, "approved")}
                          style={{ 
                            background: "#16a34a", color: "white",
                            padding: "8px 14px", border: "none", borderRadius: "6px",
                            fontSize: "12px", fontWeight: "600", cursor: "pointer"
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(b._id, "rejected")}
                          style={{ 
                            background: "#dc2626", color: "white",
                            padding: "8px 14px", border: "none", borderRadius: "6px",
                            fontSize: "12px", fontWeight: "600", cursor: "pointer"
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    
                    {getOwnerActions(b) && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        {getOwnerActions(b).buttons.map((btn) => (
                          <button
                            key={btn.action}
                            onClick={() => handleStatusUpdate(b._id, btn.action)}
                            style={{
                              background: btn.color,
                              color: "white",
                              padding: "8px 14px",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {b.status === "completed" && (
                      <button
                        onClick={() => handleDownloadReceipt(b._id)}
                        style={{
                          background: "#059669",
                          color: "white",
                          padding: "8px 14px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Download size={14} /> Download Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Message Modal */}
      {messageModal && (
        <div 
          style={{
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
            zIndex: 1000
          }}
          onClick={() => setMessageModal(null)}
        >
          <div 
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "500px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0f172a" }}>
                Message {messageModal.otherFarmerName}
              </h2>
              <button 
                onClick={() => setMessageModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#0f172a" }}>
                {messageModal.booking.machineryId?.machineName}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                {messageModal.booking.startDate ? new Date(messageModal.booking.startDate).toLocaleDateString() : ""} to {messageModal.booking.endDate ? new Date(messageModal.booking.endDate).toLocaleDateString() : ""}
              </p>
            </div>

            <textarea
              placeholder="Type your message here..."
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
                    const res = await fetch(`${BASE_URL}/api/messages/send`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        senderId: farmerId,
                        receiverId: messageModal.otherFarmerId,
                        bookingId: messageModal.booking._id,
                        content: messageText
                      })
                    });

                    if (res.ok) {
                      toast.success(`Message sent to ${messageModal.otherFarmerName}!`);
                      setMessageModal(null);
                      setMessageText("");
                    } else {
                      toast.error("Failed to send message");
                    }
                  } catch (err) {
                    console.error("Error sending message:", err);
                    toast.error("Error sending message");
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

export default FarmerRentalBooking;