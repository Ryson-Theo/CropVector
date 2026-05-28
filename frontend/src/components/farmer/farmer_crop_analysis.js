// farmer_crop_analysis.js
import React, { useState } from "react";

const FarmerCropAnalysis = ({ onSuggest }) => {
  const [soilType, setSoilType] = useState("Loam");
  const [area, setArea] = useState(1);
  const [waterAvailability, setWaterAvailability] = useState("Moderate");
  const [suggestion, setSuggestion] = useState(null);

  const generateSuggestion = () => {
    const crops = [];
    if (soilType === "Loam") crops.push("Maize", "Tomato");
    if (soilType === "Clay") crops.push("Rice");
    if (waterAvailability === "High") crops.push("Paddy / Rice");

    const result = {
      crops,
      expectedYield: (area * 2).toFixed(1),
      notes: "This is a simple suggestion. Use Expert review for verification."
    };

    setSuggestion(result);
    if (onSuggest) onSuggest(result);
  };

  return (
    <div className="card" style={{ maxWidth: 920 }}>
      <h2 style={{ marginTop: 0 }}>Crop Analysis & Suggestions</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Soil Type</label>
          <select value={soilType} onChange={(e) => setSoilType(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option>Loam</option>
            <option>Clay</option>
            <option>Sandy</option>
            <option>Silty</option>
          </select>
        </div>

        <div>
          <label>Area (hectares)</label>
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>Water Availability</label>
          <select
            value={waterAvailability}
            onChange={(e) => setWaterAvailability(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="action-btn" onClick={generateSuggestion}>
            Generate Suggestion
          </button>
        </div>
      </div>

      {suggestion && (
        <div style={{ marginTop: 16 }}>
          <h3>Suggested Crops</h3>
          <p>
            <strong>Yield estimate:</strong> {suggestion.expectedYield} tons
          </p>
          <p>
            <strong>Crops:</strong> {suggestion.crops.join(", ")}
          </p>
          <p style={{ color: "#6b7280" }}>{suggestion.notes}</p>
        </div>
      )}
    </div>
  );
};

export default FarmerCropAnalysis;
