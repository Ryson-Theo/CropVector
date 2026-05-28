/**
 * PDF Export Service
 * Generates HTML reports for crop recommendations
 * The browser will handle PDF conversion via print-to-PDF or html2pdf.js
 */

exports.generateRecommendationPDF = (sessionId, farmer, climate, results) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
        h2 { color: #059669; margin-top: 30px; }
        .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
        .stat { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .value { font-size: 18px; color: #1f2937; }
        .crop-card { border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; background: white; }
        .profit { color: #10b981; font-weight: bold; font-size: 16px; }
        .loss { color: #ef4444; font-weight: bold; }
        .high-risk { background: #fee2e2; border-left: 4px solid #ef4444; }
        .medium-risk { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .low-risk { background: #dcfce7; border-left: 4px solid #10b981; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <h1> Crop Recommendation Report</h1>
      
      <div class="section">
        <h2>Session Information</h2>
        <div class="grid">
          <div class="card">
            <div class="stat">
              <span class="label">Session ID:</span>
              <div style="font-family: monospace; color: #0891b2;">${sessionId}</div>
            </div>
            <div class="stat">
              <span class="label">Generated:</span>
              <div class="value">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
          <div class="card">
            <div class="stat">
              <span class="label">Location:</span>
              <div class="value">${(typeof farmer.latitude === 'number' ? farmer.latitude : parseFloat(farmer.latitude) || 0).toFixed(4)}°N, ${(typeof farmer.longitude === 'number' ? farmer.longitude : parseFloat(farmer.longitude) || 0).toFixed(4)}°E</div>
            </div>
            <div class="stat">
              <span class="label">Land Size:</span>
              <div class="value">${farmer.landSize || 'N/A'} ${farmer.landUnit || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📍 Soil & Climate Profile</h2>
        <div class="grid">
          <div class="card">
            <h3 style="margin-top: 0;">Soil Parameters</h3>
            <div class="stat">
              <span class="label">pH:</span>
              <div class="value">${farmer.pH || 'N/A'}</div>
            </div>
            <div class="stat">
              <span class="label">Nitrogen (N):</span>
              <div class="value">${farmer.N || 'N/A'} kg/ha</div>
            </div>
            <div class="stat">
              <span class="label">Phosphorus (P):</span>
              <div class="value">${farmer.P || 'N/A'} kg/ha</div>
            </div>
            <div class="stat">
              <span class="label">Potassium (K):</span>
              <div class="value">${farmer.K || 'N/A'} kg/ha</div>
            </div>
            <div class="stat">
              <span class="label">Soil Type:</span>
              <div class="value">${farmer.soilTexture || 'N/A'}</div>
            </div>
            <div class="stat">
              <span class="label">Irrigation:</span>
              <div class="value">${farmer.hasIrrigation ? 'Yes' : 'Rain-fed'}</div>
            </div>
          </div>
          <div class="card">
            <h3 style="margin-top: 0;">Climate Conditions</h3>
            <div class="stat">
              <span class="label">Avg Yearly Rainfall:</span>
              <div class="value">${Math.round(climate.avgRainfall || climate.avg_yearly_rainfall || 0)} mm</div>
            </div>
            <div class="stat">
              <span class="label">Temperature Range:</span>
              <div class="value">${(climate.tempMin || climate.temp_extremes?.minObserved || 0)}°C to ${(climate.tempMax || climate.temp_extremes?.maxObserved || 0)}°C</div>
            </div>
            <div class="stat">
              <span class="label">Frost Risk:</span>
              <div class="value">${(climate.hasFrost || climate.temp_extremes?.hasFrost) ? '⚠️ Yes' : '✓ No'}</div>
            </div>
            <div class="stat">
              <span class="label">Heatwave Risk:</span>
              <div class="value">${(climate.hasHeatwave || climate.temp_extremes?.hasHeatwave) ? '⚠️ Yes' : '✓ No'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2> Top Crop Recommendations</h2>
        ${(results && results.length > 0) ? results.slice(0, 15).map(crop => `
          <div class="crop-card">
            <h3 style="margin-top: 0;">${crop.name || 'Unknown Crop'}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
              <div>
                <span class="label">Suitability</span>
                <div class="value">${crop.suitabilityScore || 0}% (${crop.suitabilityLevel || 'Unknown'})</div>
              </div>
              <div>
                <span class="label">Adjusted Yield</span>
                <div class="value">${crop.adjustedYield || 0}t/ha</div>
              </div>
              <div>
                <span class="label">Market Price</span>
                <div class="value">₹${crop.marketPrice || 0}/q</div>
              </div>
              <div>
                <span class="label">Expected Profit</span>
                <div class="profit">₹${crop.expectedProfit || 0}/ha</div>
              </div>
            </div>

            <h4>Cost Breakdown</h4>
            <table>
              <tr>
                <th>Cost Item</th>
                <th>Amount</th>
              </tr>
              <tr>
                <td>Nitrogen (N) Gap Cost</td>
                <td>₹${crop.nitrogenGapCost || 0}</td>
              </tr>
              <tr>
                <td>Seed Cost</td>
                <td>₹${crop.seedCost || 0}</td>
              </tr>
              <tr style="background: #f3f4f6; font-weight: bold;">
                <td>Total Cost</td>
                <td>₹${crop.totalCost || 0}</td>
              </tr>
            </table>

            <h4>Disease & Pest Risk</h4>
            ${crop.pestRisk ? `
              <div class="${crop.pestRisk.overallRisk === 'High' ? 'high-risk' : crop.pestRisk.overallRisk === 'Medium' ? 'medium-risk' : 'low-risk'}" style="padding: 15px; border-radius: 8px;">
                <strong>Overall Risk: ${crop.pestRisk.overallRisk || 'Unknown'}</strong>
                <div style="margin-top: 10px;">
                  ${crop.pestRisk.diseases && crop.pestRisk.diseases.length > 0 ? `
                    <strong>Identified Risks:</strong>
                    <ul>
                      ${crop.pestRisk.diseases.map(d => `<li>${d.name || 'Unknown'}: ${(d.risk || 'unknown').toUpperCase()}</li>`).join('')}
                    </ul>
                    <strong>Recommendations:</strong>
                    <ul>
                      ${(crop.pestRisk.recommendations || []).slice(0, 3).map(r => `<li>${r || 'N/A'}</li>`).join('')}
                    </ul>
                  ` : '<p>No major disease/pest risks identified for current climate conditions.</p>'}
                </div>
              </div>
            ` : '<p style="color: #6b7280; background: #f3f4f6; padding: 10px; border-radius: 5px;">⚠️ Disease/pest risk assessment not available for this crop.</p>'}

            <h4>Key Factors</h4>
            <ul>
              ${(crop.reasons && crop.reasons.length > 0) ? crop.reasons.slice(0, 4).map(r => `<li>${r || 'N/A'}</li>`).join('') : '<li>No detailed reasons available</li>'}
            </ul>
          </div>
        `).join('') : '<p style="background: #fef3c7; padding: 15px; border-radius: 8px;">No crop recommendations available for this profile.</p>'}
      </div>

      <div class="footer">
        <p><strong> Disclaimer:</strong> This is a technical analysis based on current climate data, soil conditions, and crop standards. Actual yields and profits may vary based on farm management, labor costs, market fluctuations, and pest outbreaks. Please consult local agricultural experts before making final decisions.</p>
        <p>Generated by CropVector - Crop Recommendation System for Indian Farmers</p>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

