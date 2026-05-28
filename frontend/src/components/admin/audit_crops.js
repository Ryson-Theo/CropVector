import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchOnce, clearCachedData } from '../../utils/requestCache';
import '../../styles/fi-recommendation-audit.css';

const API_URL = 'http://localhost:5000/api/auth/admin/crops';

const AuditCrops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchCrops(); }, []);

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const data = await fetchOnce('admin/crops', async () => {
        const resp = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        return resp.data;
      }, 30 * 1000);
      setCrops(data.crops || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const saveAll = async () => {
    try {
      await axios.put(API_URL, { crops }, { headers: { Authorization: `Bearer ${token}` } });
      setEditingIndex(null);
      clearCachedData('admin/crops');
      fetchCrops();
      alert('All changes saved!');
    } catch (err) { console.error(err); }
  };

  const addCrop = () => {
    const newCrop = { 
      name: 'New Crop', 
      minPH: 6, 
      optimalPH: 6.5, 
      waterNeeds: 500, 
      requiredN: 50, 
      baseYield: 1.0, 
      marketPrice: 200,
      suitableSoil: ["loam"],
      sensitiveToFrost: false,
      sensitiveToHeat: false
    };
    const updated = [...crops, newCrop];
    setCrops(updated);
    setEditingIndex(updated.length - 1);
  };

  const deleteCrop = async (idx) => {
    if (!window.confirm('Delete this crop?')) return;
    try {
      await axios.delete(`${API_URL}/${idx}`, { headers: { Authorization: `Bearer ${token}` } });
      clearCachedData('admin/crops');
      fetchCrops();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="farmer-inventory-container">
      <div className="fi-header">
        <div>
          <h1>Crop Audit</h1>
          <p className="fi-stats">Manage crop standards used by the recommendation engine</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="fi-btn fi-btn-primary" onClick={addCrop}>Add Crop</button>
          <button className="fi-btn fi-btn-secondary" onClick={saveAll}>Save All</button>
        </div>
      </div>

      <div className="fi-table-responsive">
        {loading && <div className="fi-loading">Loading…</div>}

        {!loading && crops.length === 0 && (
          <div className="fi-empty-state"><h3>No crops found</h3><p>Use "Add Crop" to add new crop standards.</p></div>
        )}

        {!loading && crops.length > 0 && (
          <table className="fi-table">
            <thead>
              <tr>
                <th>Name</th><th>minPH</th><th>optPH</th><th>waterNeeds</th><th>requiredN</th><th>baseYield</th><th>price</th><th>Soil Types</th><th>Frost/Heat Sensitive</th><th></th>
              </tr>
            </thead>
            <tbody>
              {crops.map((c, i) => (
                <tr key={i}>
                  <td>{editingIndex === i ? <input value={crops[i].name} onChange={e => { const s=[...crops]; s[i].name=e.target.value; setCrops(s); }} /> : c.name}</td>
                  <td>{editingIndex === i ? <input value={crops[i].minPH} onChange={e => { const s=[...crops]; s[i].minPH=e.target.value; setCrops(s); }} /> : c.minPH}</td>
                  <td>{editingIndex === i ? <input value={crops[i].optimalPH} onChange={e => { const s=[...crops]; s[i].optimalPH=e.target.value; setCrops(s); }} /> : c.optimalPH}</td>
                  <td>{editingIndex === i ? <input value={crops[i].waterNeeds} onChange={e => { const s=[...crops]; s[i].waterNeeds=e.target.value; setCrops(s); }} /> : c.waterNeeds}</td>
                  <td>{editingIndex === i ? <input value={crops[i].requiredN} onChange={e => { const s=[...crops]; s[i].requiredN=e.target.value; setCrops(s); }} /> : c.requiredN}</td>
                  <td>{editingIndex === i ? <input value={crops[i].baseYield} onChange={e => { const s=[...crops]; s[i].baseYield=e.target.value; setCrops(s); }} /> : c.baseYield}</td>
                  <td>{editingIndex === i ? <input value={crops[i].marketPrice} onChange={e => { const s=[...crops]; s[i].marketPrice=e.target.value; setCrops(s); }} /> : c.marketPrice}</td>
                  <td>{editingIndex === i ? <input value={(crops[i].suitableSoil || []).join(', ')} onChange={e => { const s=[...crops]; s[i].suitableSoil=e.target.value.split(',').map(t=>t.trim()); setCrops(s); }} /> : (c.suitableSoil || []).join(', ')}</td>
                  <td>
                    {editingIndex === i ? (
                      <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                        <input type="checkbox" checked={!!crops[i].sensitiveToFrost} onChange={e => { const s=[...crops]; s[i].sensitiveToFrost=e.target.checked; setCrops(s); }} /> F
                        <input type="checkbox" checked={!!crops[i].sensitiveToHeat} onChange={e => { const s=[...crops]; s[i].sensitiveToHeat=e.target.checked; setCrops(s); }} /> H
                      </div>
                    ) : `${c.sensitiveToFrost ? 'F' : ''}${c.sensitiveToHeat ? 'H' : ''}`}
                  </td>
                  <td>
                    {editingIndex === i ? (
                      <>
                        <button className="fi-btn fi-btn-primary" onClick={() => saveAll()}>Save</button>
                        <button className="fi-btn fi-btn-secondary" onClick={() => setEditingIndex(null)} style={{ marginLeft: 8 }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="fi-btn fi-btn-secondary" onClick={() => setEditingIndex(i)}>Edit</button>
                        <button className="fi-btn fi-btn-secondary" onClick={() => deleteCrop(i)} style={{ marginLeft: 8 }}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditCrops;
