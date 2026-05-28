const fetch = global.fetch || require('node-fetch');

const API_KEY = process.env.DATA_GOV_API_KEY || 'demo'; // Fallback to demo if not set
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

let cache = {};
let CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// get mandi price for a crop
async function fetchMandiPrice(crop) {
  const now = Date.now();
  
  // check cache first
  if (cache[crop] && (now - cache[crop].ts < CACHE_TTL)) {
    return cache[crop].price;
  }

  try {
    const url = `${BASE_URL}?api-key=${API_KEY}&format=json&filters[commodity]=${encodeURIComponent(crop)}`;
    const resp = await fetch(url, { timeout: 5000 });
    
    if (!resp.ok) throw new Error(`API returned ${resp.status}`);
    
    const json = await resp.json();
    const record = json.records?.[0];
    
    if (!record) {      return null;
    }

    // price is per quintal, in rupees
    const price = parseFloat(record.modal_price);
    if (!isNaN(price)) {
      cache[crop] = { price, ts: now, mandi: record.mandi_name };
      return price;
    }

    return null;
  } catch (err) {    return null;
  }
}

// get prices for multiple crops
exports.getMandiPrices = async (cropNames = []) => {
  const mandiPrices = {};

  for (const crop of cropNames) {
    try {
      const price = await fetchMandiPrice(crop);
      if (price) {
        mandiPrices[crop] = price;
      }
    } catch (err) {    }
  }

  return mandiPrices;
};

/**
 * Apply live mandi prices to recommendations
 * Updates marketPrice, expectedProfit, and priceSource fields
 * @param {Array} results - Recommendation results from recommendationService
 * @returns {Array} Results with updated market prices
 */
exports.applyLivePrices = async (results) => {
  const cropNames = results.map(r => r.name);
  const mandiPrices = await exports.getMandiPrices(cropNames);

  return results.map(result => {
    if (mandiPrices[result.name]) {
      const newPrice = mandiPrices[result.name];
      const priceChange = newPrice - result.marketPrice;
      
      // Recalculate expected profit with new price
      const newExpectedProfit = (result.adjustedYield * newPrice) - result.totalCost;
      
      return {
        ...result,
        marketPrice: newPrice,
        expectedProfit: Math.round(newExpectedProfit),
        priceSource: 'Live Mandi (Data.gov.in)',
        priceUpdate: {
          previousPrice: result.marketPrice,
          currentPrice: newPrice,
          change: Math.round(priceChange),
          changePercent: Math.round((priceChange / result.marketPrice) * 100)
        }
      };
    }

    // No live price found; keep static price
    return {
      ...result,
      priceSource: 'Static Database'
    };
  });
};

