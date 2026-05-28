const UREA_PRICE_PER_KG = 6; // ₹ per kg, subsidized India price
const BASE_SEED_COST = 2000; // ₹ per hectare (approximate)

exports.generateRecommendations = (farmer, climate, mandiPrices = {}) => {
  // Defensive defaults
  if (!farmer) farmer = {};
  if (!climate) climate = {};
  if (!mandiPrices) mandiPrices = {};

  // Set defaults for critical fields
  farmer.pH = farmer.pH ?? 6.5;
  farmer.N = farmer.N ?? 50;
  farmer.P = farmer.P ?? 20;
  farmer.K = farmer.K ?? 150;
  farmer.soilTexture = farmer.soilTexture ?? 'loam';
  farmer.hasIrrigation = farmer.hasIrrigation ?? false;
  farmer.dataSource = farmer.dataSource ?? 'manual';

  climate.avgRainfall = climate.avgRainfall ?? 800;
  climate.tempMin = climate.tempMin ?? 5;
  climate.tempMax = climate.tempMax ?? 35;

  const cropData = require('../data/crops.json');
  const results = [];

  cropData.forEach((crop) => {
    const score = calculateSuitabilityScore(farmer, climate, crop);
    
    if (score.passesHardFilters) {
      // Get mandi price; fallback to crop.json price if not in API
      const mandiPrice = mandiPrices[crop.name] || crop.marketPrice;
      
      // Calculate adjusted yield (with penalties)
      const adjustedYield = score.baseYield * score.yieldMultiplier;
      
      // Calculate costs
      const nitrogenGapCost = (score.gapN > 0) ? score.gapN * UREA_PRICE_PER_KG : 0;
      const totalCost = nitrogenGapCost + BASE_SEED_COST;
      
      // Calculate expected profit (per hectare)
      // Note: adjustedYield is in TONS, mandiPrice is per QUINTAL (100kg)
      // So we multiply yield (tons) by 10 to convert to quintals
      const yieldInQuintals = adjustedYield * 10;
      const expectedProfit = (yieldInQuintals * mandiPrice) - totalCost;
      
      results.push({
        name: crop.name,
        minPH: crop.minPH,
        optimalPH: crop.optimalPH,
        suitabilityScore: Math.round(score.overallScore * 100),
        suitabilityLevel: score.overallScore >= 0.8 ? 'High' : score.overallScore >= 0.6 ? 'Medium' : 'Low',
        reasons: score.reasons,
        
        // Yield & Profitability
        baseYield: crop.baseYield,
        adjustedYield: Math.round(adjustedYield * 100) / 100,
        yieldMultiplier: Math.round(score.yieldMultiplier * 100),
        marketPrice: mandiPrice,
        expectedProfit: Math.round(expectedProfit),
        
        // Cost Breakdown
        nitrogenGapKg: Math.max(0, score.gapN),
        nitrogenGapCost: Math.round(nitrogenGapCost),
        seedCost: BASE_SEED_COST,
        totalCost: Math.round(totalCost),
        
        // Water & Soil
        waterNeedsPerYear: crop.waterNeeds,
        avgRainfallPerYear: Math.round(climate.avgRainfall),
        irrigationRequired: crop.waterNeeds > climate.avgRainfall,
        suitableSoilTypes: crop.suitableSoil,
        farmerSoilTexture: farmer.soilTexture,
        soilTextureMatch: crop.suitableSoil.includes(farmer.soilTexture),
        
        // Climate
        tempMin: climate.tempMin,
        tempMax: climate.tempMax,
        frostRisk: score.hasFrost && crop.sensitiveToFrost,
        heatwaveRisk: score.hasHeatwave && crop.sensitiveToHeat,
        
        // Data Quality
        confidence: farmer.dataSource === 'manual' ? 'High' : 'Medium',
        dataSourceInfo: farmer.dataSource === 'manual' 
          ? 'Manual soil input by farmer' 
          : 'Soil data auto-filled via Kaegro satellite'
      });
    }
  });

  // Sort by suitability score descending
  results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  
  return results;
};

const calculateSuitabilityScore = (farmer, climate, crop) => {
  let score = 1.0;
  let yieldMultiplier = 1.0;
  const reasons = [];
  let gapN = 0;
  let passesHardFilters = true;

  // Defensive checks
  if (!crop.suitableSoil || !Array.isArray(crop.suitableSoil)) {
    crop.suitableSoil = ['loam']; // Default fallback
  }
  if (!farmer.soilTexture) {
    farmer.soilTexture = 'loam'; // Default fallback
  }
  if (climate.avgRainfall == null) {
    climate.avgRainfall = 800; // Default fallback
  }

  // Hard Filters (relax to allow more crops with soft penalties instead)
  const hasSuitableSoil = crop.suitableSoil.includes(farmer.soilTexture);
  const phInRange = farmer.pH >= crop.minPH && farmer.pH <= (crop.maxPH || 8.0);
  const waterSufficient = farmer.hasIrrigation || climate.avgRainfall >= crop.waterNeeds * 0.6; // Relaxed from 0.8

  // Only reject if BOTH soil AND pH are critically unsuitable (allow diversity in results)
  if (!hasSuitableSoil && !phInRange) {
    passesHardFilters = false;
    reasons.push(`Critical mismatch: soil and pH both unsuitable`);
  }

  if (!passesHardFilters) {
    return { 
      overallScore: 0, 
      baseYield: 0, 
      yieldMultiplier: 0, 
      reasons, 
      gapN: 0,
      passesHardFilters: false,
      hasFrost: false,
      hasHeatwave: false
    };
  }

  // Soft Penalties (reduce score/yield if not ideal)
  
  // Soil mismatch penalty
  if (!hasSuitableSoil) {
    score -= 0.15; // Soft penalty
    reasons.push(`Soil type ${farmer.soilTexture} not ideal (prefer: ${crop.suitableSoil.join(', ')})`);
  }

  // pH penalty (only if out of range, not just suboptimal)
  if (!phInRange) {
    const phDiff = Math.min(
      Math.abs(farmer.pH - crop.minPH),
      Math.abs(farmer.pH - (crop.maxPH || 8.0))
    );
    score -= phDiff * 0.08; // Soft penalty based on distance
    reasons.push(`pH ${farmer.pH} outside ideal range [${crop.minPH}, ${crop.maxPH || 8.0}]`);
  } else if (Math.abs(farmer.pH - crop.optimalPH) <= 0.2) {
    // Bonus for optimal pH
    score += 0.1;
    reasons.push(`pH ${farmer.pH} is optimal for this crop`);
  }

  // Water adequacy check
  if (!waterSufficient && climate.avgRainfall < crop.waterNeeds * 0.4) {
    score -= 0.25; // Heavy penalty for critical water deficit
    reasons.push(`Critical water deficit: need ${crop.waterNeeds}mm, have ${Math.round(climate.avgRainfall)}mm`);
  }

  // Nutrient Gap Penalty
  if (farmer.N < crop.requiredN) {
    gapN = crop.requiredN - farmer.N;
    const nutrientPenalty = (gapN / crop.requiredN) * 0.2; // Up to -20% for full gap
    yieldMultiplier -= nutrientPenalty;
    reasons.push(`N gap: ${Math.round(gapN)}kg needed (cost: ₹${Math.round(gapN * UREA_PRICE_PER_KG)})`);
  } else {
    reasons.push(`N sufficient: have ${farmer.N}kg, need ${crop.requiredN}kg`);
  }

  // Water Adequacy (irrigation bonus or penalty)
  if (farmer.hasIrrigation) {
    reasons.push(`Has irrigation: water needs met regardless of rainfall`);
  } else {
    const waterRatio = climate.avgRainfall / crop.waterNeeds;
    if (waterRatio >= 0.9) {
      reasons.push(`Rainfall adequate: ${Math.round(climate.avgRainfall)}mm vs ${crop.waterNeeds}mm needed`);
    } else if (waterRatio >= 0.7) {
      const waterPenalty = (1 - waterRatio) * 0.1;
      yieldMultiplier -= waterPenalty;
      reasons.push(`Rainfall marginal: ${Math.round(climate.avgRainfall)}mm vs ${crop.waterNeeds}mm (${Math.round(waterRatio * 100)}%)`);
    } else {
      const waterPenalty = 0.3;
      yieldMultiplier -= waterPenalty;
      reasons.push(`Rainfall low: ${Math.round(climate.avgRainfall)}mm vs ${crop.waterNeeds}mm (${Math.round(waterRatio * 100)}%)`);
    }
  }

  // Frost/Heat Sensitivity
  const hasFrost = climate.tempMin < 0 && crop.sensitiveToFrost;
  const hasHeatwave = climate.tempMax > 40 && crop.sensitiveToHeat;

  if (hasFrost) {
    const frostPenalty = 0.3; // 30% yield reduction
    yieldMultiplier -= frostPenalty;
    score -= 0.15;
    reasons.push(`Frost risk: temp drops to ${climate.tempMin}°C (crop sensitive)`);
  }

  if (hasHeatwave) {
    const heatPenalty = 0.3;
    yieldMultiplier -= heatPenalty;
    score -= 0.15;
    reasons.push(`Heatwave risk: temps reach ${climate.tempMax}°C (crop sensitive)`);
  }

  // Ensure multipliers stay positive
  yieldMultiplier = Math.max(0.1, yieldMultiplier);
  score = Math.max(0, Math.min(1, score));

  return {
    overallScore: score,
    baseYield: crop.baseYield,
    yieldMultiplier,
    reasons,
    gapN,
    passesHardFilters: true,
    hasFrost,
    hasHeatwave
  };
};

