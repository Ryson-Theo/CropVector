/**
 * Pest & Disease Risk Forecasting Service
 * Based on climate conditions and crop sensitivity
 */

const DISEASE_MATRIX = {
  // RICE & PADDY
  'Rice': {
    'Blast': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Sheath Blight': { tempMin: 20, tempMax: 30, rainfallMin: 800, risk: 'high' },
    'Brown Spot': { tempMin: 18, tempMax: 32, rainfallMin: 600, risk: 'medium' },
    'Leaf Scald': { tempMin: 20, tempMax: 32, rainfallMin: 700, risk: 'medium' }
  },
  'Paddy (Basmati)': {
    'Blast': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Sheath Blight': { tempMin: 20, tempMax: 30, rainfallMin: 800, risk: 'high' },
    'Brown Spot': { tempMin: 18, tempMax: 32, rainfallMin: 600, risk: 'medium' }
  },
  'Paddy (Common)': {
    'Blast': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Sheath Blight': { tempMin: 20, tempMax: 30, rainfallMin: 800, risk: 'high' }
  },
  'Black Rice': {
    'Blast': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Sheath Blight': { tempMin: 20, tempMax: 30, rainfallMin: 800, risk: 'high' }
  },

  // WHEAT & CEREALS
  'Wheat': {
    'Rust': { tempMin: 10, tempMax: 25, rainfallMin: 300, risk: 'high' },
    'Septoria': { tempMin: 15, tempMax: 25, rainfallMin: 400, risk: 'medium' },
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'medium' }
  },
  'Barley': {
    'Rust': { tempMin: 10, tempMax: 25, rainfallMin: 300, risk: 'high' },
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'medium' }
  },
  'Maize': {
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'high' },
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 500, risk: 'medium' },
    'Corn Borer': { tempMin: 18, tempMax: 32, rainfallMin: 300, risk: 'high' }
  },
  'Sorghum': {
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'medium' },
    'Anthracnose': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'high' }
  },
  'Jowar (Sorghum)': {
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'medium' },
    'Anthracnose': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'high' }
  },
  'Bajra (Pearl Millet)': {
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'medium' }
  },
  'Ragi (Finger Millet)': {
    'Blast': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'medium' }
  },
  'Millet': {
    'Blast': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'medium' }
  },

  // PULSES & LEGUMES
  'Arhar (Tur/Red Gram)': {
    'Wilt': { tempMin: 25, tempMax: 35, rainfallMin: 400, risk: 'high' },
    'Alternaria': { tempMin: 18, tempMax: 28, rainfallMin: 500, risk: 'medium' }
  },
  'Bengal Gram (Whole)': {
    'Wilt': { tempMin: 20, tempMax: 30, rainfallMin: 400, risk: 'high' },
    'Blight': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'medium' }
  },
  'Black Gram (Urd Beans)': {
    'Wilt': { tempMin: 25, tempMax: 35, rainfallMin: 400, risk: 'high' },
    'Yellow Mosaic Virus': { tempMin: 20, tempMax: 32, rainfallMin: 300, risk: 'high' }
  },
  'Green Gram (Moong)': {
    'Wilt': { tempMin: 25, tempMax: 35, rainfallMin: 400, risk: 'high' },
    'Yellow Mosaic Virus': { tempMin: 20, tempMax: 32, rainfallMin: 300, risk: 'high' }
  },
  'Lentil': {
    'Wilt': { tempMin: 20, tempMax: 30, rainfallMin: 400, risk: 'high' },
    'Blight': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'medium' }
  },
  'Soybean': {
    'Frogeye Leaf Spot': { tempMin: 20, tempMax: 30, rainfallMin: 600, risk: 'high' },
    'Yellow Mosaic Virus': { tempMin: 20, tempMax: 32, rainfallMin: 300, risk: 'high' }
  },
  'Cowpea (Lobia/Karamani)': {
    'Wilt': { tempMin: 25, tempMax: 35, rainfallMin: 400, risk: 'high' },
    'Yellow Mosaic Virus': { tempMin: 20, tempMax: 32, rainfallMin: 300, risk: 'high' }
  },

  // VEGETABLES
  'Tomato': {
    'Early Blight': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'high' },
    'Late Blight': { tempMin: 12, tempMax: 25, rainfallMin: 500, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' },
    'Leaf Curl': { tempMin: 25, tempMax: 40, rainfallMin: 300, risk: 'high' }
  },
  'Potato': {
    'Late Blight': { tempMin: 12, tempMax: 25, rainfallMin: 500, risk: 'high' },
    'Early Blight': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'medium' },
    'Bacterial Wilt': { tempMin: 20, tempMax: 30, rainfallMin: 500, risk: 'medium' }
  },
  'Onion': {
    'Purple Blotch': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Basal Rot': { tempMin: 18, tempMax: 30, rainfallMin: 400, risk: 'medium' }
  },
  'Cabbage': {
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'medium' },
    'Leaf Spot': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'high' }
  },
  'Cauliflower': {
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'medium' },
    'Leaf Spot': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'high' }
  },
  'Brinjal': {
    'Early Blight': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'high' },
    'Leaf Curl': { tempMin: 25, tempMax: 40, rainfallMin: 300, risk: 'high' },
    'Shoot and Fruit Borer': { tempMin: 20, tempMax: 32, rainfallMin: 300, risk: 'high' }
  },
  'Green Chilli': {
    'Anthracnose': { tempMin: 20, tempMax: 32, rainfallMin: 500, risk: 'high' },
    'Leaf Curl': { tempMin: 25, tempMax: 40, rainfallMin: 300, risk: 'high' }
  },
  'Chili': {
    'Anthracnose': { tempMin: 20, tempMax: 32, rainfallMin: 500, risk: 'high' },
    'Leaf Curl': { tempMin: 25, tempMax: 40, rainfallMin: 300, risk: 'high' }
  },
  'Capsicum': {
    'Anthracnose': { tempMin: 20, tempMax: 32, rainfallMin: 500, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' }
  },
  'Cucumber (Kheera)': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Bitter gourd': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Bottle gourd': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Pumpkin': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Carrot': {
    'Leaf Spot': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'medium' },
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'low' }
  },
  'Radish': {
    'Leaf Spot': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'medium' },
    'White Rust': { tempMin: 10, tempMax: 20, rainfallMin: 400, risk: 'medium' }
  },
  'Spinach': {
    'Leaf Spot': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'medium' },
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'low' }
  },
  'Bhindi (Ladies Finger)': {
    'Leaf Curl': { tempMin: 25, tempMax: 40, rainfallMin: 300, risk: 'high' },
    'Yellow Vein Mosaic': { tempMin: 20, tempMax: 35, rainfallMin: 300, risk: 'high' }
  },
  'French Beans': {
    'Rust': { tempMin: 15, tempMax: 25, rainfallMin: 400, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' }
  },

  // FRUITS
  'Mango (Raw-Ripe)': {
    'Anthracnose': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' }
  },
  'Banana': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'high' },
    'Panama Wilt': { tempMin: 25, tempMax: 35, rainfallMin: 500, risk: 'high' }
  },
  'Orange': {
    'Canker': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'medium' }
  },
  'Lemon': {
    'Canker': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'medium' }
  },
  'Lime': {
    'Canker': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'medium' }
  },
  'Grapes': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Apple': {
    'Powdery Mildew': { tempMin: 10, tempMax: 20, rainfallMin: 100, risk: 'high' },
    'Scab': { tempMin: 10, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Papaya': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' }
  },
  'Pineapple': {
    'Heart Rot': { tempMin: 25, tempMax: 35, rainfallMin: 500, risk: 'high' },
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'medium' }
  },
  'Water Melon': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },
  'Karbuja (Musk Melon)': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Downy Mildew': { tempMin: 12, tempMax: 24, rainfallMin: 500, risk: 'high' }
  },

  // OILSEEDS & SPICES
  'Peanut': {
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 500, risk: 'high' },
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'medium' }
  },
  'Sunflower': {
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'high' },
    'Alternaria': { tempMin: 18, tempMax: 30, rainfallMin: 500, risk: 'high' }
  },
  'Groundnut': {
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 500, risk: 'high' },
    'Rust': { tempMin: 15, tempMax: 28, rainfallMin: 400, risk: 'medium' }
  },
  'Mustard': {
    'White Rust': { tempMin: 10, tempMax: 20, rainfallMin: 400, risk: 'high' },
    'Leaf Spot': { tempMin: 15, tempMax: 25, rainfallMin: 500, risk: 'medium' }
  },
  'Sesamum (Sesame/Gingelly/Til)': {
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 500, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' }
  },
  'Garlic': {
    'Purple Blotch': { tempMin: 15, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Basal Rot': { tempMin: 18, tempMax: 30, rainfallMin: 400, risk: 'medium' }
  },
  'Turmeric (raw)': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'high' },
    'Leaf Blotch': { tempMin: 22, tempMax: 34, rainfallMin: 700, risk: 'high' }
  },
  'Ginger (Dry)': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'high' },
    'Rhizome Rot': { tempMin: 22, tempMax: 34, rainfallMin: 700, risk: 'high' }
  },
  'Ginger (Green)': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'high' },
    'Rhizome Rot': { tempMin: 22, tempMax: 34, rainfallMin: 700, risk: 'high' }
  },

  // PLANTATION CROPS
  'Coconut': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'medium' },
    'Stem Rot': { tempMin: 22, tempMax: 34, rainfallMin: 700, risk: 'high' }
  },
  'Coffee': {
    'Leaf Rust': { tempMin: 15, tempMax: 28, rainfallMin: 600, risk: 'high' },
    'Berry Disease': { tempMin: 18, tempMax: 30, rainfallMin: 700, risk: 'high' }
  },
  'Arecanut (Betelnut/Supari)': {
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'medium' }
  },
  'Rubber': {
    'Leaf Fall Disease': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'high' }
  },

  // OTHER CROPS
  'Sugarcane': {
    'Smut': { tempMin: 15, tempMax: 30, rainfallMin: 600, risk: 'medium' },
    'Leaf Scald': { tempMin: 20, tempMax: 32, rainfallMin: 700, risk: 'high' },
    'Red Rot': { tempMin: 25, tempMax: 35, rainfallMin: 600, risk: 'high' }
  },
  'Cotton': {
    'Bollworm': { tempMin: 20, tempMax: 35, rainfallMin: 200, risk: 'high' },
    'Leaf Curl': { tempMin: 25, tempMax: 40, rainfallMin: 300, risk: 'medium' },
    'Fusarium Wilt': { tempMin: 25, tempMax: 35, rainfallMin: 400, risk: 'high' }
  },
  'Jute': {
    'Stem Rot': { tempMin: 22, tempMax: 34, rainfallMin: 700, risk: 'high' },
    'Leaf Spot': { tempMin: 20, tempMax: 32, rainfallMin: 600, risk: 'medium' }
  },
  'Mushrooms': {
    'Green Mold': { tempMin: 18, tempMax: 28, rainfallMin: 500, risk: 'high' },
    'Bacterial Spot': { tempMin: 20, tempMax: 30, rainfallMin: 600, risk: 'medium' }
  },
  'Gur (Jaggery)': {
    'Smut': { tempMin: 15, tempMax: 30, rainfallMin: 600, risk: 'medium' },
    'Leaf Scald': { tempMin: 20, tempMax: 32, rainfallMin: 700, risk: 'high' }
  },

  // FLOWERS
  'Rose (Local)': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Black Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'high' }
  },
  'Marigold (Calcutta)': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' },
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'medium' }
  },
  'Chrysanthemum': {
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'high' },
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'medium' }
  },
  'Jasmine': {
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 600, risk: 'high' },
    'Powdery Mildew': { tempMin: 15, tempMax: 27, rainfallMin: 100, risk: 'medium' }
  },
  'Orchid': {
    'Leaf Spot': { tempMin: 18, tempMax: 30, rainfallMin: 700, risk: 'high' },
    'Root Rot': { tempMin: 20, tempMax: 32, rainfallMin: 750, risk: 'high' }
  }
};

exports.assessPestRisk = (cropName, climate) => {
  const cropDiseases = DISEASE_MATRIX[cropName];
  if (!cropDiseases) {
    return {
      overallRisk: 'Low',
      riskScore: 0,
      diseases: [],
      recommendations: ['No known high-risk diseases for this crop in this region']
    };
  }

  const diseases = [];
  let maxRisk = 0;

  Object.entries(cropDiseases).forEach(([diseaseName, conditions]) => {
    const tempMatch = climate.tempMin >= conditions.tempMin && climate.tempMax <= conditions.tempMax;
    const rainMatch = climate.avgRainfall >= conditions.rainfallMin;

    if (tempMatch && rainMatch) {
      const riskValue = conditions.risk === 'high' ? 3 : conditions.risk === 'medium' ? 2 : 1;
      maxRisk = Math.max(maxRisk, riskValue);

      diseases.push({
        name: diseaseName,
        risk: conditions.risk,
        condition: `Temperature ${climate.tempMin}-${climate.tempMax}°C, Rainfall ${Math.round(climate.avgRainfall)}mm`,
        prevention: getPreventionTips(diseaseName)
      });
    }
  });

  const overallRisk = maxRisk >= 3 ? 'High' : maxRisk >= 2 ? 'Medium' : 'Low';
  const riskScore = Math.min(100, maxRisk * 30);

  return {
    overallRisk,
    riskScore,
    diseases,
    recommendations: generateRecommendations(cropName, diseases, climate)
  };
};

const getPreventionTips = (diseaseName) => {
  const tips = {
    // RICE DISEASES
    'Blast': 'Use resistant varieties, maintain field sanitation, spray carbendazim 50% @ 1000ml/ha',
    'Sheath Blight': 'Reduce nitrogen, improve drainage, spray trichoderma early',
    'Brown Spot': 'Remove infected leaves, apply fungicide, maintain field hygiene',
    'Leaf Scald': 'Remove infected leaves, spray copper fungicide',
    
    // WHEAT & CEREAL DISEASES
    'Rust': 'Use resistant varieties, spray sulfur or tebuconazole every 2 weeks',
    'Septoria': 'Crop rotation, spray azoxystrobin, remove crop residue',
    'Anthracnose': 'Improve field drainage, spray carbendazim 50%, remove infected leaves',
    'Corn Borer': 'Use Bt varieties, install pheromone traps, practice deep plowing',
    'Leaf Spot': 'Remove infected leaves, spray mancozeb 75% WP, crop rotation',
    
    // VEGETABLE DISEASES
    'Early Blight': 'Remove lower leaves, spray mancozeb 75% WP, improve air flow',
    'Late Blight': 'Spray metalaxyl + mancozeb, avoid overhead irrigation, remove infected leaves',
    'Powdery Mildew': 'Spray sulfur or tebuconazole, improve air circulation, avoid humidity',
    'Leaf Curl': 'Control whitefly vectors with neem oil, use resistant varieties, yellow sticky traps',
    'Yellow Vein Mosaic': 'Control whitefly vectors, remove infected plants, use resistant varieties',
    'Purple Blotch': 'Crop rotation, remove crop residue, spray mancozeb, avoid overhead irrigation',
    'Basal Rot': 'Improve drainage, use certified seed, treat seed with carbendazim',
    'Wilt': 'Use resistant varieties, improve soil drainage, practice crop rotation',
    'Blight': 'Use resistant varieties, improve drainage, spray metalaxyl + mancozeb',
    'Frogeye Leaf Spot': 'Crop rotation, remove crop residue, spray azoxystrobin',
    'Downy Mildew': 'Spray metalaxyl + mancozeb, improve air circulation, avoid overhead irrigation',
    'White Rust': 'Spray with sulfur or mancozeb, improve air flow, use resistant varieties',
    'Shoot and Fruit Borer': 'Install pheromone traps, use Bt insecticide, hand-pick infected fruits',
    
    // FRUIT DISEASES
    'Anthracnose': 'Remove infected fruits, spray carbendazim 50%, improve air circulation',
    'Canker': 'Prune infected branches, spray copper fungicide, disinfect tools',
    'Leaf Spot': 'Remove infected leaves, spray mancozeb 75%, improve air circulation',
    'Panama Wilt': 'Use resistant varieties, improve soil drainage, sanitize tools',
    'Heart Rot': 'Improve drainage, remove infected plants, use clean planting material',
    'Black Spot': 'Remove infected leaves, spray sulfur or tebuconazole, improve air circulation',
    'Scab': 'Spray sulfur or tebuconazole, prune infected branches, proper spacing',
    'Root Rot': 'Improve drainage, use sterilized soil, avoid overwatering',
    
    // OILSEED DISEASES
    'Alternaria': 'Crop rotation, remove crop residue, spray mancozeb 75%, use resistant varieties',
    'Leaf Rust': 'Use resistant varieties, spray sulfur every 2 weeks, remove infected parts',
    'Berry Disease': 'Remove infected berries, improve air circulation, spray copper fungicide',
    
    // PLANTATION CROPS
    'Stem Rot': 'Improve drainage, remove infected plants, spray copper fungicide',
    'Leaf Fall Disease': 'Improve air circulation, spray copper fungicide, remove infected leaves',
    
    // OTHER
    'Smut': 'Use certified disease-free seed, treat seed with fungicide before planting',
    'Red Rot': 'Use resistant varieties, improve soil health, remove infected canes',
    'Fusarium Wilt': 'Use resistant varieties, improve soil drainage, practice crop rotation',
    'Bollworm': 'Install pheromone traps, use Bt cotton varieties, hand-pick infected bolls',
    'Yellow Mosaic Virus': 'Control whitefly vectors with neem oil, remove infected plants',
    'Rhizome Rot': 'Improve drainage, use disease-free seed rhizomes, spray carbendazim',
    'Green Mold': 'Improve ventilation, reduce humidity, spray sulfur or tebuconazole',
    'Bacterial Spot': 'Remove infected plants, spray copper fungicide, improve air circulation'
  };
  return tips[diseaseName] || 'Follow integrated pest management (IPM) practices. Scout fields regularly for symptoms.';
};

const generateRecommendations = (cropName, diseases, climate) => {
  const recommendations = [];

  if (diseases.length === 0) {
    return ['Climate conditions are favorable. Continue with regular monitoring.'];
  }

  if (climate.avgRainfall > 1000) {
    recommendations.push('High rainfall detected: Increase field drainage and reduce irrigation');
    recommendations.push('Risk of fungal diseases is elevated. Schedule spraying every 14 days');
  }

  if (climate.tempMax > 35) {
    recommendations.push('High temperature stress detected. Increase irrigation frequency');
    recommendations.push('Use shade-tolerant intercrops or mulching to reduce stress');
  }

  if (climate.tempMin < 5) {
    recommendations.push('Frost risk: Avoid early planting. Use frost-resistant varieties');
  }

  recommendations.push('Scout fields regularly (weekly) for early disease symptoms');
  recommendations.push('Consult local agricultural extension officer for specific spray schedules');

  return recommendations;
};

