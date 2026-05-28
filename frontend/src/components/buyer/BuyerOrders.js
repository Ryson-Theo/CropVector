// frontend/src/components/buyer/BuyerOrders.js

import React, { useEffect, useState } from 'react';
import { 
  Download, Package, Truck, CheckCircle, MessageSquare, Star, MapPin, User, X, Trash2 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { parseFetchResponse, authHeaders } from '../../utils/fetchHelper';
import './buyer-orders.css';
import { downloadOrderReceipt } from '../../services/receiptService';

export default function BuyerOrders({ setCurrentPage }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({ rating: 5, comment: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [messageModal, setMessageModal] = useState(null);
  const [messageText, setMessageText] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

  const getApiUrl = (endpoint) => {
    const baseUrl = API_URL.includes('/api') ? API_URL : `${API_URL}/api`;
    return `${baseUrl}${endpoint}`;
  };

  // Fetch buyer orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!token || !userId) { setLoading(false); return; }
      const res = await fetch(getApiUrl(`/marketplace/orders?userId=${userId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setOrders(d.orders || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Download receipt
  const downloadReceipt = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await downloadOrderReceipt(getApiUrl(`/marketplace/orders/${orderId}/receipt`), token, `receipt-${orderId}.pdf`);
    } catch (err) {
      console.error("Receipt download error:", err.message);
      toast.error(`Download failed: ${err.message}`);
    }
  };

  // Submit rating
  const submitRating = async () => {
    if (!selectedOrder || !ratingData.rating) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(getApiUrl('/marketplace/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          listingId: selectedOrder.listingId?._id || selectedOrder.listingId,
          subjectId: selectedOrder.farmerId?._id || selectedOrder.farmerId,
          rating: ratingData.rating,
          comment: ratingData.comment
        })
      });
      if (res.ok) {
        toast.success('Rating submitted successfully!');
        setShowRatingModal(false);
        setRatingData({ rating: 5, comment: '' });
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting rating');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(getApiUrl(`/marketplace/orders/${orderId}/cancel`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        toast.success('Order cancelled');
        fetchOrders();
      } else toast.error('Failed to cancel order');
    } catch (err) {
      console.error(err);
      toast.error('Error cancelling order');
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    if (!window.confirm('Permanently delete this order?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(getApiUrl(`/marketplace/orders/${orderId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Order deleted');
        fetchOrders();
      } else toast.error('Failed to delete order');
    } catch (err) {
      console.error(err);
      toast.error('Error deleting order');
    }
  };

  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', confirmed: '#22c55e', shipped: '#3b82f6', delivered: '#16a34a', cancelled: '#ef4444' };
    return colors[status] || '#666';
  };

  const getStatusIcon = (status) => {
    switch(status){
      case 'pending': return <Package size={16} />;
      case 'confirmed': return <CheckCircle size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <X size={16} />;
      default: return <Package size={16} />;
    }
  };

  const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  if (loading) return <div className="orders-loading"><p>Loading orders…</p></div>;

  return (
    <div className="buyer-orders-page" style={{ background: '#f8fdf5', padding: '20px', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#166534' }}>My Orders</h2>
          <p style={{ color: '#4b5563', marginTop: '4px' }}>Track your purchases and rate farmers</p>
        </div>
        <span style={{ background: '#22c55e', color: 'white', padding: '6px 12px', borderRadius: '12px', fontWeight: '600' }}>
          {orders.length} Orders
        </span>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all','pending','shipped','delivered'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1fae5',
              background: activeTab===tab ? '#22c55e' : 'white',
              color: activeTab===tab ? 'white' : '#166534',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab==='all'? `(${orders.length})` : ''}
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#4b5563' }}>
          <Package size={48} />
          <p style={{ marginTop: '12px', fontWeight: 600 }}>No {activeTab !== 'all' ? activeTab : ''} orders yet</p>
          <small>Start shopping in the marketplace to place your first order</small>
        </div>
      )}

      {/* ORDERS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map(o => (
          <div key={o._id} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            {/* ORDER HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#166534' }}>Order #{o._id.substring(0,8)}</h3>
                <small style={{ color: '#6b7280' }}>{new Date(o.createdAt).toLocaleDateString()}</small>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${getStatusColor(o.status)}`, padding: '4px 8px', borderRadius: '8px' }}>
                <span style={{ color: getStatusColor(o.status) }}>{getStatusIcon(o.status)}</span>
                <span style={{ color: getStatusColor(o.status), fontWeight: 600 }}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
              </div>
            </div>

            {/* PRODUCT INFO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img 
                src={o.listingId?.images?.[0]? `${BASE_URL}/${o.listingId.images[0].replace(/\\/g,'/')}` : 'https://via.placeholder.com/100?text=Crop'}
                alt={o.listingId?.title}
                style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }}
                onError={(e)=>{e.target.src='https://via.placeholder.com/100?text=Crop'}}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontWeight: 600, color: '#166534' }}>{o.listingId?.title || 'Unknown'}</h4>
                <small style={{ color: '#4b5563' }}>{o.listingId?.category || 'N/A'}</small>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '14px', color: '#4b5563' }}>
                  <span>Qty: {o.quantity} {o.listingId?.unit}</span>
                  <span><MapPin size={12}/> {o.listingId?.location || 'N/A'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: '#166534', fontSize: '16px' }}>₹{o.totalPrice.toFixed(2)}</span>
                <small style={{ display: 'block', color: '#4b5563' }}>{o.quantity} × ₹{o.unitPrice.toFixed(2)}</small>
              </div>
            </div>

            {/* FARMER INFO */}
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <User size={16} /> 
                <span style={{ fontWeight: 600, color: '#166534' }}>Farmer Information</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#4b5563' }}>
                <span><strong>Name:</strong> {o.farmerId?.fullName || 'Unknown'}</span>
                <span><strong>Email:</strong> {o.farmerId?.email || 'N/A'}</span>
                <span><strong>Location:</strong> {o.farmerId?.place || 'N/A'}</span>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button style={buttonStyle('#22c55e')} onClick={() => setMessageModal(o)}><MessageSquare size={14}/> Contact Farmer</button>
              {o.status==='pending' && <button style={buttonStyle('#facc15','#000')} onClick={()=>cancelOrder(o._id)}>✕ Cancel Order</button>}
              {o.status === 'delivered' && <button style={buttonStyle('#16a34a')} onClick={() => { setSelectedOrder(o); setShowRatingModal(true); }}><Star size={14}/> Rate Farmer</button>}
              <button style={buttonStyle('#3b82f6')} onClick={()=>downloadReceipt(o._id)}><Download size={14}/> Receipt</button>
              {['cancelled','delivered','rejected'].includes(o.status) && <button style={buttonStyle('#fee2e2','#ef4444','#fca5a5')} onClick={()=>deleteOrder(o._id)}><Trash2 size={14}/> Delete</button>}
            </div>
          </div>
        ))}
      </div>

                  {/* RATING MODAL */}
                  {showRatingModal && selectedOrder && (
                  <div className="modal-overlay" onClick={()=>setShowRatingModal(false)}>
                    <div className="rating-modal" onClick={e=>e.stopPropagation()} style={{ padding: '24px', minWidth: '500px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                      <h3 style={{ fontSize: '18px', margin: 0 }}>Rate This Farmer</h3>
                      <button onClick={()=>setShowRatingModal(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24}/></button>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ margin: '8px 0', fontWeight: 600, fontSize: '16px' }}><strong>{selectedOrder.farmerId?.fullName}</strong></p>
                      <p style={{ margin: '8px 0', color: '#4b5563' }}>{selectedOrder.listingId?.title}</p>
                      <div style={{ display:'flex', gap:'12px', margin:'16px 0' }}>
                      {[1,2,3,4,5].map(star=>(
                        <button key={star} style={{ fontSize:'28px', color: ratingData.rating>=star? '#22c55e':'#d1fae5', background:'none', border:'none', cursor:'pointer' }}
                        onClick={()=>setRatingData({...ratingData,rating:star})}>★</button>
                      ))}
                      </div>
                      <textarea placeholder="Share your feedback..." value={ratingData.comment} onChange={e=>setRatingData({...ratingData,comment:e.target.value})} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #d1fae5', resize:'vertical', minHeight: '120px', fontFamily: 'inherit' }}/>
                      <div style={{ display:'flex', gap:'12px', marginTop:'20px' }}>
                      <button onClick={()=>setShowRatingModal(false)} style={{ flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #d1fae5', background:'#f0fdf4', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                      <button onClick={submitRating} style={{ flex:1, padding:'10px', borderRadius:'8px', border:'none', background:'#22c55e', color:'white', fontWeight:600, cursor:'pointer' }}>Submit</button>
                      </div>
                    </div>
                    </div>
                  </div>
                  )}

                  {/* MESSAGE MODAL */}
      {messageModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}} onClick={()=>setMessageModal(null)}>
          <div style={{ background:'white', borderRadius:'12px', padding:'16px', width:'100%', maxWidth:'480px' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <h3>Message {messageModal.farmerId?.fullName}</h3>
              <button onClick={()=>setMessageModal(null)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24}/></button>
            </div>
            <div style={{ background:'#f0fdf4', padding:'8px', borderRadius:'8px', marginBottom:'8px' }}>
              <p style={{ margin:0, fontWeight:600 }}>{messageModal.listingId?.title}</p>
              <small>Order #{messageModal._id.substring(0,8)}</small>
            </div>
            <textarea placeholder="Type your message..." value={messageText} onChange={e=>setMessageText(e.target.value)} style={{ width:'100%', padding:'8px', borderRadius:'8px', border:'1px solid #d1fae5', resize:'vertical', minHeight:'100px', marginBottom:'12px' }}/>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=>setMessageModal(null)} style={{ flex:1, padding:'8px', borderRadius:'8px', border:'1px solid #d1fae5', background:'#f0fdf4', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={async ()=>{
                if(!messageText.trim()){ toast.warn("Type a message"); return; }
                try {
                  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
                  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                  const res = await fetch(getApiUrl('/messages/send'), {
                    method:'POST',
                    headers: authHeaders(token, 'application/json'),
                    body:JSON.stringify({ senderId:userId, senderRole:'user', receiverId:messageModal.farmerId._id, receiverRole:'user', orderId:messageModal._id, content:messageText })
                  });
                  const data = await parseFetchResponse(res);
                  if(res.ok){ toast.success(`Message sent to ${messageModal.farmerId.fullName}`); setMessageModal(null); setMessageText(''); }
                  else toast.error(data?.message||data||"Failed");
                } catch(err){ console.error(err?.message || err); toast.error("Error sending message"); }
              }} style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', background:'#22c55e', color:'white', fontWeight:600, cursor:'pointer' }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function buttonStyle(bg='#fff', color='#fff', borderColor=null){
    return {
      flex:1,
      padding:'8px 12px',
      background:bg,
      color:color,
      border:borderColor? `1px solid ${borderColor}`:'none',
      borderRadius:'8px',
      fontWeight:600,
      cursor:'pointer'
    };
  }
}
