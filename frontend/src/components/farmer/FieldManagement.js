import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Edit2, Trash2, MapPin, ChevronRight, Thermometer, CloudRain, Wind, Droplets, AlertTriangle, Copy, Check, Sprout, Info, Image } from "lucide-react";
import FieldMap from "./FieldMap";
import useFieldSync from "./useFieldSync";
import "./FieldManagement.css";

const FieldManagement = () => {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldCrops, setFieldCrops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [weatherMap, setWeatherMap] = useState({});
  const [showDiseaseForm, setShowDiseaseForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [manualLocationEdit, setManualLocationEdit] = useState(false);
  const [cropPinLocation, setCropPinLocation] = useState(null);
  const [fieldPinLocation, setFieldPinLocation] = useState(null);

  const apiUrl = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/+$/, "");
  const API_BASE = `${apiUrl}/api`;
  const SERVER_BASE = (process.env.REACT_APP_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const { fieldToCrop } = useFieldSync();

  // Crop registration data
  const cropCategories = ["Field Crop", "Vegetable", "Fruit", "Plantation", "Horticulture", "Medicinal", "Fodder"];
  const cropNames = {
    "Field Crop": ["Rice", "Wheat", "Maize", "Cotton"],
    "Vegetable": ["Tomato", "Onion", "Potato", "Chilli"],
    "Fruit": ["Banana", "Mango", "Grapes"],
    "Plantation": ["Sugarcane", "Coffee", "Tea"],
    "Horticulture": ["Apple", "Guava", "Orange"],
    "Medicinal": ["Aloe Vera", "Tulsi", "Neem"],
    "Fodder": ["Grass", "Soybean", "Maize"],
  };
  const plantationMethods = ["Direct sowing", "Transplantation", "Nursery", "Drip irrigation", "Hydroponic"];
  const seasons = ["Kharif", "Rabi", "Zaid"];

  const [newCrop, setNewCrop] = useState({ 
    category: "", 
    name: "", 
    area: "", 
    unit: "Acre", 
    method: "Direct sowing", 
    season: "Kharif", 
    sowingDate: "" 
  });

  const [diseaseData, setDiseaseData] = useState({
    name: "",
    symptom: "",
    severity: 5,
    photo: null,
    cropId: ""
  });

  // Valid symptom enum values from POI model
  const validSymptoms = ['Yellowing', 'LeafSpots', 'Wilting', 'Blight', 'Powdery', 'Rust', 'Other'];

  const [formData, setFormData] = useState({
    fieldName: "",
    fieldCode: "",
    areaInHectares: "",
    soilType: "Mixed",
    location: null,
    locationDisplay: "",
    locationName: "",
    currentCrop: {
      cropType: "",
      variety: "",
      plantingDate: "",
      expectedHarvestDate: ""
    }
  });

  // Fetch fields
  useEffect(() => {
    fetchFields();
  }, []);

  // Reload field crops when selected field changes
  useEffect(() => {
    if (selectedField) {
      const loadFieldCrops = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/farmer/crops', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fieldCropsData = res.data?.filter(c => c.fieldId === selectedField._id) || [];
          setFieldCrops(fieldCropsData);
          console.log(` Loaded ${fieldCropsData.length} crops for selected field:`, fieldCropsData);
        } catch (err) {
          console.error(' Error loading field crops:', err);
        }
      };
      loadFieldCrops();
    }
  }, [selectedField?._id, token]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/fields", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(res.data || []);
      // Fetch weather for all fields - use field.location (which may be pinned)
      res.data?.forEach(field => {
        if (field.location?.coordinates) {
          fetchWeather(field.location.coordinates[1], field.location.coordinates[0], field._id);
        }
      });
    } catch (err) {
      console.error("Fetch Fields Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather data for field location
  const fetchWeather = async (lat, lon, fieldId) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
      );
      const data = await res.json();
      
      const weather = {
        current: {
          temp: data.current_weather?.temperature || 0,
          humidity: data.hourly?.relative_humidity_2m?.[0] || 0,
          wind_speed: data.current_weather?.windspeed || 0,
          rain_prob: data.daily?.precipitation_probability_max?.[0] || 0,
        },
        hourly: (data.hourly?.time || []).slice(0, 24).map((t, i) => ({
          hour: t.split("T")[1],
          temp: data.hourly.temperature_2m[i] || 0,
        })),
      };

      setWeatherMap(prev => ({ ...prev, [fieldId]: weather }));
    } catch (err) {
      console.error("Weather fetch error:", err);
    }
  };

  // Reverse geocoding - convert coordinates to place name
  const getLocationName = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.county || data.address?.country || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  // Create/Update field
  const handleSaveField = async (e) => {
    e.preventDefault();
    if (!formData.fieldName || !formData.areaInHectares) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Ensure numeric fields are numbers
      const payload = {
        fieldName: formData.fieldName,
        fieldCode: formData.fieldCode,
        areaInHectares: parseFloat(formData.areaInHectares),
        soilType: formData.soilType || 'Mixed',
        currentCrop: {
          cropType: formData.currentCrop.cropType || undefined,
          variety: formData.currentCrop.variety || undefined,
          plantingDate: formData.currentCrop.plantingDate || undefined,
          expectedHarvestDate: formData.currentCrop.expectedHarvestDate || undefined
        }
      };

      // Include location if user set it via GPS button
      if (formData.location && formData.location.coordinates && formData.location.coordinates.length === 2) {
        payload.location = formData.location;
        console.log("Field location included:", payload.location);
      } else {
        console.warn("No location set for field. Disease marking and sync will not work properly.");
      }

      console.log("Saving field payload:", payload);

      const endpoint = isEditing && selectedField 
        ? `http://localhost:5000/api/fields/${selectedField._id}`
        : "http://localhost:5000/api/fields";
      
      const method = isEditing ? "patch" : "post";
      
      const response = await axios({
        method,
        url: endpoint,
        data: payload,
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Save Field Response:", response.data);
      toast.success(isEditing ? "Field updated successfully" : "Field created successfully");
      fetchFields();
      resetForm();
    } catch (err) {
      console.error("Save Field Error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to save field";
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete field
  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Delete this field? All POIs, crops, and records will be removed.")) return;

    try {
      // Delete the field (which cascades to delete POIs)
      await axios.delete(`http://localhost:5000/api/fields/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Also delete associated crops (synced crops from this field)
      try {
        await axios.delete(`http://localhost:5000/api/farmer/crops/field/${fieldId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(' Associated crops deleted');
      } catch (err) {
        console.warn('Crop deletion skipped:', err.response?.status === 404 ? 'No crops found' : err.message);
      }

      // Delete associated diseases
      try {
        await axios.delete(`http://localhost:5000/api/farmer/diseases/field/${fieldId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(' Associated diseases deleted');
      } catch (err) {
        console.warn('Disease deletion skipped:', err.response?.status === 404 ? 'No diseases found' : err.message);
      }
      
      // Clear weather data for deleted field
      setWeatherMap(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
      
      toast.success("Field and associated data deleted successfully");
      fetchFields();
      setSelectedField(null);
    } catch (err) {
      console.error("Delete Field Error:", err);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  // Edit field
  const handleEditField = (field) => {
    const displayLoc = field.location?.coordinates 
      ? `${field.location.coordinates[1].toFixed(4)}, ${field.location.coordinates[0].toFixed(4)}`
      : "";
    setFormData({
      ...field,
      location: field.location,
      locationDisplay: displayLoc,
      locationName: field.locationName || displayLoc
    });
    setSelectedField(field);
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      fieldName: "",
      fieldCode: "",
      areaInHectares: "",
      soilType: "Mixed",
      location: null,
      locationDisplay: "",
      locationName: "",
      currentCrop: {
        cropType: "",
        variety: "",
        plantingDate: "",
        expectedHarvestDate: ""
      }
    });
    setShowForm(false);
    setIsEditing(false);
  };

  // Register crop for selected field
  const handleRegisterCrop = async (e) => {
    e.preventDefault();
    if (!newCrop.category || !newCrop.name || !selectedField) {
      toast.error("Please select a crop and field");
      return;
    }
    
    if (!newCrop.area || isNaN(parseFloat(newCrop.area))) {
      toast.error("Please enter a valid crop area");
      return;
    }

    try {
      const cropData = {
        ...newCrop,
        area: parseFloat(newCrop.area),
        fieldId: selectedField._id,
        location: {
          latitude: selectedField.location?.coordinates?.[1] || 0,
          longitude: selectedField.location?.coordinates?.[0] || 0,
          fieldName: selectedField.fieldName
        }
      };

      console.log(' Registering crop with data:', cropData);
      const res = await axios.post(`${API_BASE}/farmer/crops`, cropData, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      
      console.log(' Crop created:', res.data.crop);
      const cropId = res.data.crop._id;
      
      // If crop pin location exists, save it to the crop
      if (cropPinLocation) {
        try {
          console.log(' Updating crop location to pinned location:', cropPinLocation);
          const locRes = await axios.patch(`${API_BASE}/farmer/crops/${cropId}/update-location`, {
            latitude: cropPinLocation.latitude,
            longitude: cropPinLocation.longitude
          }, {
            headers: { Authorization: `Bearer ${token || ''}` }
          });
          console.log(' Crop location updated:', locRes.data.location?.coordinates);
          // Fetch weather for new pinned crop location
          fetchWeather(cropPinLocation.latitude, cropPinLocation.longitude, cropId);
        } catch (err) {
          console.error(' Error saving crop location:', err);
          toast.error('Crop created but location update failed');
        }
      } else {
        console.log(' No crop pin location, using field location');
        // Fetch weather for field location
        if (selectedField.location?.coordinates) {
          fetchWeather(selectedField.location.coordinates[1], selectedField.location.coordinates[0], cropId);
        }
      }
      
      toast.success(" Crop registered successfully!");
      setNewCrop({ category: "", name: "", area: "", unit: "Acre", method: "", season: "", sowingDate: "" });
      setCropPinLocation(null);  // Clear pin after saving
      setShowCropForm(false);
      
      // Reload all fields first
      console.log(' Fetching updated fields...');
      const fieldsRes = await axios.get(`${API_BASE}/fields`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      setFields(fieldsRes.data || []);
      
      // Update the selected field with fresh data
      const updatedSelectedField = fieldsRes.data?.find(f => f._id === selectedField._id);
      if (updatedSelectedField) {
        setSelectedField(updatedSelectedField);
        
        // Load crops for the field using the field ID directly
        setTimeout(async () => {
          try {
            console.log(' Loading crops for field:', updatedSelectedField._id);
            const res = await axios.get(`${API_BASE}/farmer/crops`, {
              headers: { Authorization: `Bearer ${token || ''}` }
            });
            console.log(' All crops returned from API:', res.data);
            const fieldCropsData = res.data?.filter(c => c.fieldId === updatedSelectedField._id) || [];
            console.log(' Filtered crops for this field:', fieldCropsData);
            setFieldCrops(fieldCropsData);
            console.log(` Found ${fieldCropsData.length} crops for field:`, fieldCropsData);
          } catch (err) {
            console.error(' Error loading crops:', err);
          }
        }, 500);
      }
    } catch (err) {
      console.error("Error registering crop:", err);
      toast.error("Failed to register crop: " + (err.response?.data?.error || err.message));
    }
  };

  // Calculate disease risk based on weather
  const calculateDiseaseRisk = (weather) => {
    let risk = "Low";
    let riskScore = 0;

    // High humidity + moderate temp = fungal disease
    if (weather.humidity > 80 && weather.temp > 15 && weather.temp < 28) {
      riskScore += 40;
    }
    // High rain probability = leaf diseases
    if (weather.rain_prob > 70) {
      riskScore += 30;
    }
    // High temperature = stress diseases
    if (weather.temp > 35) {
      riskScore += 25;
    }
    // Low temperature = cold damage
    if (weather.temp < 10) {
      riskScore += 20;
    }

    if (riskScore >= 60) risk = "High";
    else if (riskScore >= 30) risk = "Medium";

    return risk;
  };

  // Mark disease on field
  const handleMarkDisease = async (e) => {
    e.preventDefault();
    if (!diseaseData.name || !selectedField || !diseaseData.cropId) {
      toast.error("Please select a crop and fill disease details");
      return;
    }

    try {
      // Find the selected crop
      const selectedCrop = fieldCrops.find(c => c._id === diseaseData.cropId);
      if (!selectedCrop) {
        toast.error("Selected crop not found");
        return;
      }

      const weather = weatherMap[selectedField._id]?.current || {};
      const diseaseRisk = calculateDiseaseRisk(weather);
      
      // Warn if high disease risk
      if (diseaseRisk === "High") {
        toast.warning("WARNING: High disease risk detected based on current weather! Monitor crops closely.");
      }
      
      // Use crop location for disease marking
      let longitude = 0;
      let latitude = 0;
      
      if (selectedCrop.location?.coordinates?.length === 2) {
        longitude = selectedCrop.location.coordinates[0];
        latitude = selectedCrop.location.coordinates[1];
        console.log(" Using crop location:", { latitude, longitude });
      } else {
        toast.error(" Crop location not set. Please pin the crop location first.");
        return;
      }

      // Validate symptom is in enum
      if (diseaseData.symptom && !validSymptoms.includes(diseaseData.symptom)) {
        toast.error(`Invalid symptom. Please select from: ${validSymptoms.join(', ')}`);
        return;
      }

      // Ensure weather data has valid numbers (not NaN)
      const safeWeatherData = {
        temperature: Number.isFinite(weather.temp) ? weather.temp : 25,
        humidity: Number.isFinite(weather.humidity) ? weather.humidity : 60,
        rainfall: Number.isFinite(weather.rain_prob) ? weather.rain_prob : 0,
        windSpeed: Number.isFinite(weather.wind_speed) ? weather.wind_speed : 5
      };

      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append('fieldId', selectedField._id);
      formData.append('cropId', selectedCrop._id);
      formData.append('diseaseName', diseaseData.name);
      formData.append('symptom', diseaseData.symptom || 'Other');
      formData.append('severity', parseInt(diseaseData.severity) || 5);
      formData.append('longitude', longitude);
      formData.append('latitude', latitude);
      formData.append('weatherData', JSON.stringify(safeWeatherData));
      
      // Add photo if provided
      if (diseaseData.photo) {
        formData.append('photo', diseaseData.photo);
      }

      console.log(" Marking disease on crop:", selectedCrop.name);

      const response = await axios.post(
        `http://localhost:5000/api/fields/${selectedField._id}/mark-disease`,
        formData,
        { headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } }
      );
      
      console.log(" Disease marked successfully:", response.data);

      // Determine message based on photo upload status
      let successMessage = ` Disease "${diseaseData.name}" marked on ${selectedCrop.name}`;
      if (response.data.photoUrl) {
        successMessage += " with photo evidence";
      } else if (response.data.photoError) {
        successMessage += ` (photo upload skipped: ${response.data.photoError})`;
      } else {
        successMessage += " (photo upload skipped)";
      }
      
      toast.success(successMessage);
      
      setDiseaseData({ name: "", symptom: "", severity: 5, photo: null, cropId: "" });
      setShowDiseaseForm(false);
      
      // Reload fields to show updated disease data
      fetchFields();
    } catch (err) {
      console.error("Mark Disease Error:", err);
      
      const errorData = err.response?.data || {};
      const errorMsg = errorData.error || err.message;
      
      // Check if photo upload failed but POI was saved
      if (errorData.photoSkipped || errorMsg.includes('file') || errorMsg.includes('image')) {
        toast.warning(`Photo upload failed: ${errorMsg}\n\nDisease record saved without photo.`);
        
        // Reset form
        setDiseaseData({ name: "", symptom: "", severity: 5, photo: null, cropId: "" });
        setShowDiseaseForm(false);
        fetchFields();
      } else {
        toast.error(` Error: ${errorMsg}`);
      }
    }
  };

  // Sync field to crop management
  const handleSyncToCropManagement = async () => {
    if (!selectedField) return;
    try {
      const cropData = fieldToCrop(selectedField);
      console.log("Syncing crop data:", cropData);
      
      const res = await axios.post(`${API_BASE}/farmer/crops`, cropData, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      
      console.log("Sync response:", res.data);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
      toast.success('Field synced to Crop Management successfully!');
    } catch (err) {
      console.error('Sync error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error(`Sync failed: ${errorMsg}`);
    }
  };

  const filteredFields = fields.filter(
    (f) =>
      f.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.fieldCode && f.fieldCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="field-management">
      {/* SPLIT PANE LAYOUT */}
      <div className="management-container">
        {/* LEFT PANE - Field List */}
        <div className="field-list-pane">
          <div className="list-header">
            <h2>My Fields</h2>
            <button
              className="btn-new-field"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus size={18} /> New Field
            </button>
          </div>

          <input
            type="text"
            placeholder="Search fields..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="fields-list">
            {loading ? (
              <div className="loading">Loading fields...</div>
            ) : filteredFields.length === 0 ? (
              <div className="empty-state">
                <MapPin size={40} />
                <p>No fields yet. Create one to get started.</p>
              </div>
            ) : (
              filteredFields.map((field) => (
                <div
                  key={field._id}
                  className={`field-card ${selectedField?._id === field._id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedField(field);
                    // Load field's current location (which may have been pinned)
                    if (field.location?.coordinates) {
                      setFieldPinLocation({
                        latitude: field.location.coordinates[1],
                        longitude: field.location.coordinates[0]
                      });
                      console.log(' Loaded field location:', field.location.coordinates);
                    } else {
                      setFieldPinLocation(null);
                    }
                    // Clear crop pin when switching fields
                    setCropPinLocation(null);
                    // The useEffect will handle loading crops
                  }}
                >
                  <div className="field-card-header">
                    <h3>{field.fieldName}</h3>
                    <span className="field-code">{field.fieldCode}</span>
                  </div>
                  <div className="field-card-details">
                    <p>
                      <strong>Area:</strong> {field.areaInHectares} ha ({field.areaInAcres?.toFixed(2)} ac)
                    </p>
                    <p>
                      <strong>Soil:</strong> {field.soilType}
                    </p>
                    {field.currentCrop?.cropType && (
                      <p>
                        <strong>Crop:</strong> {field.currentCrop.cropType} - {field.currentCrop.variety}
                      </p>
                    )}
                  </div>
                  <div className="field-card-footer">
                    <span className="poi-count">POIs: {field.pois?.length || 0}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE - Field Details */}
        <div className="field-details-pane">
          {showForm ? (
            <div className="form-container">
              <h3>{isEditing ? "Edit Field" : "Create New Field"}</h3>

              <form onSubmit={handleSaveField} className="field-form">
                <div className="form-group">
                  <label>Field Name *</label>
                  <input
                    type="text"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                    placeholder="e.g., North Acre"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Field Code</label>
                  <input
                    type="text"
                    value={formData.fieldCode}
                    onChange={(e) => setFormData({ ...formData, fieldCode: e.target.value })}
                    placeholder="e.g., FIELD-001"
                  />
                </div>

                <div className="form-group">
                  <label>Area (Hectares) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.areaInHectares}
                    onChange={(e) => setFormData({ ...formData, areaInHectares: e.target.value })}
                    placeholder="e.g., 10.5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Soil Type</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  >
                    <option value="Loamy">Loamy</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Clay">Clay</option>
                    <option value="Silty">Silty</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label><MapPin size={16} /> Field Location</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.locationDisplay || 'No location set'}
                    onChange={(e) => {
                      setFormData({ ...formData, locationDisplay: e.target.value, locationName: e.target.value });
                      setManualLocationEdit(true);
                    }}
                      placeholder="Enter location or click 'Get GPS' to auto-fill"
                      style={{ flex: 1, backgroundColor: '#fff', cursor: 'text', border: '1px solid #ddd', padding: '6px' }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const position = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                          });
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          
                          // Get place name from coordinates (reverse geocoding)
                          const placeName = await getLocationName(lat, lng);
                          
                          // FIX #3: Only set GPS if NOT manually edited, or confirm override
                          if (manualLocationEdit) {
                            const userConfirm = window.confirm(
                              `GPS wants to set location to: ${placeName}\n\nKeep your current entry or use GPS location?\n\nOK = Use GPS, Cancel = Keep current`
                            );
                            if (!userConfirm) return;
                          }
                          
                          setFormData({
                            ...formData,
                            location: { type: 'Point', coordinates: [lng, lat] },
                            locationDisplay: placeName,
                            locationName: placeName
                          });
                          setManualLocationEdit(false);
                          toast.success(` GPS captured at: ${placeName}`);
                          console.log(' GPS Location updated:', { lat, lng, placeName });
                        } catch (err) {
                          toast.error(' GPS failed. Enable location access in browser settings.');
                          console.warn('GPS error:', err);
                        }
                      }}
                      style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      <MapPin size={16} /> Get GPS
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                    <Info size={14} /> Click "Get GPS" to auto-fill or type location name. GPS coordinates are required for disease marking and POI tracking.
                  </p>
                </div>

                <div className="divider">Current Crop</div>

                <div className="form-group">
                  <label>Crop Type</label>
                  <input
                    type="text"
                    value={formData.currentCrop.cropType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentCrop: { ...formData.currentCrop, cropType: e.target.value }
                      })
                    }
                    placeholder="e.g., Wheat"
                  />
                </div>

                <div className="form-group">
                  <label>Variety</label>
                  <input
                    type="text"
                    value={formData.currentCrop.variety}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentCrop: { ...formData.currentCrop, variety: e.target.value }
                      })
                    }
                    placeholder="e.g., Winter Wheat"
                  />
                </div>

                <div className="form-group">
                  <label>Planting Date</label>
                  <input
                    type="date"
                    value={formData.currentCrop.plantingDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentCrop: { ...formData.currentCrop, plantingDate: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Expected Harvest Date</label>
                  <input
                    type="date"
                    value={formData.currentCrop.expectedHarvestDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentCrop: { ...formData.currentCrop, expectedHarvestDate: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? "Saving..." : "Save Field"}
                  </button>
                  <button type="button" className="btn-cancel" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedField ? (
            <div className="details-container">
              <div className="details-header">
                <div>
                  <h3>{selectedField.fieldName}</h3>
                  <p className="field-code">{selectedField.fieldCode}</p>
                </div>
                <div className="details-actions">
                  <button 
                    className={`btn-icon sync ${syncSuccess ? 'success' : ''}`}
                    onClick={handleSyncToCropManagement}
                    title="Sync to Crop Management"
                  >
                    {syncSuccess ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                  <button className="btn-icon" onClick={() => handleEditField(selectedField)} title="Edit">
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDeleteField(selectedField._id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="details-info">
                <div className="info-group">
                  <h4>Field Information</h4>
                  <p>
                    <strong>Area:</strong> {selectedField.areaInHectares} hectares ({selectedField.areaInAcres?.toFixed(2)} acres)
                  </p>
                  <p>
                    <strong>Soil Type:</strong> {selectedField.soilType}
                  </p>
                  <p>
                    <strong>Status:</strong> <span className="status-badge">{selectedField.status}</span>
                  </p>
                </div>

                {/* WEATHER CARD */}
                {weatherMap[selectedField._id] && (
                  <div className="info-group weather-group">
                    <h4>Current Weather</h4>
                    <div className="weather-stats">
                      <p><Thermometer size={16}/> <strong>Temp:</strong> {weatherMap[selectedField._id].current.temp}°C</p>
                      <p><Droplets size={16}/> <strong>Humidity:</strong> {weatherMap[selectedField._id].current.humidity}%</p>
                      <p><Wind size={16}/> <strong>Wind:</strong> {weatherMap[selectedField._id].current.wind_speed} km/h</p>
                      <p><CloudRain size={16}/> <strong>Rain:</strong> {weatherMap[selectedField._id].current.rain_prob}%</p>
                    </div>
                  </div>
                )}

                {selectedField.currentCrop?.cropType && (
                  <div className="info-group">
                    <h4>Current Crop</h4>
                    <p>
                      <strong>Type:</strong> {selectedField.currentCrop.cropType}
                    </p>
                    {selectedField.currentCrop.variety && (
                      <p>
                        <strong>Variety:</strong> {selectedField.currentCrop.variety}
                      </p>
                    )}
                    {selectedField.currentCrop.plantingDate && (
                      <p>
                        <strong>Planting Date:</strong> {new Date(selectedField.currentCrop.plantingDate).toLocaleDateString()}
                      </p>
                    )}
                    {selectedField.currentCrop.expectedHarvestDate && (
                      <p>
                        <strong>Expected Harvest:</strong> {new Date(selectedField.currentCrop.expectedHarvestDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="info-group">
                  <h4>Records</h4>
                  <p>POIs: {selectedField.pois?.length || 0}</p>
                  <p>Disease History: {selectedField.diseaseHistory?.length || 0}</p>
                  <p>Disasters: {selectedField.disasterLogs?.length || 0}</p>
                </div>

                {/* DISPLAY REGISTERED CROPS FOR THIS FIELD */}
                {fieldCrops.length > 0 && (
                  <div className="info-group">
                    <h4><Sprout size={18} /> Registered Crops ({fieldCrops.length})</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {fieldCrops.map((crop) => (
                        <div key={crop._id} style={{ 
                          borderLeft: '3px solid #4CAF50', 
                          paddingLeft: '12px', 
                          marginBottom: '10px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #eee'
                        }}>
                          <p><strong>{crop.name}</strong> ({crop.category})</p>
                          <p style={{ fontSize: '0.85rem', color: '#666' }}>
                            <MapPin size={14} /> Area: {crop.area} {crop.unit}
                            {crop.location?.coordinates && ` • Pinned`}
                          </p>
                          {crop.season && <p style={{ fontSize: '0.85rem', color: '#666' }}><Sprout size={14} /> {crop.season}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CROP REGISTRATION SECTION */}
                <div className="info-group">
                  <h4><Sprout size={18} /> Register Crop for This Field</h4>
                  {!showCropForm ? (
                    <button 
                      className="btn-mark-disease"
                      onClick={() => setShowCropForm(true)}
                      style={{ backgroundColor: '#4CAF50' }}
                    >
                      <Sprout size={16} /> Register Crop
                    </button>
                  ) : (
                    <form onSubmit={handleRegisterCrop} className="disease-form">
                      <div className="form-group">
                        <label>Category *</label>
                        <select 
                          value={newCrop.category} 
                          onChange={(e) => setNewCrop({ ...newCrop, category: e.target.value, name: "" })} 
                          required
                        >
                          <option value="">Select Category</option>
                          {cropCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Crop Name *</label>
                        <input 
                          list="crop-names" 
                          value={newCrop.name} 
                          onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })} 
                          placeholder="Select or type crop name"
                          required
                        />
                        <datalist id="crop-names">
                          {(cropNames[newCrop.category] || []).map((c) => <option key={c} value={c} />)}
                        </datalist>
                      </div>

                      <div className="form-group">
                        <label>Area ({newCrop.unit}) *</label>
                        <input 
                          type="number" 
                          placeholder="Area" 
                          value={newCrop.area} 
                          onChange={(e) => setNewCrop({ ...newCrop, area: e.target.value })} 
                          required 
                          step="0.1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Unit</label>
                        <select value={newCrop.unit} onChange={(e) => setNewCrop({ ...newCrop, unit: e.target.value })}>
                          <option>Acre</option>
                          <option>Hectare</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Plantation Method</label>
                        <select value={newCrop.method} onChange={(e) => setNewCrop({ ...newCrop, method: e.target.value })}>
                          <option value="">Select Method</option>
                          {plantationMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Season</label>
                        <select value={newCrop.season} onChange={(e) => setNewCrop({ ...newCrop, season: e.target.value })}>
                          <option value="">Select Season</option>
                          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Sowing Date</label>
                        <input 
                          type="date" 
                          value={newCrop.sowingDate} 
                          onChange={(e) => setNewCrop({ ...newCrop, sowingDate: e.target.value })} 
                          required 
                        />
                      </div>

                      <div className="form-actions" style={{ marginTop: '10px' }}>
                        <button type="submit" className="btn-save" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                          Register Crop
                        </button>
                        <button 
                          type="button" 
                          className="btn-cancel" 
                          onClick={() => setShowCropForm(false)}
                          style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* DISEASE MARKING SECTION */}
                <div className="info-group">
                  <h4><AlertTriangle size={18} /> Disease Mark & Learn</h4>
                  {!showDiseaseForm ? (
                    <button 
                      className="btn-mark-disease"
                      onClick={() => setShowDiseaseForm(true)}
                    >
                      <AlertTriangle size={16} /> Report Disease
                    </button>
                  ) : (
                    <form onSubmit={handleMarkDisease} className="disease-form">
                      <div className="form-group">
                        <label>Select Crop for Disease Report *</label>
                        {fieldCrops.length === 0 ? (
                          <p style={{ color: '#ef4444', fontSize: '0.9rem' }}><AlertTriangle size={14} /> No registered crops. Please register a crop first.</p>
                        ) : (
                          <select
                            value={diseaseData.cropId || ""}
                            onChange={(e) => setDiseaseData({ ...diseaseData, cropId: e.target.value })}
                            required
                          >
                            <option value="">Select a crop...</option>
                            {fieldCrops.map(crop => (
                              <option key={crop._id} value={crop._id}>
                                {crop.name} ({crop.category}) - {crop.area} {crop.unit}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Disease Name *</label>
                        <input
                          type="text"
                          value={diseaseData.name}
                          onChange={(e) => setDiseaseData({ ...diseaseData, name: e.target.value })}
                          placeholder="e.g., Rust, Blight, Wilt"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Symptom</label>
                        <select
                          value={diseaseData.symptom}
                          onChange={(e) => setDiseaseData({ ...diseaseData, symptom: e.target.value })}
                        >
                          <option value="">Select symptom...</option>
                          {validSymptoms.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Severity (1-10): {diseaseData.severity}</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={diseaseData.severity}
                          onChange={(e) => setDiseaseData({ ...diseaseData, severity: parseInt(e.target.value) })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Photo Evidence</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setDiseaseData({ ...diseaseData, photo: e.target.files?.[0] })}
                        />
                        {diseaseData.photo && <p style={{ fontSize: '0.85rem', color: '#666' }}><Image size={14} /> {diseaseData.photo.name}</p>}
                      </div>

                      <div className="form-actions" style={{ marginTop: '10px' }}>
                        <button type="submit" className="btn-save" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>
                          Mark Disease
                        </button>
                        <button 
                          type="button" 
                          className="btn-cancel" 
                          onClick={() => setShowDiseaseForm(false)}
                          style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Field Map */}
              <div className="map-section">
                <h4>Field Map & POI Management</h4>
                {selectedField._id && (
                  <FieldMap 
                    key={selectedField._id} 
                    fieldId={selectedField._id} 
                    fieldLocation={selectedField.location}
                    fieldCrops={fieldCrops}
                    onCropPinned={(location) => {
                      setCropPinLocation(location);
                      console.log('Crop pinned at:', location);
                      // Note: Weather for crop will update after crop is registered and saved
                    }}
                    onFieldPinned={(location) => {
                      setFieldPinLocation(location);
                      console.log('Field pinned at:', location);
                      // Reload field and weather after pin is saved
                      setTimeout(() => {
                        fetchFields();
                        fetchWeather(location.latitude, location.longitude, selectedField._id);
                      }, 500);
                    }}
                    onPOISelect={(poi) => {
                      console.log('POI selected:', poi);
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="empty-details">
              <MapPin size={60} />
              <p>Select a field to view details and manage POIs</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} />
    </div>
  );
};

export default FieldManagement;
