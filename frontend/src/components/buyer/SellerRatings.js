import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Trash2, User, Package } from 'lucide-react';
import { toast } from 'react-toastify';

let cachedSellerRatings = null;
let sellerRatingsPromise = null;

export default function SellerRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getApiUrl = (endpoint) => {
    const baseUrl = API_URL.includes('/api') ? API_URL : `${API_URL}/api`;
    return `${baseUrl}${endpoint}`;
  };

  useEffect(() => {
    fetchSellerRatings();
  }, []);

  const fetchSellerRatings = async () => {
    if (cachedSellerRatings) {
      setRatings(cachedSellerRatings);
      setLoading(false);
      return;
    }
    if (sellerRatingsPromise) {
      const cached = await sellerRatingsPromise;
      if (cached) setRatings(cached);
      setLoading(false);
      return;
    }

    const promise = (async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

        if (!userId) return [];

        const res = await fetch(getApiUrl(`/marketplace/reviews?reviewerId=${userId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const data = await res.json();
          return data.reviews || [];
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
        toast.error('Failed to load ratings');
      }
      return [];
    })();

    sellerRatingsPromise = promise;
    try {
      const reviews = await promise;
      cachedSellerRatings = reviews;
      setRatings(reviews);
    } finally {
      sellerRatingsPromise = null;
      setLoading(false);
    }
  };

  const deleteRating = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(getApiUrl(`/marketplace/reviews/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = ratings.filter(r => r._id !== id);
        setRatings(updated);
        if (cachedSellerRatings) cachedSellerRatings = updated;
        toast.success('Review deleted');
      } else {
        toast.error('Failed to delete review');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting review');
    }
  };

  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
    : 0;

  if (loading) return <div className="page-fade-in" style={{ padding: '20px' }}><p>Loading seller ratings…</p></div>;

  return (
    <div className="page-fade-in" style={{ padding: '20px', background: '#f8fdf5', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#166534' }}>My Reviews</h2>
        <p style={{ color: '#4b5563', marginTop: '4px' }}>Manage the feedback you've given to farmers</p>
      </div>

      {/* SUMMARY STATS */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Star size={24} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>{averageRating}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, fontWeight: 600 }}>Average Rating Given</p>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#166534' }}>{ratings.length}</div>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, fontWeight: 600 }}>Total Reviews</p>
        </div>
      </div>

      {/* RATINGS LIST */}
      <div>
        <h3 style={{ marginBottom: '16px', color: '#166534', fontSize: '1.2rem' }}>Review History</h3>
        {ratings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <TrendingUp size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#6b7280', fontWeight: 500 }}>No ratings yet</p>
            <small style={{ color: '#9ca3af' }}>Your reviews for farmers will appear here</small>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ratings.map(rating => (
              <div key={rating._id} style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0fdf4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <User size={16} color="#166534" />
                      <span style={{ fontWeight: 700, color: '#166534', fontSize: '1.05rem' }}>
                        {rating.subjectId?.fullName || 'Unknown Farmer'}
                      </span>
                    </div>
                    {rating.listingId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '0.9rem' }}>
                        <Package size={14} />
                        <span>{rating.listingId?.title || 'Product'}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} color={i < rating.rating ? '#f59e0b' : '#e5e7eb'} fill={i < rating.rating ? '#f59e0b' : 'none'} />
                    ))}
                    </div>
                    <small style={{ color: '#9ca3af' }}>{new Date(rating.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
                
                {rating.comment && (
                  <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: '1.5', fontStyle: 'italic' }}>"{rating.comment}"</p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => deleteRating(rating._id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', 
                      padding: '6px 12px', borderRadius: '6px', 
                      border: '1px solid #fee2e2', background: '#fff', 
                      color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, 
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const statCardStyle = {
  padding: '24px',
  background: 'white',
  borderRadius: '12px',
  textAlign: 'center',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e7eb'
};