import React, { useEffect, useState } from "react";
import {
  MessageSquare, Truck, CheckCircle, Clock, XCircle,
  Download, RefreshCw, Filter, MapPin, Package, Trash2, Info, Eye, User
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { downloadOrderReceipt } from "../../services/receiptService";

const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [orderMessages, setOrderMessages] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const farmerId =
    sessionStorage.getItem("userId") ||
    localStorage.getItem("userId") ||
    sessionStorage.getItem("farmerId") ||
    localStorage.getItem("farmerId");

  /* ================= UI STYLES ================= */

  const page = {
    padding: 28,
    background: "#f0fdf4",
    minHeight: "100vh",
    color: "#064e3b",
    fontFamily: "Inter, system-ui"
  };

  const card = {
    background: "#ffffff",
    border: "1px solid #d1fae5",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  };

  const btnPrimary = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    background: "#10b981",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "0.2s"
  };

  const btnSecondary = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #10b981",
    background: "#ffffff",
    color: "#064e3b",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "0.2s"
  };

  const btnDanger = {
    ...btnPrimary,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca"
  };

  const headerBtn = { ...btnSecondary, padding: "10px 16px" };

  const statusStyles = {
    pending: { border: "1px solid #f59e0b", color: "#b45309", background:"#fff7ed", borderRadius:12, padding:"4px 8px", fontSize:12, fontWeight:500 },
    confirmed: { border: "1px solid #3b82f6", color: "#1d4ed8", background:"#eff6ff", borderRadius:12, padding:"4px 8px", fontSize:12, fontWeight:500 },
    shipped: { border: "1px solid #8b5cf6", color: "#6d28d9", background:"#f5f3ff", borderRadius:12, padding:"4px 8px", fontSize:12, fontWeight:500 },
    delivered: { border: "1px solid #10b981", color: "#065f46", background:"#d1fae5", borderRadius:12, padding:"4px 8px", fontSize:12, fontWeight:500 },
    cancelled: { border: "1px solid #ef4444", color: "#b91c1c", background:"#fee2e2", borderRadius:12, padding:"4px 8px", fontSize:12, fontWeight:500 }
  };

  const getApiUrl = (endpoint) => {
    const baseUrl = API_URL.includes("/api") ? API_URL : `${API_URL}/api`;
    return `${baseUrl}${endpoint}`;
  };

  /* ================= LOGIC ================= */

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (statusFilter === "all") setFilteredOrders(orders);
    else setFilteredOrders(orders.filter(o => o.status === statusFilter));
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    if (!token || !farmerId) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/marketplace/orders?userId=${farmerId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const farmerOrders = (data.orders || []).filter(
        o => o.farmerId?._id === farmerId || o.farmerId === farmerId
      );
      setOrders(farmerOrders);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(getApiUrl(`/marketplace/orders/${orderId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: newStatus } : o)));
      toast.success(`Order ${newStatus}!`);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedOrder) return;
    try {
      const res = await fetch(getApiUrl("/messages/send"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: farmerId,
          senderRole: "farmer",
          receiverId: selectedOrder.buyerId._id || selectedOrder.buyerId,
          receiverRole: "user",
          orderId: selectedOrder._id,
          content: messageInput
        })
      });
      if (!res.ok) throw new Error();
      setOrderMessages(prev => ({
        ...prev,
        [selectedOrder._id]: [
          ...(prev[selectedOrder._id] || []),
          { sender: "farmer", text: messageInput, timestamp: new Date() }
        ]
      }));
      setMessageInput("");
      toast.success("Message sent!");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const downloadReceipt = async (orderId) => {
    try {
      await downloadOrderReceipt(
        getApiUrl(`/marketplace/orders/${orderId}/receipt`),
        token,
        `order-receipt-${orderId}.pdf`
      );
    } catch (err) {
      toast.error(`Download failed: ${err.message}`);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order from history?")) return;
    try {
      const res = await fetch(getApiUrl(`/marketplace/orders/${orderId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchOrders();
    } catch {
      toast.error("Error deleting order");
    }
  };

  const getStatusIcon = (status) => {
    if (status === "pending") return <Clock size={14} />;
    if (status === "confirmed") return <CheckCircle size={14} />;
    if (status === "shipped") return <Truck size={14} />;
    if (status === "delivered") return <Package size={14} />;
    return <XCircle size={14} />;
  };

  /* ================= UI ================= */

  return (
    <div style={page}>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h2 style={{ fontSize:28, marginBottom:4 }}>Incoming Orders</h2>
          <p style={{ color:"#065f46" }}>Manage buyer orders and track shipments</p>
        </div>
        <button style={headerBtn} onClick={fetchOrders}>
          <RefreshCw size={18}/> Refresh
        </button>
      </div>

      {/* FILTER */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Filter size={18}/>
          <select
            value={statusFilter}
            onChange={(e)=>setStatusFilter(e.target.value)}
            style={{ border:"1px solid #10b981", padding:"6px 12px", borderRadius:8, color:"#064e3b" }}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <span style={{ color:"#065f46", fontWeight:600 }}>{filteredOrders.length} orders</span>
      </div>

      {/* ORDERS LIST */}
      {filteredOrders.map(order => (
        <div key={order._id} style={card}>
          {/* ORDER HEADER */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:600 }}>Order #{order._id.substring(0,8)}</h3>
              <small style={{ color:"#065f46" }}>{new Date(order.createdAt).toLocaleDateString()}</small>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, ...statusStyles[order.status] }}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr auto", gap:16, alignItems:"center" }}>
            <img
              src={order.listingId?.images?.[0] ? `${BASE_URL}/${order.listingId.images[0].replace(/\\/g,'/')}` : "https://via.placeholder.com/100"}
              alt=""
              style={{ width:80, height:80, borderRadius:10, objectFit:"cover", border:"1px solid #d1fae5" }}
            />
            <div>
              <h4 style={{ fontSize:15, fontWeight:500 }}>{order.listingId?.title || "Unknown"}</h4>
              <div style={{ fontSize:13, color:"#065f46", marginTop:6 }}>Qty: {order.quantity} {order.listingId?.unit}</div>
              <div style={{ fontSize:13, color:"#065f46", display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                <MapPin size={12}/> {order.listingId?.location || "N/A"}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:700, fontSize:18 }}>₹{order.totalPrice.toFixed(2)}</div>
              <small style={{ color:"#065f46" }}>{order.quantity} × ₹{order.unitPrice.toFixed(2)}</small>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginTop:16 }}>
            {order.status==="pending" && <button style={btnPrimary} onClick={()=>updateOrderStatus(order._id,"confirmed")}><CheckCircle size={14}/> Confirm</button>}
            {order.status==="confirmed" && <button style={btnPrimary} onClick={()=>updateOrderStatus(order._id,"shipped")}><Truck size={14}/> Ship</button>}
            {order.status==="shipped" && <button style={btnPrimary} onClick={()=>updateOrderStatus(order._id,"delivered")}><Package size={14}/> Delivered</button>}
            <button style={btnSecondary} onClick={()=>openOrderDetails(order)}><Eye size={14}/> View</button>
            <button style={btnSecondary} onClick={()=>{setSelectedOrder(order);setShowMessageModal(true);}}><MessageSquare size={14}/> Message</button>
            <button style={btnSecondary} onClick={()=>downloadReceipt(order._id)}><Download size={14}/> Receipt</button>
            {["cancelled","delivered"].includes(order.status) && <button style={btnDanger} onClick={()=>deleteOrder(order._id)}><Trash2 size={14}/> Delete</button>}
          </div>
        </div>
      ))}

      {/* ORDER DETAILS MODAL */}
      {showDetailsModal && selectedOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }} onClick={() => setShowDetailsModal(false)}>
          <div style={{ width: "100%", maxWidth: "600px", background: "#ffffff", borderRadius: 14, padding: 24, maxHeight: "90vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowDetailsModal(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#666" }}
            >
              <XCircle size={24} />
            </button>
            
            <h3 style={{ fontSize: 20, marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>Order Details #{selectedOrder._id.substring(0, 8)}</h3>
            
            <div style={{ display: "grid", gap: 20 }}>
              {/* Order Summary */}
              <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8 }}>
                <h4 style={{ fontSize: 16, marginBottom: 12, color: "#1f2937", display: "flex", alignItems: "center", gap: 8 }}><Package size={16}/> Product Info</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
                  <div><strong>Product:</strong> {selectedOrder.listingId?.title}</div>
                  <div><strong>Category:</strong> {selectedOrder.listingId?.category}</div>
                  <div><strong>Quantity Ordered:</strong> {selectedOrder.quantity} {selectedOrder.listingId?.unit}</div>
                  <div><strong>Total Price:</strong> ₹{selectedOrder.totalPrice.toFixed(2)}</div>
                </div>
              </div>

              {/* Delivery Details */}
              <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 8, border: "1px solid #dcfce7" }}>
                <h4 style={{ fontSize: 16, marginBottom: 12, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}><Truck size={16}/> Delivery Information</h4>
                <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div><strong>Method:</strong> {selectedOrder.deliveryType === 'delivery' ? 'Home Delivery' : 'Pickup from Farmer'}</div>
                  
                  {selectedOrder.deliveryType === 'delivery' && (
                    <div style={{ marginTop: 8, padding: 12, background: "white", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: "#166534" }}>Delivery Address:</div>
                      <div>{selectedOrder.deliveryAddress}</div>
                      <div>{selectedOrder.city}{selectedOrder.postalCode ? `, ${selectedOrder.postalCode}` : ''}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ background: "#eff6ff", padding: 16, borderRadius: 8, border: "1px solid #dbeafe" }}>
                <h4 style={{ fontSize: 16, marginBottom: 12, color: "#1e40af", display: "flex", alignItems: "center", gap: 8 }}><User size={16}/> Buyer Contact</h4>
                <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div><strong>Name:</strong> {selectedOrder.buyerId?.fullName || "Unknown"}</div>
                  <div><strong>Phone:</strong> {selectedOrder.phone || selectedOrder.buyerId?.phone || "N/A"}</div>
                  <div><strong>Email:</strong> {selectedOrder.buyerId?.email || "N/A"}</div>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.instructions && (
                <div style={{ background: "#fff7ed", padding: 16, borderRadius: 8, border: "1px solid #ffedd5" }}>
                  <h4 style={{ fontSize: 16, marginBottom: 8, color: "#9a3412", display: "flex", alignItems: "center", gap: 8 }}><Info size={16}/> Special Instructions</h4>
                  <p style={{ fontSize: 14, color: "#431407", margin: 0 }}>{selectedOrder.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMessageModal && selectedOrder && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", display:"flex", justifyContent:"center", alignItems:"center" }} onClick={()=>setShowMessageModal(false)}>
          <div style={{ width:520, background:"#ffffff", border:"1px solid #d1fae5", borderRadius:14, padding:20 }} onClick={(e)=>e.stopPropagation()}>
            <h3 style={{ marginBottom:12 }}>Chat with {selectedOrder.buyerId?.fullName || "Buyer"}</h3>
            <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              {(orderMessages[selectedOrder._id]||[]).map((msg,i)=>(
                <div key={i} style={{
                  padding:10,
                  borderRadius:10,
                  maxWidth:"80%",
                  background: msg.sender==="farmer" ? "#d1fae5" : "#f0fdf4",
                  alignSelf: msg.sender==="farmer" ? "flex-end":"flex-start"
                }}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input
                value={messageInput}
                onChange={(e)=>setMessageInput(e.target.value)}
                placeholder="Type message..."
                style={{ flex:1, border:"1px solid #d1fae5", borderRadius:10, padding:10 }}
              />
              <button style={btnPrimary} onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;