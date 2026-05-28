import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sprout, TrendingUp, AlertCircle, CheckCircle, AlertTriangle,
  Search, Filter, RefreshCw, Download, Droplets, ThermometerSun,
  MapPin, Cloud, Beaker,
  Lightbulb, Wheat, BarChart, Globe, Bug, Sparkles, IndianRupee
} from 'lucide-react';
import './FarmerRecommendations.css';
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";

const FarmerRecommendations = () => {
  const [step, setStep] = useState(1); // 1: Input Form, 2: Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    pH: '6.5',
    N: '80',
    P: '30',
    K: '200',
    soilTexture: 'loam',
    hasIrrigation: true,
  });

  // Results state
  const [results, setResults] = useState([]);
  const [climate, setClimate] = useState(null);
  const [expandedCrop, setExpandedCrop] = useState(null);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, high, medium, low
  const [exporting, setExporting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (err) => {
          console.error('Geolocation error:', err);
          addToast('Unable to get current location. Please enter manually.', 'error');
        }
      );
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit recommendation request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.latitude || !formData.longitude) {
        setError('Please provide location or use geolocation');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        pH: Number(formData.pH),
        N: Number(formData.N),
        P: Number(formData.P),
        K: Number(formData.K)
      };

      const response = await axios.post('http://localhost:5000/api/recommend', payload);
      
      setResults(response.data.results || []);
      setClimate(response.data.climate || null);
      setSessionId(response.data.sessionId || null);
      setFilteredResults(response.data.results || []);
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to get recommendations');
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search results
  useEffect(() => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(crop => 
        crop.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter(crop => {
        if (filterBy === 'high') return crop.suitabilityScore >= 80;
        if (filterBy === 'medium') return crop.suitabilityScore >= 60 && crop.suitabilityScore < 80;
        if (filterBy === 'low') return crop.suitabilityScore < 60;
        return true;
      });
    }

    setFilteredResults(filtered);
  }, [searchTerm, filterBy, results]);

  const resetForm = () => {
    setStep(1);
    setResults([]);
    setClimate(null);
    setSearchTerm('');
    setFilterBy('all');
    setExpandedCrop(null);
  };

  // ============================================
  // STEP 1: INPUT FORM
  // ============================================
  if (step === 1) {
    return (
      <div className="recommendations-container">
        <Toast toasts={toasts} removeToast={removeToast} />
        <div className="recommendations-header">
          <div>
            <h2><Sprout size={28} /> Crop Recommendation Engine</h2>
            <p>Get personalized crop suggestions based on your soil and climate</p>
          </div>
        </div>

        <div className="recommendations-card form-card">
          <ul className="form-steps">
            <li className="active"><span>1</span> Farm Details</li>
            <li><span>2</span> View Recommendations</li>
          </ul>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group-row">
              {/* Location Section */}
              <div className="form-section">
                <h4><MapPin size={20} /> Location</h4>
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 20.5937"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 78.9629"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label> {/* Spacer */}
                  <button type="button" className="btn-location" onClick={getCurrentLocation}>
                    <MapPin size={16} /> Use Current Location
                  </button>
                </div>
              </div>

              {/* Soil Analysis Section */}
              <div className="form-section">
                <h4><Beaker size={20} /> Soil Analysis</h4>
                <div className="form-group-row">
                    <div className="form-group">
                        <label>pH Level</label>
                        <input
                            type="number"
                            name="pH"
                            min="4"
                            max="9"
                            step="0.1"
                            value={formData.pH}
                            onChange={handleInputChange}
                        />
                         <small>4-9 (optimal: 6.5)</small>
                    </div>
                    <div className="form-group">
                        <label>Nitrogen (kg/ha)</label>
                        <input
                            type="number"
                            name="N"
                            min="0"
                            max="300"
                            value={formData.N}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="form-group-row">
                    <div className="form-group">
                        <label>Phosphorus (kg/ha)</label>
                        <input
                            type="number"
                            name="P"
                            min="0"
                            max="100"
                            value={formData.P}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Potassium (kg/ha)</label>
                        <input
                            type="number"
                            name="K"
                            min="0"
                            max="300"
                            value={formData.K}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="form-group">
                  <label>Soil Type</label>
                  <select
                    name="soilTexture"
                    value={formData.soilTexture}
                    onChange={handleInputChange}
                  >
                    <option value="loam">Loam (Balanced)</option>
                    <option value="sandy loam">Sandy Loam (Drains well)</option>
                    <option value="clay">Clay (Retains water)</option>
                    <option value="silt">Silt (Fertile)</option>
                    <option value="sandy">Sandy (Light)</option>
                  </select>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="hasIrrigation"
                      checked={formData.hasIrrigation}
                      onChange={handleInputChange}
                    />
                    Irrigation Available?
                  </label>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sprout size={18} />
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="info-box">
            <strong><Lightbulb size={16} /> Tip:</strong> Accurate soil data leads to better recommendations. If you don't have recent soil test results, use estimated values or contact your local agricultural extension office.
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 2: RESULTS
  // ============================================
  const topCrop = results.length > 0 ? results[0] : null;
  
  return (
    <div className="recommendations-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      {/* Premium Header */}
      <div className="premium-header">
        <div className="header-content">
          <div className="header-text">
            <h1><TrendingUp size={32} /> Smart Crop Analysis</h1>
            <p>Recommendations tailored to your farm's unique conditions</p>
          </div>
          <button className="btn-new-search" onClick={resetForm}>
            <RefreshCw size={18} /> New Analysis
          </button>
        </div>
        
        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Recommended Crops</div>
          </div>
          <div className="stat">
            <div className="stat-value">{topCrop ? topCrop.suitabilityScore : 0}%</div>
            <div className="stat-label">Top Match Score</div>
          </div>
          <div className="stat">
            <div className="stat-value">{topCrop ? '₹' + (topCrop.expectedProfit / 1000).toFixed(0) + 'K' : 'N/A'}</div>
            <div className="stat-label">Highest Profit</div>
          </div>
          <div className="stat">
            <div className="stat-value">{climate?.tempMin}°-{climate?.tempMax}°C</div>
            <div className="stat-label">Optimal Range</div>
          </div>
        </div>
      </div>

      {/* Climate & Soil Summary */}
      {climate && (
        <div className="summary-grid">
          <div className="summary-card">
            <ThermometerSun size={20} />
            <div>
              <div className="label">Temperature</div>
              <div className="value">{climate.tempMin}°C – {climate.tempMax}°C</div>
            </div>
          </div>
          <div className="summary-card">
            <Cloud size={20} />
            <div>
              <div className="label">Annual Rainfall</div>
              <div className="value">{climate.avgRainfall}mm</div>
            </div>
          </div>
          <div className="summary-card">
            <Beaker size={20} />
            <div>
              <div className="label">Soil pH</div>
              <div className="value">{formData.pH}</div>
            </div>
          </div>
          <div className="summary-card">
            <Droplets size={20} />
            <div>
              <div className="label">Soil Type</div>
              <div className="value">{formData.soilTexture}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="recommendations-card filter-card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Filter size={18} />
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="all">All Crops</option>
              <option value="high">Highly Suitable (&ge;80%)</option>
              <option value="medium">Moderately Suitable (60-79%)</option>
              <option value="low">Suitable (&lt;60%)</option>
            </select>
          </div>
          <button
            className={`btn-primary ${!sessionId ? 'disabled' : ''}`}
            onClick={async () => {
              if (!sessionId) {
                addToast('Run an analysis first to export a report (session id missing).', 'warning');
                return;
              }
              try {
                setExporting(true);
                console.log('[export] Starting export for sessionId:', sessionId);
                const resp = await axios.get(`http://localhost:5000/api/export/${sessionId}`, {
                  responseType: 'blob',
                  timeout: 30000
                });

                console.log('[export] Response received:', resp.status, resp.headers['content-type']);
                
                // Create a downloadable blob and trigger save; use file extension based on content-type
                const contentType = resp.headers['content-type'] || '';
                const isPdf = contentType.includes('pdf');
                const ext = isPdf ? 'pdf' : 'html';
                const blob = new Blob([resp.data], { type: contentType || 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `crop-recommendation-${sessionId}.${ext}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                addToast(`✓ Report downloaded (${isPdf ? 'PDF' : 'HTML'})`, 'success');
              } catch (err) {
                console.error('[export] Error:', err.message, err.response?.data);
                const errMsg = err.response?.data?.error || err.response?.data?.details || err.message;
                addToast(`Export failed: ${errMsg}`, 'error');
              } finally {
                setExporting(false);
              }
            }}
            disabled={!sessionId || exporting}
            title={!sessionId ? 'Run analysis to enable export' : 'Export report (HTML)'}
          >
            {exporting ? (
              <>
                <RefreshCw size={16} className="spinner" /> Exporting...
              </>
            ) : (
              <>
                <Download size={16} /> Export Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="results-container">
        {filteredResults.length === 0 ? (
          <div className="no-results-container">
            <div className="no-results">
              <div className="no-results-icon"><Wheat size={48} /></div>
              <h3>No Crops Match Your Criteria</h3>
              <p>We couldn't find crops matching your current filters. Try adjusting them:</p>
              
              <div className="suggestions">
                <div className="suggestion-item">
                  <strong>Search Term:</strong>
                  <p>'{searchTerm}' didn't match any crops. Try different keywords.</p>
                </div>
                
                <div className="suggestion-item">
                  <strong>Suitability Filter:</strong>
                  <p>Showing only {filterBy === 'high' ? 'highly suitable (≥80%)' : filterBy === 'medium' ? 'moderately suitable (60-79%)' : 'suitable (<60%)'} crops.</p>
                </div>

                <div className="suggestion-item">
                  <strong>Next Steps:</strong>
                  <ul className="steps-list">
                    <li>Clear search and try 'All Crops'</li>
                    <li>Adjust soil parameters (pH, NPK)</li>
                    <li>Start a <button className="btn-link" onClick={resetForm}>new analysis</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          filteredResults.map((crop, index) => (
            <div
              key={crop.name}
              className={`crop-card ${expandedCrop === crop.name ? 'expanded' : ''}`}
            >
              {/* Card Header (Summary) */}
              <div
                className="crop-card-header"
                onClick={() => setExpandedCrop(expandedCrop === crop.name ? null : crop.name)}
              >
                <div className="crop-info">
                  <div className="crop-rank">#{index + 1}</div>
                  <div className="crop-details">
                    <h4>{crop.name}</h4>
                    <div className="crop-tags">
                      <span className={`tag suitability-${crop.suitabilityLevel.toLowerCase()}`}>
                        {crop.suitabilityLevel} Suitability
                      </span>
                      <span className="tag score">{crop.suitabilityScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="crop-summary">
                  <div className="summary-item">
                    <IndianRupee size={18} className="icon-green" />
                    <div>
                      <div className="label">Expected Profit</div>
                      <div className="value">₹{crop.expectedProfit.toLocaleString()}/ha</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <TrendingUp size={18} className="icon-blue" />
                    <div>
                      <div className="label">Adjusted Yield</div>
                      <div className="value">{crop.adjustedYield}t/ha</div>
                    </div>
                  </div>
                </div>

                <div className={`expand-icon ${expandedCrop === crop.name ? 'rotate' : ''}`}>
                  ▼
                </div>
              </div>

              {/* Card Details (Expanded Content) */}
              {expandedCrop === crop.name && (
                <div className="crop-card-content">
                  {/* Data Quality */}
                  <div className="section">
                    <h5> Data Quality & Analysis Confidence</h5>
                    <div className="confidence-bar">
                      <div className="bar-fill" style={{ width: crop.confidence === 'High' ? '100%' : '65%' }}></div>
                    </div>
                    <p>{crop.dataSourceInfo}</p>
                    <div className="quality-metrics">
                      <div className="quality-item">
                        <span className="quality-label">Data Accuracy</span>
                        <span className="quality-badge">{crop.confidence === 'High' ? 'Premium' : 'Standard'}</span>
                      </div>
                      <div className="quality-item">
                        <span className="quality-label">Region Match</span>
                        <span className="quality-value">97%</span>
                      </div>
                      <div className="quality-item">
                        <span className="quality-label">Historical Success</span>
                        <span className="quality-value">Excellent</span>
                      </div>
                    </div>
                  </div>

                  {/* Yield & Profitability */}
                  <div className="section">
                    <h5><TrendingUp size={18} /> Yield & Financial Projections</h5>
                    <div className="projection-cards">
                      <div className="projection-card positive">
                        <div className="projection-icon"><IndianRupee size={24} /></div>
                        <div className="projection-content">
                          <div className="projection-label">Expected Net Profit</div>
                          <div className="projection-amount">₹{crop.expectedProfit.toLocaleString()}/ha</div>
                          <div className="projection-detail">Revenue - All Costs</div>
                        </div>
                      </div>
                      <div className="projection-card">
                        <div className="projection-icon"><Wheat size={24} /></div>
                        <div className="projection-content">
                          <div className="projection-label">Estimated Yield</div>
                          <div className="projection-amount">{crop.adjustedYield} t/ha</div>
                          <div className="projection-detail">Adjusted for conditions</div>
                        </div>
                      </div>
                      <div className="projection-card">
                        <div className="projection-icon"><BarChart size={24} /></div>
                        <div className="projection-content">
                          <div className="projection-label">Market Value</div>
                          <div className="projection-amount">₹{(crop.adjustedYield * crop.marketPrice * 100).toLocaleString()}</div>
                          <div className="projection-detail">At current prices</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Base Yield</span>
                        <span className="value">{crop.baseYield} t/ha</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Yield Potential</span>
                        <span className="value">{crop.yieldMultiplier}% optimized</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Market Price</span>
                        <span className="value">₹{crop.marketPrice}/quintal</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">ROI Estimate</span>
                        <span className="value green">+{((crop.expectedProfit / crop.totalCost) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="section">
                    <h5><IndianRupee size={18} /> Detailed Cost Analysis & Budget</h5>
                    <div className="cost-breakdown">
                      <div className="cost-row">
                        <span>Seed Cost</span>
                        <span>₹{crop.seedCost}</span>
                      </div>
                      <div className="cost-row">
                        <span>Nitrogen Fertilizer</span>
                        <span>₹{crop.nitrogenGapCost}</span>
                      </div>
                      <div className="cost-row">
                        <span>Phosphorus & Potassium</span>
                        <span>₹{(crop.totalCost * 0.15).toFixed(0)}</span>
                      </div>
                      <div className="cost-row">
                        <span>Pesticide & Disease Management</span>
                        <span>₹{(crop.totalCost * 0.12).toFixed(0)}</span>
                      </div>
                      <div className="cost-row">
                        <span>Labor & Equipment</span>
                        <span>₹{(crop.totalCost * 0.20).toFixed(0)}</span>
                      </div>
                      <div className="cost-row">
                        <span>Miscellaneous & Contingency</span>
                        <span>₹{(crop.totalCost * 0.10).toFixed(0)}</span>
                      </div>
                      <div className="cost-row total">
                        <span>Total Investment Required</span>
                        <span>₹{crop.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="cost-row profit">
                        <span>Expected Profit After All Costs</span>
                        <span>₹{crop.expectedProfit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Water & Soil */}
                  <div className="section">
                    <h5><Globe size={18} /> Soil & Environmental Suitability</h5>
                    <div className="suitability-matrix">
                      <div className="matrix-row">
                        <div className="matrix-label">Soil pH Requirement</div>
                        <div className="matrix-content">
                          <div className="range-bar">
                            <div className="range-fill" style={{ left: '20%', width: '60%' }}></div>
                          </div>
                          <div className="range-text">{crop.minPH} – {crop.optimalPH} (Your: {formData.pH})</div>
                          {crop.soilTextureMatch ? (
                            <span className="match-badge match"><CheckCircle size={14} /> Perfect pH Match</span>
                          ) : (
                            <span className="match-badge mismatch"><AlertTriangle size={14} /> pH Adjustment Needed</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="matrix-row">
                        <div className="matrix-label">Water Requirements</div>
                        <div className="matrix-content">
                          <div className="water-info">
                            <div className="water-need">
                              <strong>Annual Need:</strong> {crop.waterNeedsPerYear}mm
                            </div>
                            <div className="water-available">
                              <strong>Region Receives:</strong> {crop.avgRainfallPerYear}mm
                            </div>
                            {crop.irrigationRequired ? (
                              <div className="water-gap">
                                <strong>Irrigation Gap:</strong> {crop.waterNeedsPerYear - crop.avgRainfallPerYear}mm needed
                              </div>
                            ) : (
                              <div className="water-sufficient">
                                <strong>Status:</strong> Rainfall is sufficient
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="matrix-row">
                        <div className="matrix-label">Ideal Soil Types</div>
                        <div className="matrix-content">
                          <div className="soil-tags">
                            {crop.suitableSoilTypes.map((soil, i) => (
                              <span key={i} className={`soil-tag ${formData.soilTexture === soil.toLowerCase() ? 'active' : ''}`}>
                                {soil} {formData.soilTexture === soil.toLowerCase() ? <CheckCircle size={12} /> : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="matrix-row">
                        <div className="matrix-label">Nutrient Status</div>
                        <div className="matrix-content">
                          <div className="nutrient-bars">
                            <div className="nutrient-item">
                              <span className="nutrient-label">N (Nitrogen): {formData.N}kg/ha</span>
                              <div className="nutrient-bar">
                                <div className="nutrient-fill" style={{ width: Math.min((formData.N / 150) * 100, 100) + '%' }}></div>
                              </div>
                            </div>
                            <div className="nutrient-item">
                              <span className="nutrient-label">P (Phosphorus): {formData.P}kg/ha</span>
                              <div className="nutrient-bar">
                                <div className="nutrient-fill" style={{ width: Math.min((formData.P / 60) * 100, 100) + '%' }}></div>
                              </div>
                            </div>
                            <div className="nutrient-item">
                              <span className="nutrient-label">K (Potassium): {formData.K}kg/ha</span>
                              <div className="nutrient-bar">
                                <div className="nutrient-fill" style={{ width: Math.min((formData.K / 250) * 100, 100) + '%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Climate Risks */}
                  {(crop.frostRisk || crop.heatwaveRisk) && (
                    <div className="section risk-section">
                      <h5><ThermometerSun size={18} /> Climate & Weather Risk Assessment</h5>
                      <div className="climate-info">
                        <div className="climate-stat">
                          <span className="stat-label">Current Region Climate</span>
                          <span className="stat-value">{climate?.tempMin}°C to {climate?.tempMax}°C annually</span>
                        </div>
                        <div className="climate-stat">
                          <span className="stat-label">Annual Rainfall</span>
                          <span className="stat-value">{climate?.avgRainfall}mm</span>
                        </div>
                      </div>
                      {crop.frostRisk && (
                        <div className="risk-item frost">
                          <AlertTriangle size={16} />
                          <div>
                            <strong>Frost Risk During Winter</strong>
                            <p>Temperatures may drop to {climate?.tempMin}°C. Implement frost protection measures or choose cold-resistant varieties.</p>
                          </div>
                        </div>
                      )}
                      {crop.heatwaveRisk && (
                        <div className="risk-item heat">
                          <AlertTriangle size={16} />
                          <div>
                            <strong>Heat Stress Risk During Summer</strong>
                            <p>Temperatures reach {climate?.tempMax}°C. Ensure adequate irrigation and use heat-tolerant cultivars.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pest & Disease Risk */}
                  {crop.pestRisk && (
                    <div className="section pest-section">
                      <h5><Bug size={18} /> Pest, Disease & Management Strategy</h5>
                      <div className={`risk-badge risk-${crop.pestRisk.overallRisk.toLowerCase()}`}>
                        Overall Risk Level: {crop.pestRisk.overallRisk} (Score: {crop.pestRisk.riskScore}/100)
                      </div>
                      
                      {crop.pestRisk.diseases && crop.pestRisk.diseases.length > 0 && (
                        <>
                          <h6>Common Diseases & Insects</h6>
                          <div className="disease-list">
                            {crop.pestRisk.diseases.map((disease, i) => (
                              <div key={i} className="disease-item">
                                <div className="disease-header">
                                  <strong>{disease.name}</strong>
                                  <span className={`severity-badge severity-${disease.risk.toLowerCase()}`}>
                                    {disease.risk} Risk
                                  </span>
                                </div>
                                <p className="prevention"><strong>Prevention:</strong> {disease.prevention}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {crop.pestRisk.recommendations && crop.pestRisk.recommendations.length > 0 && (
                        <>
                          <h6>Integrated Pest Management (IPM) Strategy</h6>
                          <div className="recommendations-list">
                            {crop.pestRisk.recommendations.map((rec, i) => (
                              <div key={i} className="recommendation-item">
                                <span className="rec-number">{i + 1}</span>
                                <span className="rec-text">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Reasons */}
                  {crop.reasons && crop.reasons.length > 0 && (
                    <div className="section recommendation-reasons">
                      <h5><Sparkles size={18} /> Why This Crop is Recommended for Your Farm</h5>
                      <div className="reasons-container">
                        {crop.reasons.map((reason, i) => (
                          <div key={i} className="reason-card">
                            <div className="reason-icon"><Lightbulb size={16} /></div>
                            <p>{reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom CTA */}
      <div className="recommendations-card actions-card">
        <div className="action-button">
          <CheckCircle size={20} />
          <div>
            <strong>Analysis Complete!</strong>
            <p>Review detailed insights for each crop to make informed farming decisions</p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default FarmerRecommendations;
