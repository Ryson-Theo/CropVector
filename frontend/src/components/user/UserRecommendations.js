import React, { useState } from 'react';
import {
  Sprout, TrendingUp, AlertCircle, CheckCircle,
  Home, Lightbulb, Droplets, Zap, RefreshCw, Target,
  X, BookOpen, Wrench, ShoppingCart, AlertTriangle, ArrowRight, Clock
} from 'lucide-react';
import './UserRecommendations.css';
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";

const UserRecommendations = () => {
  const [step, setStep] = useState(1); // 1: Input Form, 2: Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    space: 'Apartment/Small',
    environment: 'Low Light',
    effortLevel: 'Low Effort'
  });

  const [results, setResults] = useState([]);
  const [expandedSystem, setExpandedSystem] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate recommendations based on form data
      const recommendations = generateRecommendations(formData);
      setResults(recommendations);
      setStep(2);
      addToast('Recommendations generated successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to generate recommendations');
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup Guides Database
  const setupGuides = {
    'Hydroponics': {
      title: 'Hydroponics Setup Guide',
      overview: 'Grow plants in water with dissolved nutrients - no soil needed!',
      timeToSetup: '2-4 hours',
      difficultyLevel: 'Intermediate',
      steps: [
        {
          number: 1,
          title: 'Choose Your System Type',
          details: 'Select from DWC (Deep Water Culture), NFT (Nutrient Film Technique), or Ebb & Flow',
          tips: ['DWC is easiest for beginners', 'NFT is space-efficient', 'Research your plant type']
        },
        {
          number: 2,
          title: 'Gather Materials',
          details: 'Collect container, air pump, growing medium (hydroton), nutrient solution, and pH meter',
          tips: ['Food-grade containers work great', 'Buy quality air pump', 'Get test kit for water quality']
        },
        {
          number: 3,
          title: 'Set Up Reservoir',
          details: 'Fill container with water, add air stone, and connect to air pump',
          tips: ['Use dechlorinated water', 'Ensure bubbles reach all plants', 'Check daily for leaks']
        },
        {
          number: 4,
          title: 'Add Nutrients',
          details: 'Mix hydroponic nutrient solution according to package instructions',
          tips: ['Start with recommended dosage', 'Use balanced NPK ratio', 'Monitor EC/PPM levels']
        },
        {
          number: 5,
          title: 'Plant & Maintain',
          details: 'Place seedlings in net pots with growing medium and monitor growth',
          tips: ['Check water level weekly', 'Maintain pH 5.5-6.5', 'Change water every 3-4 weeks']
        }
      ],
      materials: ['Container (₹500-1500)', 'Air pump (₹1000-2000)', 'Growing medium (₹300-500)', 'Nutrient kit (₹500-1500)', 'pH meter (₹800-1200)'],
      commonMistakes: ['Overfeeding nutrients', 'Inconsistent pH levels', 'Poor water oxygenation', 'Wrong light duration'],
      resources: ['YouTube: Hydroponics 101', 'r/hydro subreddit', 'Local gardening clubs']
    },
    'Vertical Gardening': {
      title: 'Vertical Garden Setup Guide',
      overview: 'Create a living wall by stacking plants vertically to save space',
      timeToSetup: '1-2 hours',
      difficultyLevel: 'Beginner',
      steps: [
        {
          number: 1,
          title: 'Choose Vertical Structure',
          details: 'Select wall-mounted pockets, shelves, trellises, or hanging planters',
          tips: ['Check weight capacity of wall', 'Ensure 6+ inches between rows', 'Plan irrigation carefully']
        },
        {
          number: 2,
          title: 'Mount Securely',
          details: 'Install wall brackets, anchors, and ensure everything is level and stable',
          tips: ['Use studs or heavy-duty anchors', 'Test weight before planting', 'Allow water drainage']
        },
        {
          number: 3,
          title: 'Prepare Growing Medium',
          details: 'Fill pockets with potting mix and ensure good drainage',
          tips: ['Mix compost with drainage materials', 'Pre-wet soil before planting', 'Add slow-release fertilizer']
        },
        {
          number: 4,
          title: 'Install Irrigation',
          details: 'Set up drip system or self-watering pockets to water from top',
          tips: ['Use soaker hoses for efficiency', 'Timer saves time', 'Check water reaches bottom layer']
        },
        {
          number: 5,
          title: 'Plant & Monitor',
          details: 'Place plants starting from bottom to top with proper spacing',
          tips: ['Plant shade-tolerant plants at bottom', 'Water daily in summer', 'Fertilize every 2 weeks']
        }
      ],
      materials: ['Wall pockets (₹2000-4000)', 'Potting mix (₹800-1500)', 'Drip system (₹1000-2000)', 'Fasteners/brackets (₹500-1000)'],
      commonMistakes: ['Uneven watering', 'Wall damage from moisture', 'Wrong plant selection', 'Inadequate light at bottom'],
      resources: ['Pinterest vertical garden ideas', 'Local nurseries', 'Garden design apps']
    },
    'Greenhouse': {
      title: 'Greenhouse Setup Guide',
      overview: 'Create a controlled environment for year-round gardening',
      timeToSetup: '1-3 days',
      difficultyLevel: 'Advanced',
      steps: [
        {
          number: 1,
          title: 'Choose Location & Size',
          details: 'Select south-facing location with 6+ hours of sunlight and enough space',
          tips: ['Avoid shade from trees', 'Near water source is convenient', 'Check local regulations']
        },
        {
          number: 2,
          title: 'Prepare Foundation',
          details: 'Level ground and create base (concrete, gravel, or wood frame)',
          tips: ['Ensure proper drainage', 'Use level measurement', 'Insulate base if in cold climate']
        },
        {
          number: 3,
          title: 'Install Frame & Covering',
          details: 'Assemble frame and cover with polycarbonate, glass, or plastic sheeting',
          tips: ['Polycarbonate is most durable', 'Ensure proper ventilation holes', 'Seal gaps to retain heat']
        },
        {
          number: 4,
          title: 'Set Up Climate Control',
          details: 'Install thermostat, vents, heater, and shade cloth as needed',
          tips: ['Automatic vents are convenient', 'Mist system for humidity', 'Monitor temperature daily']
        },
        {
          number: 5,
          title: 'Create Growing Space',
          details: 'Build benches, shelves, and set up irrigation system',
          tips: ['Adjustable shelves are versatile', 'Drip irrigation saves water', 'Organize by plant type']
        }
      ],
      materials: ['Greenhouse kit (₹15000-50000)', 'Thermostat (₹2000-4000)', 'Benching (₹3000-8000)', 'Irrigation (₹2000-5000)'],
      commonMistakes: ['Poor ventilation causing fungal issues', 'Overheating in summer', 'Inadequate water management', 'Weak frame design'],
      resources: ['Greenhouse manufacturer websites', 'Agricultural extension centers', 'Experienced gardeners online']
    },
    'Raised Beds': {
      title: 'Raised Bed Garden Setup Guide',
      overview: 'Elevated beds with excellent drainage and soil control',
      timeToSetup: '4-8 hours',
      difficultyLevel: 'Beginner to Intermediate',
      steps: [
        {
          number: 1,
          title: 'Choose Location',
          details: 'Select flat area with 6-8 hours of sunlight and good drainage',
          tips: ['Morning sun is ideal', 'Avoid tree roots', 'Level ground first']
        },
        {
          number: 2,
          title: 'Build or Buy Frame',
          details: 'Use cedar/untreated wood, composite, or prefab kits for bed structure',
          tips: ['Cedar lasts 7-10 years', 'Avoid pressure-treated wood', '4x8 ft is standard size']
        },
        {
          number: 3,
          title: 'Add Landscape Fabric',
          details: 'Line bottom to prevent weeds and pests while allowing water drainage',
          tips: ['Use permeable fabric', 'Overlap edges', 'Secure with staples']
        },
        {
          number: 4,
          title: 'Fill with Quality Soil',
          details: 'Use mix of topsoil, compost, and peat moss in proper proportions',
          tips: ['Use 50% topsoil, 30% compost, 20% peat', 'Mix well before planting', 'Don\'t compact soil']
        },
        {
          number: 5,
          title: 'Plant & Water',
          details: 'Follow spacing guidelines and water regularly, especially early morning',
          tips: ['Use drip irrigation for efficiency', 'Mulch to retain moisture', 'Rotate crops yearly']
        }
      ],
      materials: ['Wood/frame (₹1500-4000)', 'Landscape fabric (₹400-800)', 'Soil (₹2000-5000)', 'Mulch (₹500-1000)'],
      commonMistakes: ['Poor soil mix', 'Inadequate drainage', 'Wrong plant spacing', 'Over/under watering'],
      resources: ['gardening blogs', 'Local landscapers', 'Seed company guides']
    },
    'Indoor Hydroponics with Grow Lights': {
      title: 'Indoor Hydroponic Grow Setup Guide',
      overview: 'Indoor hydroponics with artificial lighting - grow year-round anywhere',
      timeToSetup: '3-5 hours',
      difficultyLevel: 'Intermediate',
      steps: [
        {
          number: 1,
          title: 'Select Growing Location',
          details: 'Choose well-ventilated indoor space with electrical access (shelf, closet, or corner)',
          tips: ['Ensure stable temperatures', 'Room temp 18-24°C ideal', 'Away from direct sunlight']
        },
        {
          number: 2,
          title: 'Install LED Grow Lights',
          details: 'Mount adjustable LED panels 12-24 inches above plant canopy',
          tips: ['Full spectrum LED is best', 'Timer for 12-16 hours daily', 'Space fixtures for even coverage']
        },
        {
          number: 3,
          title: 'Set Up Hydroponic System',
          details: 'Install DWC or NFT system with reservoir, pump, and growing media',
          tips: ['Use distilled water', 'Keep water temperature 18-21°C', 'Install backup power for pump']
        },
        {
          number: 4,
          title: 'Add Climate Control',
          details: 'Install fan for ventilation and monitor temperature/humidity',
          tips: ['Target 40-60% humidity', 'Good air circulation prevents fungus', 'Use hygrometer for monitoring']
        },
        {
          number: 5,
          title: 'Monitor & Maintain',
          details: 'Check water, nutrients, and plant health daily - adjust light height as plants grow',
          tips: ['Test water every 2-3 days', 'pH should be 5.5-6.5', 'Change water every 3-4 weeks']
        }
      ],
      materials: ['LED grow light (₹4000-8000)', 'Hydroponic kit (₹3000-7000)', 'Growing media (₹500-1000)', 'Ventilation fan (₹1500-3000)', 'Timer (₹300-500)'],
      commonMistakes: ['Wrong light distance from plants', 'Poor ventilation causing mold', 'Inconsistent nutrient levels', 'Incorrect photoperiod'],
      resources: ['IndoorGrowing subreddit', 'YouTube hydroponic channels', 'Grow light manufacturer guides']
    },
    'Outdoor Raised Beds': {
      title: 'Outdoor Raised Bed Setup Guide',
      overview: 'Traditional raised beds for outdoor growing with maximum sunlight',
      timeToSetup: '4-8 hours',
      difficultyLevel: 'Beginner',
      steps: [
        {
          number: 1,
          title: 'Select Best Location',
          details: 'Choose spot with 8+ hours direct sunlight daily with good drainage',
          tips: ['South-facing is ideal', 'Slope for water runoff', 'Accessible for daily care']
        },
        {
          number: 2,
          title: 'Build Raised Frame',
          details: 'Construct elevated bed using untreated cedar, composite, or galvanized metal',
          tips: ['12-18 inches deep minimum', 'Cedar smells great', 'Level the frame']
        },
        {
          number: 3,
          title: 'Prepare Base Layer',
          details: 'Add landscape fabric, cardboard, or newspaper to prevent weeds',
          tips: ['Overlap pieces by 6 inches', 'Secure well', 'Newspaper degrades naturally']
        },
        {
          number: 4,
          title: 'Fill with Premium Soil Mix',
          details: 'Use combination of topsoil, compost, and organic matter',
          tips: ['Double dig if improving existing soil', 'Add compost yearly', 'Mulch surface']
        },
        {
          number: 5,
          title: 'Plant & Maintain',
          details: 'Choose plants based on sunlight and water regularly, especially during growth',
          tips: ['Water in early morning', 'Drip irrigation is efficient', 'Fertilize every 3-4 weeks']
        }
      ],
      materials: ['Cedar boards (₹2000-4000)', 'Soil (₹2000-5000)', 'Compost (₹1000-2000)', 'Mulch (₹500-1000)', 'Irrigation hose (₹400-800)'],
      commonMistakes: ['Compacting soil', 'Inconsistent watering', 'Poor sunlight assessment', 'Wrong plant combinations'],
      resources: ['Gardening extension services', 'Local nurseries', 'Seed catalogs']
    },
    'Self-Watering Hydroponic Kits': {
      title: 'Self-Watering Hydroponic Setup Guide',
      overview: 'Automated hydroponics that handles watering for you - perfect for busy people',
      timeToSetup: '1-2 hours',
      difficultyLevel: 'Beginner',
      steps: [
        {
          number: 1,
          title: 'Unbox & Inspect Kit',
          details: 'Check all components are included: reservoir, timer, float valve, tubing, and growing pots',
          tips: ['Keep manual for reference', 'Test all connections', 'Check for damage']
        },
        {
          number: 2,
          title: 'Assemble System',
          details: 'Connect reservoir, float valve, timer, and drip lines according to instructions',
          tips: ['Hand-tighten connections', 'Ensure tubes fit snugly', 'Test for leaks before plants']
        },
        {
          number: 3,
          title: 'Fill Reservoir with Water',
          details: 'Use dechlorinated water and add hydroponic nutrients according to package directions',
          tips: ['Let chlorine evaporate overnight', 'Use distilled water if possible', 'Mix well']
        },
        {
          number: 4,
          title: 'Set Up Timer & Float Valve',
          details: 'Configure automatic watering schedule (usually 2-4 times daily for 15 min cycles)',
          tips: ['Morning and evening watering works best', 'Adjust based on plant needs', 'Float valve prevents overflow']
        },
        {
          number: 5,
          title: 'Plant & Automate',
          details: 'Place seedlings in net pots and let system do the work - just monitor water level weekly',
          tips: ['Check water level every 7 days', 'Top up as needed', 'System does rest automatically!']
        }
      ],
      materials: ['Self-watering kit (₹2500-7000)', 'Hydroponic nutrients (₹500-1000)', 'Extra growing media (₹300)'],
      commonMistakes: ['Not adjusting timer for plant stage', 'Forgetting to refill reservoir', 'Wrong nutrient dosage', 'Not cleaning timer valve'],
      resources: ['Kit manufacturer support', 'Online automation forums', 'Video tutorials by brand']
    },
    'Advanced Hydroponic System': {
      title: 'Advanced Hydroponic System Setup Guide',
      overview: 'Professional-grade system with complete environmental control',
      timeToSetup: '2-4 days',
      difficultyLevel: 'Advanced',
      steps: [
        {
          number: 1,
          title: 'Design Your System',
          details: 'Plan layout, choose NFT or flood/drain system, calculate water volume needed',
          tips: ['Sketch layout first', 'Calculate flow rates', 'Plan for expansion']
        },
        {
          number: 2,
          title: 'Install Main Reservoir',
          details: 'Set up large capacity reservoir (100+ liters) with water chiller and heater capability',
          tips: ['Insulate for temperature control', 'Include drain valve', 'Add circulation pump']
        },
        {
          number: 3,
          title: 'Build Grow Channels/Beds',
          details: 'Construct channels or growing areas with proper gradient and return lines',
          tips: ['Slope 1/8 inch per foot for NFT', 'Include drain lines', 'Plan for cleaning access']
        },
        {
          number: 4,
          title: 'Install Monitoring Equipment',
          details: 'Set up pH meter, EC meter, DO meter, temperature sensors with data logging',
          tips: ['Automated data recording ideal', 'Set alarm thresholds', 'Regular calibration needed']
        },
        {
          number: 5,
          title: 'Optimize & Fine-Tune',
          details: 'Continuously adjust nutrient solution, pH, and environmental factors for peak yields',
          tips: ['Keep detailed logs', 'Adjust for plant stage', 'Research optimal parameters']
        }
      ],
      materials: ['Large reservoir (₹5000-10000)', 'Chiller/heater (₹3000-8000)', 'Monitoring equipment (₹4000-10000)', 'Grow channels (₹5000-15000)', 'Nutrient system (₹2000-5000)'],
      commonMistakes: ['Inadequate monitoring causing pH swings', 'Algae growth in exposed water', 'Pump failures without backup', 'Nutrient imbalances'],
      resources: ['Hydroponics forums', 'University extension programs', 'Manufacturer technical support']
    }
  };

  const generateRecommendations = (inputs) => {
    const recommendations = [];

    // Space-based recommendations
    if (inputs.space === 'Apartment/Small') {
      recommendations.push({
        title: 'Hydroponics',
        description: 'Perfect for small spaces - grows plants in nutrient-rich water without soil',
        space: 'Apartment/Small',
        category: 'Space Solution',
        benefits: [
          'Saves 70% more water than soil gardening',
          'No soil needed - perfect for balconies',
          'Higher yield in compact setups',
          'Reduced pest issues',
          'Faster growth rates'
        ],
        bestFor: ['Leafy Greens', 'Herbs', 'Lettuce', 'Spinach', 'Basil'],
        setupCost: 'Low to Medium (₹3,000-8,000)',
        maintenance: 'Medium - Regular water level checks',
        ideal: true
      });

      recommendations.push({
        title: 'Vertical Gardening',
        description: 'Stack plants vertically to maximize limited floor space',
        space: 'Apartment/Small',
        category: 'Space Solution',
        benefits: [
          'Uses 50% less horizontal space',
          'Creates living walls and air filters',
          'Better air circulation',
          'Easier maintenance',
          'Aesthetic appeal'
        ],
        bestFor: ['Herbs', 'Strawberries', 'Pothos', 'Petunias', 'Succulents'],
        setupCost: 'Low (₹1,500-4,000)',
        maintenance: 'Low to Medium - Water flows downward',
        ideal: true
      });
    } else if (inputs.space === 'Large Backyard') {
      recommendations.push({
        title: 'Greenhouse',
        description: 'Controlled environment for year-round growing',
        space: 'Large Backyard',
        category: 'Space Solution',
        benefits: [
          'Year-round growing regardless of weather',
          'Complete climate control',
          'Protection from pests and extreme weather',
          'Higher yields and longer seasons',
          'Investment for serious gardeners'
        ],
        bestFor: ['Tomatoes', 'Peppers', 'Cucumbers', 'Exotic Plants', 'Off-season crops'],
        setupCost: 'Medium to High (₹15,000-50,000+)',
        maintenance: 'Medium - Ventilation and humidity control needed',
        ideal: true
      });

      recommendations.push({
        title: 'Raised Beds',
        description: 'Traditional elevated growing beds with excellent drainage',
        space: 'Large Backyard',
        category: 'Space Solution',
        benefits: [
          'Better drainage and soil control',
          'Easier accessibility and maintenance',
          'Separate zones for different plants',
          'Aesthetic appeal',
          'Less back strain during gardening'
        ],
        bestFor: ['Vegetables', 'Root Crops', 'Herbs', 'Mixed Planting', 'Flowers'],
        setupCost: 'Low to Medium (₹2,000-8,000 per bed)',
        maintenance: 'Medium - Seasonal watering and weeding',
        ideal: true
      });
    }

    // Environment-based recommendations
    if (inputs.environment === 'Low Light') {
      recommendations.push({
        title: 'Indoor Hydroponics with Grow Lights',
        description: 'Combines hydroponics with artificial lighting for dark areas',
        environment: 'Low Light',
        category: 'Lighting Solution',
        benefits: [
          'Independent of natural sunlight',
          'Perfect for indoor spaces',
          'Adjustable light spectrum for growth',
          'Increased photosynthesis',
          'Works in basements, closets, or dim rooms'
        ],
        bestFor: ['Leafy Greens', 'Microgreens', 'Lettuce', 'Spinach', 'Herbs', 'Seedlings'],
        setupCost: 'Low to Medium (₹4,000-10,000)',
        maintenance: 'Low - Set timer for lights, monitor water',
        ideal: true
      });
    } else if (inputs.environment === 'High Sun') {
      recommendations.push({
        title: 'Outdoor Raised Beds',
        description: 'Harness natural sunlight for maximum plant growth',
        environment: 'High Sun',
        category: 'Lighting Solution',
        benefits: [
          'Free natural light',
          'Higher yields with more sun exposure',
          'No electricity needed',
          'Better nutrient synthesis',
          'Natural pest control from beneficial insects'
        ],
        bestFor: ['Tomatoes', 'Peppers', 'Beans', 'Squash', 'Cucumbers', 'Sunflowers'],
        setupCost: 'Medium (₹2,000-5,000 per bed)',
        maintenance: 'Medium - Regular watering during peak hours',
        ideal: true
      });
    }

    // Effort level recommendations
    if (inputs.effortLevel === 'Low Effort') {
      recommendations.push({
        title: 'Self-Watering Hydroponic Kits',
        description: 'Automated systems that handle watering for you',
        effortLevel: 'Low Effort',
        category: 'Maintenance Solution',
        benefits: [
          'Automatic watering saves 80% of maintenance time',
          'Built-in sensors detect water levels',
          'No daily watering required',
          'Perfect for busy schedules',
          'Reduces plant stress from inconsistent watering'
        ],
        bestFor: ['Busy professionals', 'Frequent travelers', 'Beginners', 'Herbs', 'Leafy Greens'],
        setupCost: 'Low to Medium (₹2,500-7,000)',
        maintenance: 'Very Low - Weekly checks only',
        ideal: true
      });
    } else if (inputs.effortLevel === 'High Effort') {
      recommendations.push({
        title: 'Advanced Hydroponic System',
        description: 'Professional-grade setup with maximum control',
        effortLevel: 'High Effort',
        category: 'Maintenance Solution',
        benefits: [
          'Complete environmental control',
          'Optimize every growth factor',
          'Highest yields possible',
          'Monitor pH, EC, temperature daily',
          'Customizable for specific crop needs'
        ],
        bestFor: ['Enthusiasts', 'Maximizing yields', 'Specialty crops', 'Research gardens'],
        setupCost: 'Medium to High (₹8,000-25,000+)',
        maintenance: 'High - Daily monitoring and adjustments',
        ideal: true
      });
    }

    return recommendations;
  };

  const resetForm = () => {
    setStep(1);
    setResults([]);
    setFormData({
      space: 'Apartment/Small',
      environment: 'Low Light',
      effortLevel: 'Low Effort'
    });
    setExpandedSystem(null);
  };

  // ============================================
  // STEP 1: INPUT FORM
  // ============================================
  if (step === 1) {
    return (
      <div className="recommendations-container">
        <Toast toasts={toasts} removeToast={removeToast} />
        <div className="recommendations-header">
          <div>
            <h2><Home size={28} /> Home Garden Setup Recommendation</h2>
            <p>Get personalized recommendations for your indoor or outdoor garden based on your space and conditions</p>
          </div>
        </div>

        <div className="recommendations-card form-card">
          <h3>Your Garden Details</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Available Space</label>
              <select 
                name="space" 
                value={formData.space}
                onChange={handleInputChange}
                required
              >
                <option value="Apartment/Small">Apartment/Small Space (Balcony, Room, Patio)</option>
                <option value="Large Backyard">Large Backyard/Garden Area</option>
              </select>
              <small>Select based on your available growing space</small>
            </div>

            <div className="form-group">
              <label>Light Conditions</label>
              <select 
                name="environment" 
                value={formData.environment}
                onChange={handleInputChange}
                required
              >
                <option value="Low Light">Low Light (Indoor, Shaded Area)</option>
                <option value="High Sun">High Sun (6+ hours direct sunlight daily)</option>
              </select>
              <small>Choose based on your location's natural light availability</small>
            </div>

            <div className="form-group">
              <label>Your Effort Level</label>
              <select 
                name="effortLevel" 
                value={formData.effortLevel}
                onChange={handleInputChange}
                required
              >
                <option value="Low Effort">Low Effort (Busy, Less Time for Maintenance)</option>
                <option value="High Effort">High Effort (Enthusiast, Want to Optimize Everything)</option>
              </select>
              <small>Choose based on how much time you can dedicate to gardening</small>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sprout size={18} />
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="info-box">
            <strong>💡 Tip:</strong> Honest answers about your space and available time lead to better recommendations. Choose the option that best matches your situation!
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 2: RESULTS
  // ============================================
  
  return (
    <div className="recommendations-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      {/* Premium Header */}
      <div className="premium-header">
        <div className="header-content">
          <div className="header-text">
            <h1><Sprout size={32} /> Your Perfect Garden Setup</h1>
            <p>AI-powered recommendations tailored to your space and lifestyle</p>
          </div>
          <button className="btn-new-search" onClick={resetForm}>
            <RefreshCw size={18} /> New Analysis
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="recommendations-card summary-card">
        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Recommended Systems</div>
          </div>
          <div className="stat">
            <div className="stat-value">{formData.space === 'Apartment/Small' ? 'Small' : 'Large'}</div>
            <div className="stat-label">Space Type</div>
          </div>
          <div className="stat">
            <div className="stat-value">{formData.environment === 'Low Light' ? 'Low' : 'High'}</div>
            <div className="stat-label">Light Condition</div>
          </div>
          <div className="stat">
            <div className="stat-value">{formData.effortLevel === 'Low Effort' ? 'Low' : 'High'}</div>
            <div className="stat-label">Maintenance Level</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-list">
        {results.map((system, index) => (
          <div
            key={system.title}
            className={`system-card ${expandedSystem === system.title ? 'expanded' : ''}`}
          >
            {/* Card Header */}
            <div
              className="system-card-header"
              onClick={() => setExpandedSystem(expandedSystem === system.title ? null : system.title)}
            >
              <div className="system-info">
                <div className="system-rank">#{index + 1}</div>
                <div className="system-details">
                  <h4>{system.title}</h4>
                  <p className="system-desc">{system.description}</p>
                </div>
              </div>

              <div className="system-tags">
                <span className="tag category">{system.category}</span>
                {system.ideal && <span className="tag ideal">⭐ Ideal Match</span>}
              </div>

              <div className={`expand-icon ${expandedSystem === system.title ? 'rotate' : ''}`}>
                ▼
              </div>
            </div>

            {/* Card Details (Expanded Content) */}
            {expandedSystem === system.title && (
              <div className="system-card-details">
                {/* Benefits */}
                {system.benefits && (
                  <div className="section">
                    <h5>✨ Key Benefits</h5>
                    <ul className="benefits-list">
                      {system.benefits.map((benefit, i) => (
                        <li key={i}>
                          <CheckCircle size={16} className="check-icon" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best For */}
                {system.bestFor && (
                  <div className="section">
                    <h5>🌿 Best For Growing</h5>
                    <div className="tags-container">
                      {system.bestFor.map((crop, i) => (
                        <span key={i} className="crop-tag">{crop}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Setup Cost */}
                {system.setupCost && (
                  <div className="section info-grid">
                    <div className="info-item">
                      <Zap size={20} />
                      <div>
                        <strong>Setup Cost</strong>
                        <p>{system.setupCost}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <Target size={20} />
                      <div>
                        <strong>Maintenance Effort</strong>
                        <p>{system.maintenance}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendation Details */}
                <div className="section details-box">
                  <h5>📋 System Details</h5>
                  <div className="details-content">
                    {system.space && (
                      <p><strong>Space:</strong> {system.space}</p>
                    )}
                    {system.environment && (
                      <p><strong>Environment:</strong> {system.environment}</p>
                    )}
                    {system.effortLevel && (
                      <p><strong>Effort Level:</strong> {system.effortLevel}</p>
                    )}
                    <p><strong>Category:</strong> {system.category}</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="section">
                  <button 
                    className="btn-action"
                    onClick={() => setSelectedGuide(system.title)}
                  >
                    <BookOpen size={18} /> Learn More & Setup Guide
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="recommendations-card actions-card">
        <div className="action-button">
          <CheckCircle size={20} />
          <div>
            <strong>Ready to Start Your Garden?</strong>
            <p>Choose a system above and use the setup guide to get started with your home garden today</p>
          </div>
        </div>
      </div>

      {/* Setup Guide Modal */}
      {selectedGuide && setupGuides[selectedGuide] && (
        <SetupGuideModal 
          guide={setupGuides[selectedGuide]} 
          onClose={() => setSelectedGuide(null)}
        />
      )}
    </div>
  );
};

// ============================================
// SETUP GUIDE MODAL COMPONENT
// ============================================
const SetupGuideModal = ({ guide, onClose }) => {
  const [activeStep, setActiveStep] = React.useState(1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content setup-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>{guide.title}</h2>
            <p>{guide.overview}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-box">
            <Clock size={20} />
            <div>
              <strong>Setup Time</strong>
              <p>{guide.timeToSetup}</p>
            </div>
          </div>
          <div className="stat-box">
            <AlertTriangle size={20} />
            <div>
              <strong>Difficulty</strong>
              <p>{guide.difficultyLevel}</p>
            </div>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="steps-navigation">
          {guide.steps.map((step) => (
            <button
              key={step.number}
              className={`step-button ${activeStep === step.number ? 'active' : ''}`}
              onClick={() => setActiveStep(step.number)}
            >
              {step.number}
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="step-content">
          {guide.steps.map((step) => (
            activeStep === step.number && (
              <div key={step.number} className="step-detail">
                <h3>Step {step.number}: {step.title}</h3>
                <p className="step-description">{step.details}</p>

                {/* Tips */}
                <div className="tips-section">
                  <h4>💡 Pro Tips</h4>
                  <ul className="tips-list">
                    {step.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Navigation */}
                <div className="step-navigation">
                  {step.number > 1 && (
                    <button 
                      className="btn-nav prev"
                      onClick={() => setActiveStep(step.number - 1)}
                    >
                      ← Previous
                    </button>
                  )}
                  {step.number < guide.steps.length && (
                    <button 
                      className="btn-nav next"
                      onClick={() => setActiveStep(step.number + 1)}
                    >
                      Next → 
                    </button>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Materials Needed */}
        {guide.materials && (
          <div className="additional-section">
            <h3><ShoppingCart size={20} /> Materials Needed</h3>
            <div className="materials-list">
              {guide.materials.map((material, i) => (
                <div key={i} className="material-item">
                  <span className="checkmark">✓</span>
                  <span>{material}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {guide.commonMistakes && (
          <div className="additional-section">
            <h3><AlertTriangle size={20} /> Common Mistakes to Avoid</h3>
            <ul className="mistakes-list">
              {guide.commonMistakes.map((mistake, i) => (
                <li key={i}>{mistake}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Resources */}
        {guide.resources && (
          <div className="additional-section">
            <h3><BookOpen size={20} /> Helpful Resources</h3>
            <div className="resources-list">
              {guide.resources.map((resource, i) => (
                <div key={i} className="resource-item">
                  <ArrowRight size={16} />
                  <span>{resource}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <button className="btn-close-modal" onClick={onClose}>
          Close Setup Guide
        </button>
      </div>
    </div>
  );
};

export default UserRecommendations;
