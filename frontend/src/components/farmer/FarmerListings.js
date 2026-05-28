import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function FarmerListings(){
  const [listings, setListings] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || '';

  const fetchListings = () => {
    fetch(`${API_URL}/api/marketplace/listings`)
      .then(r => r.json())
      .then(data => setListings(data.listings || []))
      .catch(console.error);
  };

  useEffect(()=>{ fetchListings(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('title', title);
    form.append('price', price);
    form.append('unit', unit);
    form.append('quantity', quantity);
    form.append('category', category);
    // fake farmerId for now — in production use auth
    form.append('farmerId', sessionStorage.getItem('userId') || '');
    for (let i=0;i<images.length;i++) form.append('images', images[i]);

    const token = sessionStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/marketplace/listings`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    });
    const data = await res.json();
    if (res.ok) {
      setTitle(''); setPrice(''); setQuantity(''); setCategory(''); setImages([]);
      fetchListings();
    } else {
      toast.error(data.error || data.message || 'Failed');
    }
  };

  const handleFile = (e) => setImages([...e.target.files]);

  return (
    <div className="page-fade-in">
      <h2>My Listings</h2>
      <form onSubmit={handleCreate} className="listing-form">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" required />
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" required />
        <input value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Quantity" />
        <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" />
        <select value={unit} onChange={e=>setUnit(e.target.value)}>
          <option value="kg">kg</option>
          <option value="quintal">quintal</option>
          <option value="ton">ton</option>
        </select>
        <input type="file" multiple accept="image/*" onChange={handleFile} />
        <button type="submit">Create Listing</button>
      </form>

      <div className="listings-grid">
        {listings.map(l => (
          <div key={l._id} className="modern-card">
            <img src={l.images && l.images[0] ? l.images[0] : 'https://via.placeholder.com/300'} alt={l.title} />
            <h4>{l.title}</h4>
            <div>₹{l.price}/{l.unit}</div>
            <div>{l.quantity} available</div>
              <div className="listing-actions">
                <button onClick={async()=>{
                  const token = sessionStorage.getItem('token');
                  const res = await fetch(`${API_URL}/api/marketplace/listings/${l._id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  if (res.ok) fetchListings(); else toast.error('Delete failed');
                }}>Delete</button>
                <button onClick={async()=>{
                  const newPrice = prompt('New price', l.price);
                  if (!newPrice) return;
                  const token = sessionStorage.getItem('token');
                  const data = { price: newPrice };
                  const res = await fetch(`${API_URL}/api/marketplace/listings/${l._id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify(data) });
                  if (res.ok) fetchListings(); else toast.error('Update failed');
                }}>Edit</button>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
