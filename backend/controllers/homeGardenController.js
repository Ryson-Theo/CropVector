const HomeGarden = require('../models/HomeGarden');

// Get user's home garden data
exports.getHomeGarden = async (req, res) => {
  try {
    const userId = req.user.id;

    let homeGarden = await HomeGarden.findOne({ userId });

    // If no data exists, return empty structure
    if (!homeGarden) {
      homeGarden = {
        zones: [],
        waterLogs: [],
        nutrientRecipes: [],
        lightSchedules: [],
        pestMarks: [],
        customAlerts: [],
        harvestLogs: []
      };
    }

    res.json(homeGarden);
  } catch (error) {    res.status(500).json({ error: 'Failed to fetch home garden data' });
  }
};

// Save/update user's home garden data
exports.saveHomeGarden = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      zones,
      waterLogs,
      nutrientRecipes,
      lightSchedules,
      pestMarks,
      customAlerts,
      harvestLogs
    } = req.body;

    // Find existing data or create new
    let homeGarden = await HomeGarden.findOne({ userId });

    if (homeGarden) {
      // Update existing
      homeGarden.zones = zones || [];
      homeGarden.waterLogs = waterLogs || [];
      homeGarden.nutrientRecipes = nutrientRecipes || [];
      homeGarden.lightSchedules = lightSchedules || [];
      homeGarden.pestMarks = pestMarks || [];
      homeGarden.customAlerts = customAlerts || [];
      homeGarden.harvestLogs = harvestLogs || [];
      // updatedAt will be set by pre-save middleware

      await homeGarden.save();
    } else {
      // Create new
      homeGarden = new HomeGarden({
        userId,
        zones: zones || [],
        waterLogs: waterLogs || [],
        nutrientRecipes: nutrientRecipes || [],
        lightSchedules: lightSchedules || [],
        pestMarks: pestMarks || [],
        customAlerts: customAlerts || [],
        harvestLogs: harvestLogs || []
      });

      await homeGarden.save();
    }

    res.json({ message: 'Home garden data saved successfully', data: homeGarden });
  } catch (error) {    res.status(500).json({ error: 'Failed to save home garden data' });
  }
};

// Update specific section of home garden data
exports.updateHomeGardenSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { section } = req.params; // zones, waterLogs, etc.
    const data = req.body;

    // Validate section name
    const validSections = ['zones', 'waterLogs', 'nutrientRecipes', 'lightSchedules', 'pestMarks', 'customAlerts', 'harvestLogs'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: 'Invalid section name' });
    }

    // Find existing data or create new
    let homeGarden = await HomeGarden.findOne({ userId });

    if (!homeGarden) {
      homeGarden = new HomeGarden({ userId });
    }

    // Update the specific section
    homeGarden[section] = data;
    homeGarden.updatedAt = new Date();

    await homeGarden.save();

    res.json({ message: `${section} updated successfully`, data: homeGarden[section] });
  } catch (error) {    res.status(500).json({ error: `Failed to update ${req.params.section}` });
  }
};

// Delete user's home garden data (for reset functionality)
exports.deleteHomeGarden = async (req, res) => {
  try {
    const userId = req.user.id;

    await HomeGarden.findOneAndDelete({ userId });

    res.json({ message: 'Home garden data deleted successfully' });
  } catch (error) {    res.status(500).json({ error: 'Failed to delete home garden data' });
  }
};
