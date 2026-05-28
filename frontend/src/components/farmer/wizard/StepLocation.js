import React, { useState } from 'react';

const StepLocation = ({ onNext, initial = {} }) => {
  const [latitude, setLatitude] = useState(initial.latitude || '');
  const [longitude, setLongitude] = useState(initial.longitude || '');
  const [landSize, setLandSize] = useState(initial.landSize || 1);
  const [landUnit, setLandUnit] = useState(initial.landUnit || 'ha');

  const useGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    });
  };

  return (
    <div className="card" style={{ maxWidth: 920 }}>
      <h2 style={{ marginTop: 0 }}>Location & Land</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>Latitude</label>
          <input value={latitude} onChange={e => setLatitude(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Longitude</label>
          <input value={longitude} onChange={e => setLongitude(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Land Size</label>
          <input type="number" value={landSize} onChange={e => setLandSize(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Unit</label>
          <select value={landUnit} onChange={e => setLandUnit(e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option>ha</option>
            <option>ac</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="action-btn" onClick={useGeo}>Use my location</button>
          <button className="action-btn" onClick={() => onNext({ latitude, longitude, landSize, landUnit })}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default StepLocation;
