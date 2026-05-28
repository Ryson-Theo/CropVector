// backend/controllers/resourceController.js
const fs = require('fs').promises;
const path = require('path');

exports.getResources = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/agriculture_resources.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return res.status(500).json({ error: 'Invalid data format' });
    }
    
    res.status(200).json(data);
  } catch (error) {    res.status(500).json({ 
      error: 'Failed to load resources',
      message: error.message 
    });
  }
};
