import React, { useState } from 'react';
import axios from 'axios';

const AddCrop = () => {
  const [crop, setCrop] = useState({ name: '', minPH: 6, optimalPH: 6.5, waterNeeds: 500, requiredN: 50, baseYield: 2, marketPrice: 200 });
  const [status, setStatus] = useState(null);

  const submit = async () => {
    try {
      await axios.post('/api/admin/crops', crop);
      setStatus('Saved');
    } catch (err) {
      console.error(err);
      setStatus('Error');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 920 }}>
      <h2>Add Crop</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="Name" value={crop.name} onChange={e => setCrop({ ...crop, name: e.target.value })} />
        <input type="number" value={crop.minPH} onChange={e => setCrop({ ...crop, minPH: e.target.value })} />
        <input type="number" value={crop.optimalPH} onChange={e => setCrop({ ...crop, optimalPH: e.target.value })} />
        <input type="number" value={crop.waterNeeds} onChange={e => setCrop({ ...crop, waterNeeds: e.target.value })} />
        <input type="number" value={crop.requiredN} onChange={e => setCrop({ ...crop, requiredN: e.target.value })} />
        <input type="number" value={crop.baseYield} onChange={e => setCrop({ ...crop, baseYield: e.target.value })} />
        <input type="number" value={crop.marketPrice} onChange={e => setCrop({ ...crop, marketPrice: e.target.value })} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="action-btn" onClick={submit}>Save Crop</button>
        {status && <span style={{ marginLeft: 8 }}>{status}</span>}
      </div>
    </div>
  );
};

export default AddCrop;
