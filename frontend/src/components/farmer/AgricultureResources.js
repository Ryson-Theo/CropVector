// frontend/src/components/farmer/AgricultureResources.js
import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Youtube,
  BookOpen,
  Sprout,
  Video,
  Phone,
  Navigation,
  Crosshair,
  Filter,
  Tractor,
  Info
} from "lucide-react";
import { toast } from "react-toastify";
import "./AgricultureResources.css";

/* ===================== MAP PINNING ===================== */
const MapPinningTool = ({ onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    import("leaflet").then((L) => {
      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        map.on("click", (e) => {
          updateLocation(e.latlng.lat, e.latlng.lng, null, map, L);
        });

        mapInstanceRef.current = map;
      }
    });

    return () => mapInstanceRef.current?.remove();
  }, []);

  const updateLocation = (lat, lng, acc, map, L) => {
    setCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    if (acc) setAccuracy(acc);

    if (marker) map.removeLayer(marker);

    const newMarker = L.marker([lat, lng]).addTo(map);
    setMarker(newMarker);
    map.setView([lat, lng], 16);

    onLocationSelect?.({ lat, lng, accuracy: acc });
  };

  const getGPSLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          mapInstanceRef.current,
          window.L
        );
        toast.success("Location detected");
      },
      () => toast.error("Unable to fetch GPS location")
    );
  };

  const copyCoords = () => {
    navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="map-pinning-tool">
      <div className="map-controls-bar">
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
          <Info size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
          Click on the map or use GPS to pinpoint location.
        </p>
        <button onClick={getGPSLocation} className="gps-btn">
          <Navigation size={16} /> Use GPS
        </button>
      </div>

      <div ref={mapRef} className="resource-map" style={{ height: 400 }} />

      {coords && (
        <div className="coords-display">
          <div className="coord-group">
            <span className="coord-label">Latitude:</span>
            <code className="coord-value">{coords.lat}</code>
          </div>
          <div className="coord-group">
            <span className="coord-label">Longitude:</span>
            <code className="coord-value">{coords.lng}</code>
          </div>
          {accuracy && (
            <div className="accuracy-badge">
              <Crosshair size={14} /> ±{Math.round(accuracy)}m
            </div>
          )}
          <button className="copy-btn" onClick={copyCoords}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
};

/* ===================== MAIN COMPONENT ===================== */
const AgricultureResources = () => {
  const [resources, setResources] = useState(null);
  const [activeTab, setActiveTab] = useState("knowledge");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [ytLanguage, setYtLanguage] = useState(null);
  const [machineryCategory, setMachineryCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data);

        setSelectedCategory(Object.keys(data.knowledge_hub)[0]);
        setYtLanguage(Object.keys(data.youtubeDirectory)[0]);
        setMachineryCategory(Object.keys(data.machinery)[0]);
      })
      .catch(() => toast.error("Failed to load resources"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!resources) return null;

  const { knowledge_hub, youtubeDirectory, machinery } = resources;

  const headerKeyMap = {
    "Machine": "machine",
    "Brand/Manufacturer": "brand",
    "Price Range (₹)": "price",
    "Power Range": "power",
    "Best For": "bestFor",
    "Dealer Locator": "dealerLocator",
    "Tool/Machine": "tool",
    "Type": "type",
    "Use": "use",
    "Manufacturers": "manufacturers",
    "Crop": "crop",
    "Equipment": "equipment",
    "Purpose": "purpose",
    "Platform": "platform",
    "URL": "url",
    "Payment Options": "payment"
  };

  return (
    <div className="agriculture-resources">
      <style>{`
        .resource-intro {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 32px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .resource-intro h2 {
          margin-top: 0;
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .resource-intro p {
          color: #4b5563;
          margin-bottom: 0;
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .kh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          padding: 20px 0;
        }
        .kh-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          height: 100%;
        }
        .kh-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #10b981;
        }
        .kh-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 12px;
        }
        .kh-title {
          font-weight: 700;
          font-size: 1.1rem;
          color: #111827;
          margin: 0;
          line-height: 1.4;
        }
        .kh-type {
          font-size: 0.75rem;
          padding: 4px 10px;
          background: #ecfdf5;
          color: #059669;
          border-radius: 999px;
          font-weight: 600;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .kh-desc {
          color: #4b5563;
          font-size: 0.95rem;
          margin-bottom: 20px;
          flex-grow: 1;
          line-height: 1.5;
        }
        .kh-features {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #f3f4f6;
        }
        .kh-features h5 {
          margin: 0 0 10px 0;
          font-size: 0.8rem;
          color: #374151;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .kh-features ul {
          margin: 0;
          padding-left: 0;
          list-style: none;
        }
        .kh-features li {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .kh-features li:before {
          content: "•";
          color: #10b981;
          font-weight: bold;
        }
        .kh-features li:last-child {
          margin-bottom: 0;
        }
        .kh-action {
          margin-top: auto;
        }
        .btn-visit-card {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #111827;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
          width: 100%;
          justify-content: center;
        }
        .btn-visit-card:hover {
          background: #1f2937;
          transform: translateY(-1px);
        }
        /* Map Section Styles */
        .map-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .map-section h2 {
          margin-top: 0;
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 16px;
        }
        .map-pinning-tool {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .map-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
          flex-wrap: wrap;
          gap: 10px;
        }
        .gps-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.9rem;
        }
        .gps-btn:hover {
          background: #1d4ed8;
        }
        .resource-map {
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          z-index: 0;
        }
        .coords-display {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 16px;
          border-radius: 8px;
          flex-wrap: wrap;
        }
        .coord-group {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #dcfce7;
        }
        .coord-label {
          font-size: 0.85rem;
          color: #166534;
          font-weight: 600;
        }
        .coord-value {
          font-family: monospace;
          font-size: 0.95rem;
          color: #111827;
        }
        .accuracy-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: #15803d;
          background: #dcfce7;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 500;
        }
        .copy-btn {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .copy-btn:hover {
          background: #dcfce7;
          transform: translateY(-1px);
        }
      `}</style>
      <header className="resources-header">
        <h1><Sprout size={32} className="text-green-600" /> CropVector Resource Hub</h1>
        <p>Professional Agriculture Knowledge, Tools & Machinery Database</p>
      </header>

      <div className="resource-intro">
        <h2><Info size={24} className="text-green-600" /> About & Instructions</h2>
        <p>
          <strong>CropVector Resource Hub</strong> aggregates essential farming data to support your agricultural decisions. 
          Use the <strong>Knowledge Hub</strong> to browse verified agricultural practices and crop guides. 
          The <strong>YouTube</strong> section offers curated video tutorials in multiple languages. 
          Consult the <strong>Machinery</strong> tab for equipment specifications. 
          Use the <strong>Land Location Mapper</strong> below to pin-point your field coordinates for accurate weather and soil data.
        </p>
      </div>

      <section className="map-section">
        <h2><MapPin size={24} className="text-blue-600" /> Land Location Mapper</h2>
        <MapPinningTool />
      </section>

      <div className="resource-tabs">
        <button onClick={() => setActiveTab("knowledge")} className={activeTab === "knowledge" ? "active" : ""}>
          <BookOpen size={16} /> Knowledge Hub
        </button>
        <button onClick={() => setActiveTab("youtube")} className={activeTab === "youtube" ? "active" : ""}>
          <Video size={16} /> YouTube
        </button>
        <button onClick={() => setActiveTab("machinery")} className={activeTab === "machinery" ? "active" : ""}>
          <Tractor size={16} /> Machinery
        </button>
      </div>

      {/* ================= KNOWLEDGE HUB ================= */}
      {activeTab === "knowledge" && (
        <div className="knowledge-section">
          <div className="category-sidebar">
            {Object.entries(knowledge_hub).map(([key, cat]) => (
              <button
                key={key}
                className={selectedCategory === key ? "category-btn active" : "category-btn"}
                onClick={() => setSelectedCategory(key)}
              >
                {cat.category_name}
              </button>
            ))}
          </div>

          <div className="knowledge-container">
            <div className="category-header">
              <h3>{knowledge_hub[selectedCategory].category_name}</h3>
              <p>{knowledge_hub[selectedCategory].description}</p>
            </div>

            <div className="kh-grid">
              {knowledge_hub[selectedCategory].resources.map((r, i) => (
                <div className="kh-card" key={i}>
                  <div className="kh-header">
                    <h4 className="kh-title">{r.name}</h4>
                    <span className="kh-type">{r.type}</span>
                  </div>
                  <p className="kh-desc">{r.description}</p>
                  {r.features && r.features.length > 0 && (
                    <div className="kh-features">
                      <h5>Key Features</h5>
                      <ul>
                        {r.features.slice(0, 3).map((f, j) => <li key={j}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="kh-action">
                    <a href={r.url} target="_blank" rel="noreferrer" className="btn-visit-card">
                      View Resource <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= YOUTUBE ================= */}
      {activeTab === "youtube" && (
        <>
          <div className="filter-bar">
            <Filter size={16} />
            <select value={ytLanguage} onChange={(e) => setYtLanguage(e.target.value)} className="lang-select">
              {Object.keys(youtubeDirectory).map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="youtube-grid">
            {youtubeDirectory[ytLanguage].map((ch, i) => (
              <div className="youtube-card" key={i}>
                <h4><Youtube size={18} /> {ch.name}</h4>
                <p>{ch.focus}</p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ch.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="yt-visit-btn"
                >
                  Open Channel
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= MACHINERY ================= */}
      {activeTab === "machinery" && (
        <>
          <div className="machinery-tabs">
            {Object.keys(machinery).map((k) => (
              <button
                key={k}
                onClick={() => setMachineryCategory(k)}
                className={machineryCategory === k ? "active" : ""}
              >
                {machinery[k].title}
              </button>
            ))}
          </div>

          <table className="resource-table">
            <thead>
              <tr>
                {machinery[machineryCategory].headers.map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {machinery[machineryCategory].data.map((row, i) => (
                <tr key={i}>
                  {machinery[machineryCategory].headers.map((h, j) => {
                    const val = row[headerKeyMap[h]];
                    return (
                      <td key={j}>
                        {typeof val === "string" && val.startsWith("http") ? (
                          <a href={val} target="_blank" rel="noreferrer" className="btn-visit">
                            Visit <ExternalLink size={14} />
                          </a>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <section className="helpline-section">
        <h3><Phone size={18} /> Farmer Helplines</h3>
        <div className="helpline-grid">
          <a href="tel:18001801551" className="helpline-card">
            <span className="hl-number">1800-180-1551</span>
            <span className="hl-name">Kisan Call Center</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default AgricultureResources;