const { v4: uuidv4 } = require('uuid');
const Recommendation = require('../models/Recommendation');
const soilService = require('../services/soilService');
const weatherService = require('../services/weatherService');
const recommendationService = require('../services/recommendationService');
const mandiService = require('../services/mandiService');
const pestService = require('../services/pestService');

exports.recommend = async (req, res) => {
  const sessionId = uuidv4();
  const input = req.body;

  try {    const { latitude, longitude } = input;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude & Longitude required' });
    }

    /* ─────────────────────────────────────
       1. PARALLEL EXTERNAL DATA FETCH
       (Soil + Climate baseline in parallel)
    ───────────────────────────────────── */    const [soilAuto, climate] = await Promise.all([
      soilService.getSoilAt(latitude, longitude, {
        pH: input.pH,
        N: input.N,
        P: input.P,
        K: input.K,
        soilTexture: input.soilTexture
      }),
      weatherService.getClimateBaseline(latitude, longitude)
    ]);    /* ─────────────────────────────────────
       2. SOIL DATA MERGE (AUTO → MANUAL)
    ───────────────────────────────────── */
    const farmer = {
      ...input,
      pH: soilAuto?.ph ?? input.pH ?? 6.5,
      N: Number(soilAuto?.N ?? input.N ?? 50), // Convert to number
      P: Number(soilAuto?.P ?? input.P ?? 20),
      K: Number(soilAuto?.K ?? input.K ?? 150),
      soilTexture: soilAuto?.texture ?? input.soilTexture ?? 'loam', // Ensure always set
      dataSource: soilAuto?.source === 'kaegro' ? 'kaegro' : 'manual',
      hasIrrigation: input.hasIrrigation ?? false
    };    /* ─────────────────────────────────────
       3a. RULE ENGINE EXECUTION (baseline)
    ───────────────────────────────────── */    let results = recommendationService.generateRecommendations(
      farmer,
      climate,
      {} // Empty mandi prices on first pass
    );    /* ─────────────────────────────────────
       3b. FETCH LIVE MANDI PRICES for top crops
    ───────────────────────────────────── */
    const topCropNames = results.slice(0, 5).map(r => r.name);    const mandiPrices = await mandiService.getMandiPrices(topCropNames).catch(e => {      return {};
    });

    /* ─────────────────────────────────────
       3c. REGENERATE with live prices
    ───────────────────────────────────── */    results = recommendationService.generateRecommendations(
      farmer,
      climate,
      mandiPrices
    );

    /* ─────────────────────────────────────
       3d. ADD PEST/DISEASE RISK ASSESSMENT
    ───────────────────────────────────── */    results = results.map(crop => ({
      ...crop,
      pestRisk: pestService.assessPestRisk(crop.name, climate)
    }));

    /* ─────────────────────────────────────
       4. SAVE SESSION (AUDIT-SAFE)
    ───────────────────────────────────── */    await Recommendation.create({
      sessionId,
      timestamp: new Date(),
      location: { latitude, longitude },
      input: farmer, // Include the farmer profile as input
      farmer,
      climate,
      mandiPricesUsed: Object.keys(mandiPrices).length > 0,
      results
    });    res.json({
      sessionId,
      climate: {
        avgRainfall: Math.round(climate.avg_yearly_rainfall || climate.avgRainfall || 0),
        tempMin: climate.temp_extremes?.minObserved || climate.tempMin || 0,
        tempMax: climate.temp_extremes?.maxObserved || climate.tempMax || 0,
        hasFrost: climate.temp_extremes?.hasFrost || false,
        hasHeatwave: climate.temp_extremes?.hasHeatwave || false,
        forecast: climate.current_forecast || {}
      },
      soilConfidence: farmer.dataSource === 'kaegro' ? 'Medium (Satellite via Kaegro)' : 'High (Manual Input)',
      dataSource: farmer.dataSource,
      results: results // Return all results (at least 10 or more)
    });

  } catch (err) {    res.status(500).json({ error: 'Recommendation engine failed', details: err.message });
  }
};

