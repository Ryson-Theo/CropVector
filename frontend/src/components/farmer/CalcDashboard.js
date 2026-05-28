import React, { useState, useRef } from "react";
import "./CalcDashboard.css";
import { MANDI_OPTIONS } from "../../services/mandiMarketService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Cell } from "recharts";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  Sprout,
  Beaker,
  Bug,
  Users,
  Droplets,
  Cog,
  Home,
  MapPin,
  TrendingUp,
  IndianRupee,
  Calculator
} from "lucide-react";

/* --------------------------------------------------------------
   TAB
-------------------------------------------------------------- */
const Tab = ({ active, label, onClick }) => (
  <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
    {label}
  </button>
);

/* --------------------------------------------------------------
   HELPERS
-------------------------------------------------------------- */
const toNum = (v) => parseFloat(v) || 0;

const capROI = (roi) => {
  if (roi > 999) return "999%+";
  if (roi < -999) return "-999%";
  return `${roi.toFixed(2)}%`;
};

const profitBadge = (profit) => {
  if (profit < 0) return { label: "Loss", cls: "badge loss" };
  if (profit < 0.1) return { label: "High Risk", cls: "badge risk" };
  return { label: "Profitable", cls: "badge profit" };
};

/* --------------------------------------------------------------
   INPUTS PANEL
-------------------------------------------------------------- */
const InputsPanel = ({
  prod, setProd,
  land, setLand,
  harvest, setHarvest,
  expectedPrice, setExpectedPrice,
  selectedState, setSelectedState,
  errors
}) => {
  const info = MANDI_OPTIONS?.[selectedState];

  return (
    <section className="panel inputs-panel">
      <h3>Farmer-Side Inputs</h3>

      <fieldset className="fieldset">
        <legend>Production Expenses (₹)</legend>
        {Object.entries(prod).map(([k, v]) => {
          const labels = {
            seedCost: { text: "Seeds Cost", icon: Sprout },
            fertCost: { text: "Fertilizer Cost", icon: Beaker },
            pestCost: { text: "Pesticide Cost", icon: Bug },
            labSow: { text: "Labor - Planting/Sowing", icon: Users },
            labHarv: { text: "Labor - Harvesting", icon: Users },
            irrig: { text: "Irrigation/Water Cost", icon: Droplets },
            mach: { text: "Machine Rental Cost", icon: Cog }
          };
          const labelInfo = labels[k] || { text: k.replace(/([A-Z])/g, " $1"), icon: null };
          return (
            <label key={k}>
              {labelInfo.icon && <labelInfo.icon size={16} />} {labelInfo.text}
              <input
                type="number"                min="0"
                step="0.01"                placeholder="₹ Enter amount"
                value={v}
                onChange={(e) => setProd({ ...prod, [k]: e.target.value })}
              />
            </label>
          );
        })}
      </fieldset>

      <fieldset className="fieldset">
        <legend>Land Factors</legend>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={land.isOwned}
            onChange={(e) => setLand({ ...land, isOwned: e.target.checked })}
          />
          Self-owned land (no lease cost)
        </label>

        <label>
          <Home size={16} /> Annual Lease Cost (₹)
          <input
            type="number"
            min="0"
            placeholder="e.g., 5000"
            disabled={land.isOwned}
            value={land.leaseCost}
            onChange={(e) => setLand({ ...land, leaseCost: e.target.value })}
          />
        </label>

        <label>
          <MapPin size={16} /> Cultivated area (hectares)
          <input
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g., 2.5"
            value={land.area}
            className={errors.area ? "error" : ""}
            onChange={(e) => setLand({ ...land, area: e.target.value })}
          />
          {errors.area && <small className="error-text">{errors.area}</small>}
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Harvest Volume</legend>

        <label>
          <TrendingUp size={16} /> Yield (quintals per hectare)
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g., 50"
            value={harvest.yieldQt}
            className={errors.yield ? "error" : ""}
            onChange={(e) => setHarvest({ ...harvest, yieldQt: e.target.value })}
          />
          {errors.yield && <small className="error-text">{errors.yield}</small>}
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Expected Selling Price</legend>
        <label>
          <IndianRupee size={16} /> Expected Selling Price (₹ per quintal)
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g., 2500"
            value={expectedPrice}
            className={errors.price ? "error" : ""}
            onChange={(e) => setExpectedPrice(e.target.value)}
          />
          {errors.price && <small className="error-text">{errors.price}</small>}
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Live Mandi Prices (Reference)</legend>
        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
          {Object.entries(MANDI_OPTIONS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {info?.iframeUrl && (
          <div className="mandi-wrapper">
            <iframe src={info.iframeUrl} title="Mandi" />
          </div>
        )}
      </fieldset>
    </section>
  );
};

/* --------------------------------------------------------------
   RESULTS PANEL
-------------------------------------------------------------- */
const ResultsPanel = ({
  mandiNet, onlineNet,
  roiMandi, roiOnline,
  breakEven,
  profitGap,
  exportCSV,
  exportPDF,
  chartRef
}) => {
  const mandiBadge = profitBadge(mandiNet);
  const onlineBadge = profitBadge(onlineNet);

  const chartData = [
    { name: "Mandi", profit: mandiNet },
    { name: "Online", profit: onlineNet }
  ];

  return (
    <section className="panel results-panel" ref={chartRef}>
      <h3>Results</h3>

      <div className="badges">
        <span className={mandiBadge.cls}>Mandi: {mandiBadge.label}</span>
        <span className={onlineBadge.cls}>Online: {onlineBadge.label}</span>
      </div>

      <table className="compare-table">
        <tbody>
          <tr><td>Mandi Net Profit</td><td>₹ {mandiNet.toFixed(2)}</td></tr>
          <tr><td>Online Net Profit</td><td>₹ {onlineNet.toFixed(2)}</td></tr>
          <tr><td>ROI (Mandi)</td><td>{capROI(roiMandi)}</td></tr>
          <tr><td>ROI (Online)</td><td>{capROI(roiOnline)}</td></tr>
          <tr><td>Break-Even Price</td><td>₹ {breakEven.toFixed(2)} / qt</td></tr>
          <tr><td colSpan="2">Profit Gap: <strong>₹ {profitGap.toFixed(2)}</strong></td></tr>
        </tbody>
      </table>

      <h4>Profit Comparison</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip formatter={(v) => `₹ ${v.toLocaleString()}`} />
  <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
    <Cell fill="#2563eb" /> {/* Mandi – Blue */}
    <Cell fill="#16a34a" /> {/* Online – Green */}
  </Bar>
</BarChart>

      </ResponsiveContainer>

      <div className="export-actions">
        <button onClick={exportCSV}>Export CSV</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>
    </section>
  );
};

/* --------------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------------- */
export default function CalcDashboard() {
  const chartRef = useRef();

  const [prod, setProd] = useState({
    seedCost: "", fertCost: "", pestCost: "",
    labSow: "", labHarv: "", irrig: "", mach: ""
  });

  const [land, setLand] = useState({ isOwned: true, leaseCost: "", area: "" });
  const [harvest, setHarvest] = useState({ yieldQt: "" });
  const [expectedPrice, setExpectedPrice] = useState("");
  const [selectedState, setSelectedState] = useState("national");
  const [activeTab, setActiveTab] = useState("calc");

  const errors = {
    area: land.area <= 0 ? "Area must be > 0" : "",
    yield: harvest.yieldQt <= 0 ? "Yield must be > 0" : "",
    price: expectedPrice <= 0 ? "Price must be > 0" : ""
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const totalCost =
    Object.values(prod).reduce((s, v) => s + toNum(v), 0) +
    (land.isOwned ? 0 : toNum(land.leaseCost));

  const totalQt = toNum(land.area) * toNum(harvest.yieldQt);
  const mandiRevenue = totalQt * toNum(expectedPrice);
  const onlineRevenue = mandiRevenue * 1.43;

  const mandiNet = mandiRevenue - totalCost;
  const onlineNet = onlineRevenue - totalCost;

  const roiMandi = totalCost ? (mandiNet / totalCost) * 100 : 0;
  const roiOnline = totalCost ? (onlineNet / totalCost) * 100 : 0;

  const breakEven = totalQt ? totalCost / totalQt : 0;
  const profitGap = onlineNet - mandiNet;

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Cost", totalCost],
      ["Mandi Profit", mandiNet],
      ["Online Profit", onlineNet],
      ["Break-even Price", breakEven],
      ["ROI Mandi", roiMandi],
      ["ROI Online", roiOnline]
    ];
    const csv = "data:text/csv;charset=utf-8," +
      rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = "profit_report.csv";
    a.click();
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(chartRef.current);
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.text("Farm Profitability Report", 20, 20);
    pdf.addImage(img, "PNG", 10, 30, 180, 120);
    pdf.save("profit_report.pdf");
  };

  return (
    <div className="calc-dashboard">
      <h1><Calculator size={28} /> Farm-to-Market Profit Calculator</h1>

      <div className="tab-nav">
        <Tab active={activeTab === "calc"} label="Calculator" onClick={() => setActiveTab("calc")} />
        <Tab active={activeTab === "results"} label="Results" onClick={() => setActiveTab("results")} />
      </div>

      {activeTab === "calc" ? (
        <InputsPanel
          prod={prod} setProd={setProd}
          land={land} setLand={setLand}
          harvest={harvest} setHarvest={setHarvest}
          expectedPrice={expectedPrice} setExpectedPrice={setExpectedPrice}
          selectedState={selectedState} setSelectedState={setSelectedState}
          errors={errors}
        />
      ) : (
        !hasErrors && (
          <ResultsPanel
            mandiNet={mandiNet}
            onlineNet={onlineNet}
            roiMandi={roiMandi}
            roiOnline={roiOnline}
            breakEven={breakEven}
            profitGap={profitGap}
            exportCSV={exportCSV}
            exportPDF={exportPDF}
            chartRef={chartRef}
          />
        )
      )}
    </div>
  );
}
