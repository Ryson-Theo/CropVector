import React, { useState } from 'react';

const StepSoil = ({ onNext, onBack, initial = {} }) => {
  const [pH, setPH] = useState(initial.pH || 6.0);
  const [N, setN] = useState(initial.N || 0);
  const [P, setP] = useState(initial.P || 0);
  const [K, setK] = useState(initial.K || 0);
  const [soilTexture, setSoilTexture] = useState(initial.soilTexture || 'loam');
  const [irrigation, setIrrigation] = useState(initial.irrigation || 'None');

  return (
    <div className="card" style={{ maxWidth: 920 }}>
      <h2 style={{ marginTop: 0 }}>Soil & Resources</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>pH</label>
          <input type="number" value={pH} step="0.1" onChange={e => setPH(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>N (kg/ha)</label>
          <input type="number" value={N} onChange={e => setN(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>P (kg/ha)</label>
          <input type="number" value={P} onChange={e => setP(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>K (kg/ha)</label>
          <input type="number" value={K} onChange={e => setK(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Soil Type</label>
          <select value={soilTexture} onChange={e => setSoilTexture(e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option value="sandy">Sandy</option>
            <option value="loam">Loam</option>
            <option value="clay">Clay</option>
            <option value="sandy loam">Sandy Loam</option>
            <option value="silty">Silty</option>
            <option value="rocky">Rocky</option>
            <option value="silt">Silt</option>
          </select>
        </div>
        <div>
          <label>Irrigation</label>
          <select value={irrigation} onChange={e => setIrrigation(e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option>None</option>
            <option>Drip</option>
            <option>Sprinkler</option>
            <option>Rain-fed</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="action-btn" onClick={onBack}>Back</button>
          <button className="action-btn" onClick={() => onNext({ pH, N, P, K, soilTexture, irrigation })}>Analyze</button>
        </div>
      </div>
    </div>
  );
};

export default StepSoil;
