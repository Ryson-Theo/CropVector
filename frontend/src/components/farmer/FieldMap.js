import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MapPin, Plus, Trash2, Layers, AlertTriangle, Bug, Droplet, Leaf, Check, X, Sprout } from "lucide-react";
import { toast } from "react-toastify";
import "./FieldMap.css";

const FieldMap = ({ fieldId, fieldLocation, onPOISelect, onCropPinned, onFieldPinned, fieldCrops = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);
  const [map, setMap] = useState(null);
  const [pois, setPois] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Disease");
  const [filterCategory, setFilterCategory] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markerGroup, setMarkerGroup] = useState(null);
  const [newPOI, setNewPOI] = useState(null);
  const [isPinningCrop, setIsPinningCrop] = useState(false);
  const [cropPinMarker, setCropPinMarker] = useState(null);
  const [cropPinLocation, setCropPinLocation] = useState(null);
  const [isPinningField, setIsPinningField] = useState(false);
  const [fieldPinMarker, setFieldPinMarker] = useState(null);
  const [fieldPinLocation, setFieldPinLocation] = useState(null);

  const categoryIcons = {
    Disease: { icon: AlertTriangle, color: "#dc2626", label: "Disease" },
    Pest: { icon: Bug, color: "#f59e0b", label: "Pest" },
    WaterLeak: { icon: Droplet, color: "#0ea5e9", label: "Water Leak" },
    WeedPatch: { icon: Leaf, color: "#22c55e", label: "Weed Patch" }
  };

  // FIX #4: Fetch POIs on component mount and when fieldId changes
  useEffect(() => {
    if (fieldId && map) {
      console.log('Fetching POIs on component mount/fieldId change');
      fetchPOIs();
    }
  }, [fieldId, map]);

  // Render registered crop pins
  useEffect(() => {
    if (!map || !leafletRef.current || !fieldCrops || fieldCrops.length === 0) return;
    
    const L = leafletRef.current;
    console.log(`Rendering ${fieldCrops.length} registered crop pins`);
    
    fieldCrops.forEach((crop) => {
      if (!crop.location?.coordinates || crop.location.coordinates.length !== 2) {
        console.warn(' Skipping crop without valid location:', crop._id);
        return;
      }
      
      const [lng, lat] = crop.location.coordinates;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        console.warn(' Crop has invalid coordinate values:', crop._id);
        return;
      }
      
      // Add blue marker for crop pins
      L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })
      }).addTo(map).bindPopup(`<strong>${crop.name}</strong><br/>Category: ${crop.category}<br/>Area: ${crop.area} ${crop.unit}<br/>Season: ${crop.season}`);
      
      console.log(`Crop pin rendered: ${crop.name} at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    });
  }, [map, fieldCrops]);

  // Initialize map
  useEffect(() => {
    // Dynamic import for Leaflet
    import("leaflet").then((L) => {
      leafletRef.current = L;
      
      // Cleanup existing map instance if present
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Error removing existing map:", err);
        }
      }

      if (mapRef.current) {
        try {
          // Center map on field location or default
          let centerLat = 51.505;
          let centerLng = -0.09;
          let zoomLevel = 13;
          
          if (fieldLocation?.coordinates && fieldLocation.coordinates.length === 2) {
            centerLng = fieldLocation.coordinates[0];
            centerLat = fieldLocation.coordinates[1];
            zoomLevel = 18;  // Zoom in to field level
            console.log("Centering map on field location:", [centerLat, centerLng]);
          } else {
            console.warn(" No field location provided - using default map center");
          }

          const mapInstance = L.map(mapRef.current, { preferCanvas: true }).setView([centerLat, centerLng], zoomLevel);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
          }).addTo(mapInstance);

          // Add marker for field location
          if (fieldLocation?.coordinates && fieldLocation.coordinates.length === 2) {
            L.marker([centerLat, centerLng], {
              icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              })
            }).addTo(mapInstance).bindPopup("Field Location");
            console.log(" Field marker added");
          }
          
          mapInstanceRef.current = mapInstance;
          setMap(mapInstance);
          // Fetch POIs after map is ready
          setTimeout(() => fetchPOIs(), 100);
        } catch (err) {
          console.error("Map initialization error:", err);
        }
      }
    });

    return () => {
      // Cleanup on unmount or when fieldId changes
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setMap(null);
        } catch (err) {
          console.warn("Error cleaning up map:", err);
        }
      }
    };
  }, [fieldId, fieldLocation]);

  // Fetch POIs
  const fetchPOIs = async () => {
    if (!fieldId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/fields/${fieldId}/pois`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const poiData = res.data || [];
      console.log(`Fetched ${poiData.length} POIs for field`, fieldId, poiData);
      setPois(poiData);
      if (map && leafletRef.current) {
        renderPOIs(poiData);
      }
    } catch (err) {
      console.error("Fetch POIs Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Render POI markers on map
  const renderPOIs = (poiList) => {
    if (!map || !leafletRef.current) return;

    // Clear existing POI markers only (preserve pin markers)
    if (markerGroup) {
      map.removeLayer(markerGroup);
    }

    const L = leafletRef.current;
    const group = L.featureGroup();
    let renderedCount = 0;

    poiList.forEach((poi) => {
      // Skip POIs without proper location data
      if (!poi.location?.coordinates || !Array.isArray(poi.location.coordinates) || poi.location.coordinates.length !== 2) {
        console.warn(' Skipping POI without valid coordinates:', poi._id, poi);
        return;
      }

      // Validate coordinates are numbers
      const [lng, lat] = poi.location.coordinates;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        console.warn(' POI has invalid coordinate values:', poi._id, { lng, lat });
        return;
      }

      // Apply filter
      if (filterCategory && poi.category !== filterCategory) return;

      const categoryInfo = categoryIcons[poi.category] || categoryIcons.Disease;

      // Create custom marker HTML
      const markerHTML = `
        <div class="poi-marker" style="background-color: ${categoryInfo.color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          ${poi.severity || 5}
        </div>
      `;

      const marker = L.marker(
        [lat, lng],
        {
          icon: L.divIcon({
            html: markerHTML,
            iconSize: [30, 30],
            className: "custom-marker"
          })
        }
      ).bindPopup(`
        <div class="poi-popup">
          <h4>${poi.category}</h4>
          <p><strong>Disease:</strong> ${poi.diseaseName || "N/A"}</p>
          <p><strong>Symptom:</strong> ${poi.symptom || "N/A"}</p>
          <p><strong>Severity:</strong> ${poi.severity || 5}/10</p>
          ${poi.photoUrl ? `<img src="http://localhost:5000/${poi.photoUrl}" alt="POI" style="max-width: 100px; margin-top: 10px;" />` : ""}
          <button class="delete-poi-btn" data-id="${poi._id}">Delete</button>
        </div>
      `);

      marker.addEventListener("click", () => onPOISelect?.(poi));
      group.addLayer(marker);
      renderedCount++;
      console.log(`POI rendered: ${poi.diseaseName} at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    });

    map.addLayer(group);
    setMarkerGroup(group);
    console.log(`Total POIs rendered: ${renderedCount}/${poiList.length}`);
  };

  // Map click handler for dropping pins
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const L = leafletRef.current;

    // Handle field pinning mode
    if (isPinningField) {
      console.log(`Field location pinned at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
      setFieldPinLocation({ latitude: lat, longitude: lng });
      
      // Remove old field marker if exists
      if (fieldPinMarker && map) {
        map.removeLayer(fieldPinMarker);
      }
      
      // Add new marker for field pin
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })
      }).addTo(map).bindPopup(`Field Center<br/>Lat: ${lat.toFixed(4)}<br/>Lng: ${lng.toFixed(4)}`);
      
      setFieldPinMarker(marker);
      return;
    }

    // Handle crop pinning mode
    if (isPinningCrop) {
      console.log(`Crop pinned at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
      setCropPinLocation({ latitude: lat, longitude: lng });
      
      // Remove old crop marker if exists
      if (cropPinMarker && map) {
        map.removeLayer(cropPinMarker);
      }
      
      // Add new marker for crop pin
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        })
      }).addTo(map).bindPopup(`Crop Location<br/>Lat: ${lat.toFixed(4)}<br/>Lng: ${lng.toFixed(4)}`);
      
      setCropPinMarker(marker);
      return;
    }

    // Handle POI creation mode
    if (!isDrawing) return;

    console.log(`Pin dropped at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    setNewPOI({
      longitude: lng,
      latitude: lat,
      category: selectedCategory,
      severity: 5
    });
  };

  // Add event listener to map
  useEffect(() => {
    if (map && (isDrawing || isPinningCrop || isPinningField)) {
      map.on("click", handleMapClick);
      map.dragging.disable();
      if (mapRef.current) {
        mapRef.current.style.cursor = "crosshair";
      }

      return () => {
        if (map) {
          try {
            map.off("click", handleMapClick);
            map.dragging.enable();
          } catch (err) {
            console.warn("Error disabling map interactions:", err);
          }
        }
        if (mapRef.current) {
          mapRef.current.style.cursor = "grab";
        }
      };
    }
  }, [map, isDrawing, isPinningCrop, isPinningField, selectedCategory]);

  // Heatmap rendering - enhanced disease marker visualization
  useEffect(() => {
    if (!map || !leafletRef.current || pois.length === 0 || !markerGroup) return;

    const L = leafletRef.current;
    
    if (showHeatmap) {
      // Enhance markers for heatmap - increase size and opacity based on severity
      const markerElements = document.querySelectorAll('.custom-marker');
      markerElements.forEach((el, idx) => {
        const poi = pois[idx];
        if (poi.category === 'Disease' && poi.severity) {
          const severity = Math.min(poi.severity, 10);
          const scale = 1 + (severity / 10) * 0.5; // Scale from 1 to 1.5
          const opacity = 0.6 + (severity / 10) * 0.4; // Opacity from 0.6 to 1.0
          el.style.transform = `scale(${scale})`;
          el.style.opacity = opacity;
          el.style.boxShadow = `0 0 ${10 + severity}px rgba(255, 0, 0, ${severity / 10})`;
        }
      });
      console.log('Heatmap mode: Disease markers enhanced by severity');
    } else {
      // Reset markers to normal
      const markerElements = document.querySelectorAll('.custom-marker');
      markerElements.forEach(el => {
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
        el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
      });
      console.log('Heatmap mode: Off - markers reset to normal');
    }
  }, [showHeatmap, map, pois, markerGroup]);

  // Create POI
  const handleCreatePOI = async (e) => {
    e.preventDefault();
    if (!newPOI) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        fieldId,
        longitude: newPOI.longitude,
        latitude: newPOI.latitude,
        category: newPOI.category,
        severity: newPOI.severity,
        diseaseName: newPOI.diseaseName,
        symptom: newPOI.symptom,
        notes: newPOI.notes
      };

      console.log("Creating POI with payload:", payload);

      const response = await axios.post(`http://localhost:5000/api/fields/${fieldId}/pois`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("POI created successfully:", response.data);
      toast.success("POI saved successfully!");
      setNewPOI(null);
      setIsDrawing(false);
      fetchPOIs();
    } catch (err) {
      console.error(" Create POI Error:", err.response?.data || err.message);
      toast.error(` Error saving POI: ${err.response?.data?.error || err.message}`);
    }
  };

  // Delete POI
  const handleDeletePOI = async (poiId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/pois/${poiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPOIs();
    } catch (err) {
      console.error("Delete POI Error:", err);
    }
  };

  return (
    <div className="field-map-container">
      <div className="map-toolbar">
        <div className="toolbar-section">
          <button
            className={`toolbar-btn ${isDrawing ? "active" : ""}`}
            onClick={() => setIsDrawing(!isDrawing)}
            title="Drop Pin Mode"
          >
            <MapPin size={20} /> {isDrawing ? "Dropping..." : "Drop Pin"}
          </button>

          <button
            className={`toolbar-btn ${isPinningCrop ? "active" : ""}`}
            onClick={() => {
              setIsPinningCrop(!isPinningCrop);
              if (isDrawing) setIsDrawing(false);
              if (isPinningField) setIsPinningField(false);
            }}
            title="Pin Crop Location for Weather Accuracy"
          >
            <Sprout size={16} /> {isPinningCrop ? "Pinning..." : "Pin Crop"}
          </button>

          <button
            className={`toolbar-btn ${isPinningField ? "active" : ""}`}
            onClick={() => {
              setIsPinningField(!isPinningField);
              if (isDrawing) setIsDrawing(false);
              if (isPinningCrop) setIsPinningCrop(false);
            }}
            title="Pin Field Center for Accurate Location"
          >
            <MapPin size={16} /> {isPinningField ? "Pinning..." : "Pin Field"}
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
            disabled={!isDrawing}
          >
            <option value="Disease">Disease</option>
            <option value="Pest">Pest</option>
            <option value="WaterLeak">Water Leak</option>
            <option value="WeedPatch">Weed Patch</option>
          </select>
        </div>

        <div className="toolbar-section">
          <button
            className={`toolbar-btn ${showHeatmap ? "active" : ""}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle Heat Map"
          >
            <Layers size={20} /> Heat Map
          </button>

          <select
            value={filterCategory || ""}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="filter-select"
          >
            <option value="">All POIs</option>
            <option value="Disease">Disease</option>
            <option value="Pest">Pest</option>
            <option value="WaterLeak">Water Leak</option>
            <option value="WeedPatch">Weed Patch</option>
          </select>
        </div>

        <div className="toolbar-info">
          {loading ? "Loading..." : `${pois.length} POIs`}
          {fieldPinLocation && (
            <span style={{ marginLeft: "20px", color: "#ef4444", fontWeight: "bold" }}>
              <MapPin size={14} /> Field @ [{fieldPinLocation.latitude.toFixed(4)}, {fieldPinLocation.longitude.toFixed(4)}]
            </span>
          )}
          {cropPinLocation && (
            <span style={{ marginLeft: "20px", color: "#22c55e", fontWeight: "bold" }}>
              <Sprout size={14} /> Crop @ [{cropPinLocation.latitude.toFixed(4)}, {cropPinLocation.longitude.toFixed(4)}]
            </span>
          )}
        </div>
      </div>

      {/* Field Pin Confirmation */}
      {fieldPinLocation && isPinningField && (
        <div className="poi-form-overlay">
          <div className="poi-form">
            <h3><MapPin size={18} /> Field Center Pinned</h3>
            <p>Latitude: {fieldPinLocation.latitude.toFixed(6)}</p>
            <p>Longitude: {fieldPinLocation.longitude.toFixed(6)}</p>
            <p>Field center location has been updated for accurate weather data.</p>
            <div style={{ marginTop: "15px" }}>
              <button 
                className="btn-save"
                onClick={async () => {
                  try {
                    // Save to database
                    const token = localStorage.getItem('token');
                    const response = await fetch(
                      `http://localhost:5000/api/fields/${fieldId}/update-location`,
                      {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          latitude: fieldPinLocation.latitude,
                          longitude: fieldPinLocation.longitude
                        })
                      }
                    );
                    const data = await response.json();
                    if (response.ok) {
                      console.log('Field location saved to database:', data.location?.coordinates);
                      toast.success(`Field location updated!`);
                    } else {
                      console.error('API error:', data.error);
                      toast.error(`Error saving: ${data.error}`);
                    }
                  } catch (err) {
                    console.error('Error saving field location:', err);
                    toast.error(`Error: ${err.message}`);
                  }
                  setIsPinningField(false);
                  onFieldPinned?.(fieldPinLocation);
                }}
              >
                <Check size={16} /> Confirm & Save Location
              </button>
              <button 
                className="btn-cancel"
                onClick={() => {
                  setFieldPinLocation(null);
                  setIsPinningField(false);
                  if (fieldPinMarker && map) {
                    map.removeLayer(fieldPinMarker);
                    setFieldPinMarker(null);
                  }
                }}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Pin Confirmation */}
      {cropPinLocation && isPinningCrop && (
        <div className="poi-form-overlay">
          <div className="poi-form">
            <h3><Sprout size={18} /> Crop Location Pinned</h3>
            <p>Latitude: {cropPinLocation.latitude.toFixed(6)}</p>
            <p>Longitude: {cropPinLocation.longitude.toFixed(6)}</p>
            <p>Weather will now be fetched from this exact location.</p>
            <div style={{ marginTop: "15px" }}>
              <button 
                className="btn-save"
                onClick={() => {
                  setIsPinningCrop(false);
                  onCropPinned?.(cropPinLocation);
                }}
              >
                <Check size={16} /> Confirm & Use This Location
              </button>
              <button 
                className="btn-cancel"
                onClick={() => {
                  setCropPinLocation(null);
                  setIsPinningCrop(false);
                  if (cropPinMarker && map) {
                    map.removeLayer(cropPinMarker);
                    setCropPinMarker(null);
                  }
                }}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="field-map" style={{ height: "500px", position: "relative" }} />

      {/* New POI Form */}
      {newPOI && (
        <div className="poi-form-overlay">
          <div className="poi-form">
            <h3><MapPin size={18} /> Mark {newPOI.category} at [{newPOI.latitude.toFixed(4)}, {newPOI.longitude.toFixed(4)}]</h3>
            {console.log("POI form visible for:", newPOI)}

            <div className="form-group">
              <label>Severity (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={newPOI.severity}
                onChange={(e) => setNewPOI({ ...newPOI, severity: parseInt(e.target.value) })}
              />
              <span>{newPOI.severity}/10</span>
            </div>

            {newPOI.category === "Disease" && (
              <>
                <div className="form-group">
                  <label>Disease Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Blight"
                    value={newPOI.diseaseName || ""}
                    onChange={(e) => setNewPOI({ ...newPOI, diseaseName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Symptom</label>
                  <select
                    value={newPOI.symptom || ""}
                    onChange={(e) => setNewPOI({ ...newPOI, symptom: e.target.value })}
                  >
                    <option value="">Select symptom</option>
                    <option value="Yellowing">Yellowing</option>
                    <option value="LeafSpots">Leaf Spots</option>
                    <option value="Wilting">Wilting</option>
                    <option value="Blight">Blight</option>
                    <option value="Powdery">Powdery Mildew</option>
                    <option value="Rust">Rust</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Notes</label>
              <textarea
                placeholder="Additional observations..."
                value={newPOI.notes || ""}
                onChange={(e) => setNewPOI({ ...newPOI, notes: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button className="btn-save" onClick={handleCreatePOI}>
                Save POI
              </button>
              <button className="btn-cancel" onClick={() => setNewPOI(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POI List */}
      <div className="poi-list">
        <h3>Points of Interest ({pois.length})</h3>
        <div className="poi-items">
          {pois.map((poi) => (
            <div key={poi._id} className={`poi-item poi-${poi.category.toLowerCase()}`}>
              <div className="poi-item-header">
                <span className="poi-category">{poi.category}</span>
                <span className="poi-severity">Severity: {poi.severity}/10</span>
              </div>
              {poi.diseaseName && <p className="poi-disease">{poi.diseaseName}</p>}
              {poi.symptom && <p className="poi-symptom">Symptom: {poi.symptom}</p>}
              <button
                className="delete-btn"
                onClick={() => handleDeletePOI(poi._id)}
                title="Delete POI"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FieldMap;
