const fetch = global.fetch || require('node-fetch');

function formatDate(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

exports.getClimateBaseline = async (latitude, longitude) => {
  // Fetch ERA5 archive for last 3 years (daily sums) and a 14-day forecast
  try {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setUTCFullYear(start.getUTCFullYear() - 3);

    const start_date = formatDate(start);
    const end_date = formatDate(end);

    const eraUrl = `https://archive-api.open-meteo.com/v1/era5?latitude=${latitude}&longitude=${longitude}&start_date=${start_date}&end_date=${end_date}&daily=rain_sum,temperature_2m_max,temperature_2m_min&timezone=UTC`;

    const eraResp = await fetch(eraUrl);
    const eraJson = await eraResp.json();

    const dailyRain = (eraJson?.daily?.rain_sum) || [];
    const dailyMax = (eraJson?.daily?.temperature_2m_max) || [];
    const dailyMin = (eraJson?.daily?.temperature_2m_min) || [];

    const totalRain = dailyRain.reduce((s, v) => s + (v || 0), 0);
    const years = 3;
    const avg_yearly_rainfall = totalRain / years;

    const temp_extremes = {
      minObserved: Math.min(...(dailyMin.length ? dailyMin : [0])),
      maxObserved: Math.max(...(dailyMax.length ? dailyMax : [0])),
      hasFrost: (Math.min(...(dailyMin.length ? dailyMin : [0])) <= 0),
      hasHeatwave: (Math.max(...(dailyMax.length ? dailyMax : [0])) >= 40)
    };

    // 14-day forecast
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=rain_sum,temperature_2m_max,temperature_2m_min&forecast_days=14&timezone=UTC`;
    const fResp = await fetch(forecastUrl);
    const fJson = await fResp.json();

    const forecast = fJson?.daily || {};

    return {
      avgRainfall: avg_yearly_rainfall,
      tempMin: Math.min(...(dailyMin.length ? dailyMin : [0])),
      tempMax: Math.max(...(dailyMax.length ? dailyMax : [0])),
      temp_extremes: temp_extremes,
      avg_yearly_rainfall: avg_yearly_rainfall,
      current_forecast: forecast
    };
  } catch (err) {    return {
      avgRainfall: 800,
      tempMin: 5,
      tempMax: 35,
      avg_yearly_rainfall: 800,
      temp_extremes: { minObserved: 5, maxObserved: 35, hasFrost: false, hasHeatwave: false },
      current_forecast: {}
    };
  }
};

