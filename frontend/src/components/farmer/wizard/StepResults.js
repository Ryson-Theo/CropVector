import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import '../../../styles/fi-recommendation-audit.css';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StepResults = ({ input, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [climate, setClimate] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [expandedCrop, setExpandedCrop] = useState(null);

  useEffect(() => {
    const submit = async () => {
      setLoading(true);
      setError(null);
      setSessionId(null);
      try {
        if (!input || !input.latitude || !input.longitude) {
          setError('Location missing — please provide latitude & longitude or use geolocation.');
          setLoading(false);
          return;
        }
        
        // Convert irrigation string to hasIrrigation boolean
        const payload = {
          ...input,
          hasIrrigation: input.irrigation && input.irrigation !== 'None',
          // Convert string numbers to actual numbers
          pH: Number(input.pH),
          N: Number(input.N),
          P: Number(input.P),
          K: Number(input.K)
        };
        
        const resp = await axios.post('http://localhost:5000/api/recommend', payload);
        setResults(resp.data.results || []);
        setClimate(resp.data.climate || null);
        setSessionId(resp.data.sessionId || null);
        setDataSource(resp.data.dataSource || 'manual');
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.error || err.message || 'Request failed');
      } finally {
        setLoading(false);
      }
    };
    submit();
  }, [input]);

  const top = results.slice(0, 6);

  const chartData = {
    labels: top.map(r => r.name),
    datasets: [
      { 
        label: 'Suitability Score (%)', 
        data: top.map(r => r.suitabilityScore), 
        backgroundColor: 'rgba(34,197,94,0.6)' 
      },
      { 
        label: 'Nitrogen Gap (kg)', 
        data: top.map(r => r.nitrogenGapKg), 
        backgroundColor: 'rgba(59,130,246,0.6)' 
      }
    ]
  };

  const renderCropDetail = (crop) => (
    <div key={crop.name} className="fi-detail-card" style={{ marginBottom: 12 }}>
      <div 
        onClick={() => setExpandedCrop(expandedCrop === crop.name ? null : crop.name)}
        style={{ cursor: 'pointer', padding: '12px', borderBottom: '1px solid #e5e7eb' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{crop.name}</strong>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Score: {crop.suitabilityScore}% • Suitability: {crop.suitabilityLevel}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, color: '#10b981' }}>₹{crop.expectedProfit}/ha</div>
            <div style={{ fontSize: '0.85rem' }}>Adjusted Yield: {crop.adjustedYield}t</div>
          </div>
        </div>
      </div>

      {expandedCrop === crop.name && (
        <div style={{ padding: '12px', backgroundColor: '#f9fafb' }}>
          {/* Confidence & Data Source */}
          <div style={{ marginBottom: 12, padding: '8px', backgroundColor: '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: '4px' }}>
            <strong style={{ color: '#1e40af' }}>Data Quality</strong>
            <div style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>
              Confidence: <strong>{crop.confidence}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1e3a8a', marginTop: '4px' }}>
              {crop.dataSourceInfo}
            </div>
          </div>

          {/* Yield & Profitability */}
          <div style={{ marginBottom: 12 }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Yield & Profitability</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Base Yield</div>
                <div style={{ fontWeight: 600 }}>{crop.baseYield} t/ha</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Adjusted Yield</div>
                <div style={{ fontWeight: 600 }}>{crop.adjustedYield} t/ha ({crop.yieldMultiplier}%)</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Market Price</div>
                <div style={{ fontWeight: 600 }}>₹{crop.marketPrice}/q</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Expected Profit</div>
                <div style={{ fontWeight: 600, color: '#10b981' }}>₹{crop.expectedProfit}/ha</div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{ marginBottom: 12 }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Cost Breakdown</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#6b7280' }}>Nitrogen Gap:</span> {crop.nitrogenGapKg} kg @ ₹6/kg
              </div>
              <div>
                <strong style={{ color: '#059669' }}>₹{crop.nitrogenGapCost}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Seed Cost:</span> ₹{crop.seedCost}/ha
              </div>
              <div>
                <strong>₹{crop.seedCost}</strong>
              </div>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '4px' }}>
                <strong>Total Cost:</strong>
              </div>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '4px' }}>
                <strong>₹{crop.totalCost}</strong>
              </div>
            </div>
          </div>

          {/* Water & Soil */}
          <div style={{ marginBottom: 12 }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Water & Soil Requirements</h5>
            <div style={{ fontSize: '0.9rem' }}>
              <div>
                <strong>pH Range:</strong> {crop.minPH} – {crop.optimalPH}
                {crop.soilTextureMatch ? (
                  <span style={{ color: '#10b981', marginLeft: '8px' }}>✓ Soil match</span>
                ) : (
                  <span style={{ color: '#ef4444', marginLeft: '8px' }}>✗ Soil mismatch</span>
                )}
              </div>
              <div>
                <strong>Water Needs:</strong> {crop.waterNeedsPerYear}mm vs {crop.avgRainfallPerYear}mm received
                {crop.irrigationRequired && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⚠ Irrigation needed</span>}
              </div>
              <div>
                <strong>Suitable Soils:</strong> {crop.suitableSoilTypes.join(', ')}
              </div>
            </div>
          </div>

          {/* Climate Risks */}
          {(crop.frostRisk || crop.heatwaveRisk) && (
            <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderLeft: '3px solid #f59e0b', borderRadius: '4px', marginBottom: 12 }}>
              <strong style={{ color: '#92400e' }}>⚠ Climate Risks</strong>
              <div style={{ fontSize: '0.9rem', color: '#78350f', marginTop: '4px' }}>
                {crop.frostRisk && <div>• Frost risk: temperatures drop to {climate?.tempMin}°C</div>}
                {crop.heatwaveRisk && <div>• Heatwave risk: temperatures reach {climate?.tempMax}°C</div>}
              </div>
            </div>
          )}

          {/* Pest & Disease Risk */}
          {crop.pestRisk && (
            <div style={{ 
              marginBottom: 12, 
              padding: '8px', 
              backgroundColor: crop.pestRisk.riskScore > 70 ? '#fee2e2' : crop.pestRisk.riskScore > 40 ? '#fef3c7' : '#f0fdf4',
              borderLeft: `3px solid ${crop.pestRisk.riskScore > 70 ? '#ef4444' : crop.pestRisk.riskScore > 40 ? '#f59e0b' : '#10b981'}`,
              borderRadius: '4px'
            }}>
              <strong style={{ color: crop.pestRisk.riskScore > 70 ? '#991b1b' : crop.pestRisk.riskScore > 40 ? '#92400e' : '#166534' }}>
                 Pest & Disease Risk: {crop.pestRisk.overallRisk} ({crop.pestRisk.riskScore}%)
              </strong>
              {crop.pestRisk.diseases && crop.pestRisk.diseases.length > 0 && (
                <div style={{ fontSize: '0.85rem', marginTop: '6px', color: '#4b5563' }}>
                  <div style={{ marginBottom: 6 }}><strong>⚠️ Potential Diseases:</strong></div>
                  {crop.pestRisk.diseases.map((disease, idx) => (
                    <div key={idx} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                      • <strong>{disease.name}</strong> ({disease.severity}): Triggers when {disease.condition}
                    </div>
                  ))}
                </div>
              )}
              {crop.pestRisk.recommendations && crop.pestRisk.recommendations.length > 0 && (
                <div style={{ fontSize: '0.85rem', marginTop: '6px', color: '#4b5563' }}>
                  <div style={{ marginBottom: 6 }}><strong>✅ Prevention Tips:</strong></div>
                  {crop.pestRisk.recommendations.map((rec, idx) => (
                    <div key={idx} style={{ marginLeft: '12px', marginBottom: '2px' }}>• {rec}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Analysis Details</h5>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem' }}>
              {crop.reasons.map((reason, idx) => (
                <li key={idx} style={{ marginBottom: '4px', color: '#4b5563' }}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="farmer-inventory-container">
      <div className="fi-header">
        <div>
          <h1>Crop Recommendations</h1>
          <p>Site-specific analysis with cost, yield, and profit projections</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="fi-btn fi-btn-secondary" onClick={onBack}>Back</button>
          {sessionId && (
            <button 
              className="fi-btn fi-btn-primary" 
              onClick={() => window.open(`http://localhost:5000/api/export/pdf/${sessionId}`, '_blank')}
              title="Download detailed report as PDF"
            >
               Export PDF
            </button>
          )}
          <button className="fi-btn fi-btn-primary" onClick={() => window.location.reload()}>New Analysis</button>
        </div>
      </div>

      <div style={{ maxWidth: 920 }}>
        {loading && <div className="fi-loading"> Analyzing your site with Kaegro soil data and Open-Meteo climate…</div>}
        {error && <div style={{ color: 'crimson', marginBottom: 8, padding: '8px', backgroundColor: '#fee', borderRadius: '4px' }}>❌ {error}</div>}

        {/* Session & Data Quality Summary */}
        {sessionId && (
          <div style={{ marginBottom: 12, padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '8px' }}>
              <strong>✓ Analysis saved</strong> – Session ID: <code style={{ backgroundColor: '#fff', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>{sessionId}</code>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              <strong>Data Quality:</strong> {dataSource === 'kaegro' 
                ? 'Medium (Soil data auto-filled via Kaegro satellite)' 
                : 'High (Manual soil input)'}
            </div>
          </div>
        )}

        {/* Climate Summary */}
        {climate && (
          <div style={{ marginBottom: 12 }}>
            <div className="fi-card">
              <h4 style={{ margin: '0 0 12px 0' }}>📍 Climate Profile</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Avg Yearly Rainfall</div>
                  <div style={{ fontWeight: 600 }}>{climate.avgRainfall} mm</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Temperature Range</div>
                  <div style={{ fontWeight: 600 }}>{climate.tempMin}°C to {climate.tempMax}°C</div>
                </div>
                {climate.hasFrost && (
                  <div style={{ color: '#ef4444' }}>
                    <div style={{ fontSize: '0.85rem' }}>❄️ Frost Risk</div>
                    <div>Yes</div>
                  </div>
                )}
                {climate.hasHeatwave && (
                  <div style={{ color: '#f59e0b' }}>
                    <div style={{ fontSize: '0.85rem' }}>🌡️ Heatwave Risk</div>
                    <div>Yes</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Chart */}
        <div style={{ marginBottom: 12 }} className="fi-card">
          <h4 style={{ margin: '0 0 12px 0' }}> Top Crops Comparison</h4>
          <Bar data={chartData} />
        </div>

        {/* Detailed Crop Cards */}
        <div style={{ marginBottom: 12 }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Detailed Analysis (Click to expand)</h4>
          {top.length === 0 ? (
            <div className="fi-empty-state">No suitable crops found for the provided inputs. Please review your soil pH, water availability, or irrigation setup.</div>
          ) : (
            top.map(crop => renderCropDetail(crop))
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="fi-btn fi-btn-secondary" onClick={onBack}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default StepResults;
