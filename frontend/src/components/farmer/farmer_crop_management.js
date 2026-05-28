import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast, ToastContainer } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Thermometer, CloudRain, Wind, Droplets, AlertTriangle, Trash2, Eye, TrendingUp, Calendar, Search, Filter, RefreshCw } from "lucide-react";
import L from "leaflet";
import axios from "axios";

// Styles
import "leaflet/dist/leaflet.css";
import "react-toastify/dist/ReactToastify.css";
import "./farmer_crop_management.css";

// Fix Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const cropStages = ["Land Preparation", "Sowing", "Germination", "Vegetative Growth", "Flowering", "Harvest"];

const FarmerCropManagement = () => {
  const [location, setLocation] = useState([20.5937, 78.9629]);
  const alertShown = useRef(false);
  const [weatherMap, setWeatherMap] = useState({});
  const [crops, setCrops] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [activeTab, setActiveTab] = useState("crops"); // crops, diseases
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showCropDetails, setShowCropDetails] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [weatherForLocation, setWeatherForLocation] = useState(null);

  const API_BASE = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const userRole = localStorage.getItem('userRole');
  const cropsQuery = useQuery({
    queryKey: ["farmerCrops", token],
    queryFn: async () => {
      if (userRole !== 'farmer') {
        throw new Error('Access denied. Only farmers can access this page.');
      }
      const response = await axios.get(`${API_BASE}/farmer/crops`, { headers: { Authorization: `Bearer ${token}` } });
      return response.data || [];
    },
    enabled: !!token && userRole === 'farmer',
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const diseasesQuery = useQuery({
    queryKey: ["farmerDiseases", token],
    queryFn: async () => {
      if (userRole !== 'farmer') {
        throw new Error('Access denied. Only farmers can access this page.');
      }
      const response = await axios.get(`${API_BASE}/farmer/diseases`, { headers: { Authorization: `Bearer ${token}` } });
      return response.data || [];
    },
    enabled: !!token && userRole === 'farmer',
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  useEffect(() => {
    detectGPS();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        cropsQuery.refetch();
        diseasesQuery.refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cropsQuery, diseasesQuery]);

  useEffect(() => {
    if (Array.isArray(cropsQuery.data)) {
      setCrops(cropsQuery.data);
      (cropsQuery.data || []).forEach(crop => {
        if (crop.location?.coordinates?.length === 2) {
          fetchWeather(crop.location.coordinates[1], crop.location.coordinates[0], crop._id);
        }
      });
    }
  }, [cropsQuery.data]);

  useEffect(() => {
    if (Array.isArray(diseasesQuery.data)) {
      setDiseases(diseasesQuery.data);
    }
  }, [diseasesQuery.data]);

  const loadDataError = cropsQuery.error || diseasesQuery.error;
  const isLoadingData = cropsQuery.isLoading || diseasesQuery.isLoading;

  const loadData = async () => {
    await Promise.all([cropsQuery.refetch(), diseasesQuery.refetch()]);
  };

  const detectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        fetchWeather(coords[0], coords[1], 'current');
      });
    }
  };

  const fetchWeather = async (lat, lon, id) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,windspeed_10m&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto`
      );
      const data = await res.json();
      const weather = {
        current: {
          temp: data.current_weather?.temperature || 0,
          humidity: data.hourly?.relative_humidity_2m?.[0] || 50,
          wind_speed: data.current_weather?.windspeed || 0,
          rain_prob: data.daily?.precipitation_probability_max?.[0] || 0,
        },
        hourly: (data.hourly?.time || []).slice(0, 24).map((t, i) => ({
          hour: t.split("T")[1],
          temp: data.hourly.temperature_2m[i] || 0,
        })),
        daily: (data.daily?.time || []).slice(0, 7).map((t, i) => ({
          date: t,
          max_temp: data.daily.temperature_2m_max[i] || 0,
          min_temp: data.daily.temperature_2m_min[i] || 0,
          rain_prob: data.daily.precipitation_probability_max[i] || 0,
        })),
      };

      if (id === 'current') {
        setWeatherForLocation(weather);
      } else {
        setWeatherMap((prev) => ({ ...prev, [id]: weather }));
      }

      // Warnings
      if (!alertShown.current) {
        let triggered = false;
        if (weather.current.temp > 38) { toast.warning("🔥 Heatwave alert! Avoid outdoor work.", { autoClose: 5000 }); triggered = true; }
        if (weather.current.rain_prob > 70) { toast.info("🌧 High rain probability expected.", { autoClose: 5000 }); triggered = true; }
        if (weather.current.wind_speed > 20) { toast.warning("🌪 Strong winds detected. Secure crops.", { autoClose: 5000 }); triggered = true; }
        if (weather.current.temp < 5) { toast.error("❄ Frost risk! Protect crops.", { autoClose: 5000 }); triggered = true; }
        if (triggered) alertShown.current = true;
      }
    } catch (err) {
      console.error("Weather fetch error", err);
    }
  };

  const updateCropStage = async (cropId, currentStageIdx) => {
    if (currentStageIdx >= cropStages.length - 1) {
      toast.info("Crop already at harvest stage");
      return;
    }

    try {
      const nextStage = cropStages[currentStageIdx + 1];
      await axios.put(`${API_BASE}/farmer/crops/${cropId}`, 
        { stage: nextStage }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCrops(crops.map(c => c._id === cropId ? { ...c, stage: nextStage } : c));
      toast.success(` Advanced to ${nextStage}`);
    } catch (err) {
      toast.error('Failed to update crop stage');
    }
  };

  const deleteCrop = async (cropId) => {
    if (!window.confirm('Delete this crop?')) return;

    try {
      await axios.delete(`${API_BASE}/farmer/crops/${cropId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Delete associated diseases
      try {
        await axios.delete(`${API_BASE}/farmer/diseases/crop/${cropId}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn('Disease cleanup skipped');
      }
      
      // Clear weather data for deleted crop
      setWeatherMap(prev => {
        const updated = { ...prev };
        delete updated[cropId];
        return updated;
      });
      
      setCrops(crops.filter(c => c._id !== cropId));
      setDiseases(diseases.filter(d => d.cropId !== cropId));
      setSelectedCrop(null);
      setShowCropDetails(false);
      toast.success(' Crop and associated diseases deleted');
    } catch (err) {
      toast.error('Failed to delete crop');
    }
  };

  const deleteDisease = async (diseaseId) => {
    if (!window.confirm('Delete this disease record?')) return;

    try {
      await axios.delete(`${API_BASE}/farmer/diseases/${diseaseId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDiseases(diseases.filter(d => d._id !== diseaseId));
      toast.success(' Disease record deleted');
    } catch (err) {
      toast.error('Failed to delete disease record');
    }
  };

  const filteredCrops = crops.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDiseases = diseases.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cropName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count diseases by cropId (not by name) to avoid mixing diseases from crops with same name
  const diseaseCounts = diseases.reduce((acc, d) => {
    acc[d.cropId] = (acc[d.cropId] || 0) + 1;
    return acc;
  }, {});

  if (isLoadingData) return <div className="loading-container"><div className="spinner"></div>Loading...</div>;

  return (
    <div className="crop-management-v2">
      <ToastContainer position="top-right" />

      {/* HEADER */}
      <div className="cm-header">
        <div>
          <h1> Crop & Disease Management</h1>
          <p>Monitor crops, track diseases, and optimize farm management</p>
        </div>
        <button onClick={loadData} className="btn-refresh">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* WEATHER CARD */}
      {weatherForLocation && (
        <div className="weather-overview">
          <div className="weather-item">
            <Thermometer size={24} color="#ef4444" />
            <div>
              <p className="label">Temperature</p>
              <p className="value">{weatherForLocation.current.temp}°C</p>
            </div>
          </div>
          <div className="weather-item">
            <Droplets size={24} color="#3b82f6" />
            <div>
              <p className="label">Humidity</p>
              <p className="value">{weatherForLocation.current.humidity}%</p>
            </div>
          </div>
          <div className="weather-item">
            <CloudRain size={24} color="#8b5cf6" />
            <div>
              <p className="label">Rain Probability</p>
              <p className="value">{weatherForLocation.current.rain_prob}%</p>
            </div>
          </div>
          <div className="weather-item">
            <Wind size={24} color="#f59e0b" />
            <div>
              <p className="label">Wind Speed</p>
              <p className="value">{weatherForLocation.current.wind_speed} km/h</p>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="cm-tabs">
        <button
          className={`tab ${activeTab === "crops" ? "active" : ""}`}
          onClick={() => setActiveTab("crops")}
        >
           Crops ({crops.length})
        </button>
        <button
          className={`tab ${activeTab === "diseases" ? "active" : ""}`}
          onClick={() => setActiveTab("diseases")}
        >
           Diseases ({diseases.length})
        </button>
      </div>

      {/* CROPS TAB */}
      {activeTab === "crops" && (
        <div className="tab-content">
          {/* SEARCH & FILTER */}
          <div className="search-filter">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search crops by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-filter">
              <Filter size={18} /> Filter
            </button>
          </div>

          {/* CROPS TABLE */}
          {filteredCrops.length === 0 ? (
            <div className="empty-state">
              <Sprout size={48} />
              <p>No crops registered yet. Create crops in Field Management.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="crops-table">
                <thead>
                  <tr>
                    <th>Crop Name</th>
                    <th>Category</th>
                    <th>Area</th>
                    <th>Season</th>
                    <th>Stage</th>
                    <th>Progress</th>
                    <th>Diseases</th>
                    <th>Sowing Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrops.map((crop) => {
                    const stageIdx = cropStages.indexOf(crop.stage);
                    const progress = stageIdx >= 0 ? ((stageIdx + 1) / cropStages.length) * 100 : 0;
                    const diseaseCount = diseaseCounts[crop._id] || 0;

                    return (
                      <tr key={crop._id} className={diseaseCount > 0 ? "has-disease" : ""}>
                        <td className="crop-name">
                          <strong>{crop.name}</strong>
                        </td>
                        <td>
                          <span className="badge">{crop.category}</span>
                        </td>
                        <td>{crop.area} {crop.unit}</td>
                        <td>{crop.season}</td>
                        <td>
                          <span className="stage-badge">{crop.stage}</span>
                        </td>
                        <td>
                          <div className="progress-bar">
                            <div className="fill" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="percent">{Math.round(progress)}%</span>
                        </td>
                        <td>
                          {diseaseCount > 0 ? (
                            <span className="disease-count alert">{diseaseCount} ⚠️</span>
                          ) : (
                            <span className="disease-count">Healthy ✓</span>
                          )}
                        </td>
                        <td>{crop.sowingDate ? new Date(crop.sowingDate).toLocaleDateString() : "—"}</td>
                        <td className="actions">
                          <button
                            className="btn-small primary"
                            onClick={() => {
                              setSelectedCrop(crop);
                              setShowCropDetails(true);
                            }}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-small secondary"
                            onClick={() => updateCropStage(crop._id, stageIdx)}
                            disabled={stageIdx >= cropStages.length - 1}
                            title="Advance stage"
                          >
                            <TrendingUp size={16} />
                          </button>
                          <button
                            className="btn-small danger"
                            onClick={() => deleteCrop(crop._id)}
                            title="Delete crop"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DISEASES TAB */}
      {activeTab === "diseases" && (
        <div className="tab-content">
          {/* SEARCH & FILTER */}
          <div className="search-filter">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search diseases by name or crop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* DISEASES TABLE */}
          {filteredDiseases.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} />
              <p>No diseases recorded. Fields are healthy! 🎉</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="diseases-table">
                <thead>
                  <tr>
                    <th>Disease</th>
                    <th>Photo</th>
                    <th>Crop</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date Reported</th>
                    <th>Season</th>
                    <th>Timeline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiseases.map((disease, idx) => (
                    <tr key={disease._id} className={`severity-${disease.severity.toLowerCase()}`}>
                      <td className="disease-name">
                        <strong>{disease.name}</strong>
                      </td>
                      <td>
                        {disease.photoUrl ? (
                          <img 
                            src={`http://localhost:5000${disease.photoUrl}`} 
                            alt="disease evidence" 
                            style={{width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover'}}
                            onError={(e) => {e.target.style.display = 'none'}}
                          />
                        ) : (
                          <span style={{color: '#999', fontSize: '12px'}}>No photo</span>
                        )}
                      </td>
                      <td>{disease.cropName}</td>
                      <td>
                        <span className="type-badge">{disease.type}</span>
                      </td>
                      <td>
                        <span className={`severity ${disease.severity.toLowerCase()}`}>
                          {disease.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${disease.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {disease.status}
                        </span>
                      </td>
                      <td>{new Date(disease.date).toLocaleDateString()}</td>
                      <td>{disease.season}</td>
                      <td>
                        <div className="timeline-indicator">
                          <Calendar size={16} />
                          {Math.floor((Date.now() - new Date(disease.date)) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-small danger"
                          onClick={() => deleteDisease(disease._id)}
                          title="Delete disease record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DISEASE STATISTICS */}
          {diseases.length > 0 && (
            <>
              <div className="section-header">
                <h3>Disease Statistics</h3>
              </div>
              <div className="disease-stats">
                <div className="stat-card">
                  <h4>By Type</h4>
                  <div className="stat-list">
                    {Object.entries(
                      diseases.reduce((acc, d) => {
                        acc[d.type] = (acc[d.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="stat-item">
                        <span>{type}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stat-card">
                  <h4>By Status</h4>
                  <div className="stat-list">
                    {Object.entries(
                      diseases.reduce((acc, d) => {
                        acc[d.status] = (acc[d.status] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([status, count]) => (
                      <div key={status} className="stat-item">
                        <span>{status}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stat-card">
                  <h4>By Severity</h4>
                  <div className="stat-list">
                    {Object.entries(
                      diseases.reduce((acc, d) => {
                        acc[d.severity] = (acc[d.severity] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([severity, count]) => (
                      <div key={severity} className="stat-item">
                        <span>{severity}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CROP DETAILS MODAL */}
      {showCropDetails && selectedCrop && (
        <div className="modal-overlay" onClick={() => setShowCropDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close" onClick={() => setShowCropDetails(false)}>✕</button>
            
            <div className="modal-header">
              <h2>{selectedCrop.name}</h2>
              <span className="category-badge">{selectedCrop.category}</span>
            </div>

            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>Area</label>
                  <p>{selectedCrop.area} {selectedCrop.unit}</p>
                </div>
                <div className="info-item">
                  <label>Season</label>
                  <p>{selectedCrop.season}</p>
                </div>
                <div className="info-item">
                  <label>Planting Method</label>
                  <p>{selectedCrop.method}</p>
                </div>
                <div className="info-item">
                  <label>Current Stage</label>
                  <p>{selectedCrop.stage}</p>
                </div>
              </div>

              {/* LIFECYCLE PROGRESS */}
              <div className="lifecycle-section">
                <h3>Crop Lifecycle</h3>
                <div className="lifecycle-track">
                  {cropStages.map((stage, idx) => {
                    const isActive = cropStages.indexOf(selectedCrop.stage) >= idx;
                    return (
                      <div key={stage} className={`lifecycle-step ${isActive ? "active" : ""}`}>
                        <div className="step-marker">{idx + 1}</div>
                        <p>{stage}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WEATHER FOR THIS CROP */}
              {weatherMap[selectedCrop._id] && (
                <div className="weather-section">
                  <h3>📍 Location Weather</h3>
                  <div className="weather-details">
                    <div className="weather-card">
                      <Thermometer size={20} />
                      <div>
                        <p>Temp: {weatherMap[selectedCrop._id].current.temp}°C</p>
                      </div>
                    </div>
                    <div className="weather-card">
                      <Droplets size={20} />
                      <div>
                        <p>Humidity: {weatherMap[selectedCrop._id].current.humidity}%</p>
                      </div>
                    </div>
                    <div className="weather-card">
                      <CloudRain size={20} />
                      <div>
                        <p>Rain: {weatherMap[selectedCrop._id].current.rain_prob}%</p>
                      </div>
                    </div>
                    <div className="weather-card">
                      <Wind size={20} />
                      <div>
                        <p>Wind: {weatherMap[selectedCrop._id].current.wind_speed} km/h</p>
                      </div>
                    </div>
                  </div>

                  {/* TEMPERATURE CHART */}
                  <div className="chart-section">
                    <h4>24-Hour Temperature</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={weatherMap[selectedCrop._id].hourly}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="temp" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTemp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 7-DAY FORECAST */}
                  <div className="forecast-section">
                    <h4>7-Day Forecast</h4>
                    <div className="forecast-grid">
                      {weatherMap[selectedCrop._id].daily.slice(0, 7).map((day, idx) => (
                        <div key={idx} className="forecast-item">
                          <p className="day">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <div className="temps">
                            <span className="max">{day.max_temp}°</span>
                            <span className="min">{day.min_temp}°</span>
                          </div>
                          <p className="rain">🌧 {day.rain_prob}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ASSOCIATED DISEASES */}
              {diseaseCounts[selectedCrop._id] > 0 && (
                <div className="diseases-section">
                  <h3>⚠️ Diseases Reported</h3>
                  <div className="disease-list">
                    {diseases.filter(d => d.cropId === selectedCrop._id).map(d => (
                      <div key={d._id} className="disease-item">
                        <div>
                          <p className="disease-name">{d.name}</p>
                          <p className="disease-type">{d.type} • {d.severity}</p>
                        </div>
                        <span className={`status ${d.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="modal-actions">
                <button 
                  className="btn-action primary"
                  onClick={() => {
                    const idx = cropStages.indexOf(selectedCrop.stage);
                    if (idx < cropStages.length - 1) {
                      updateCropStage(selectedCrop._id, idx);
                      setShowCropDetails(false);
                    }
                  }}
                >
                  <TrendingUp size={16} /> Advance Stage
                </button>
                <button 
                  className="btn-action danger"
                  onClick={() => {
                    deleteCrop(selectedCrop._id);
                  }}
                >
                  <Trash2 size={16} /> Delete Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Missing icon import
const Sprout = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="21" x2="12" y2="3"></line>
    <path d="M4 10c0-3 3-5 8-5s8 2 8 5"></path>
    <path d="M3.5 15h17"></path>
  </svg>
);

export default FarmerCropManagement;
