import React, { useState } from 'react';
import { Megaphone, Send, Info } from 'lucide-react';

const ExpertAlerts = () => {
  return (
    <div className="expert-sub-page">
      <div className="alert-broadcast-card">
        <div className="alert-form-header">
          <Megaphone size={30} className="text-red-500" />
          <div>
            <h3>Broadcast New Alert</h3>
            <p>Notify all farmers about weather or disease outbreaks</p>
          </div>
        </div>

        <div className="e-form-group">
          <label>Alert Category</label>
          <select>
            <option>Weather Warning</option>
            <option>Pest Outbreak</option>
            <option>Market Fluctuations</option>
          </select>
        </div>

        <div className="e-form-group">
          <label>Alert Message</label>
          <textarea placeholder="Write the alert content here..."></textarea>
        </div>

        <button className="broadcast-btn">
          <Send size={18} /> Push Alert to Farmers
        </button>
      </div>
    </div>
  );
};

export default ExpertAlerts;