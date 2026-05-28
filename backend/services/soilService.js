const fetch = global.fetch || require('node-fetch');

// Kaegro soil API wrapper with fallback
exports.getSoilAt = async (latitude, longitude, manualFallback = {}) => {
  try {
    const url = `https://www.kaegro.com/farms/api/soil?lat=${latitude}&lon=${longitude}`;
    const resp = await fetch(url, { timeout: 5000 });
    if (!resp.ok) throw new Error(`Kaegro returned ${resp.status}`);
    
    const data = await resp.json();
    
    // Map Kaegro response to standard fields
    const result = {
      ph: data.ph ?? null,
      N: data.nitrogen ?? data.N ?? null,
      P: data.phosphorus ?? null,
      K: data.potassium ?? null,
      texture: data.texture ?? data.soil_texture ?? null,
      cec: data.cec ?? null,
      source: 'kaegro',
      raw: data
    };

    // Apply fallback for any missing critical fields
    if (result.ph == null && manualFallback.pH != null) {
      result.ph = manualFallback.pH;
    }
    if (result.N == null && manualFallback.N != null) {
      result.N = manualFallback.N;
    }
    if (result.P == null && manualFallback.P != null) {
      result.P = manualFallback.P;
    }
    if (result.K == null && manualFallback.K != null) {
      result.K = manualFallback.K;
    }
    if (result.texture == null && manualFallback.soilTexture != null) {
      result.texture = manualFallback.soilTexture;
    }

    return result;
  } catch (err) {    // Complete fallback to manual soil data
    return {
      ph: manualFallback.pH ?? 6.5,
      N: manualFallback.N ?? 50,
      P: manualFallback.P ?? 20,
      K: manualFallback.K ?? 150,
      texture: manualFallback.soilTexture ?? 'loam',
      cec: null,
      source: 'manual-fallback',
      raw: null
    };
  }
};

