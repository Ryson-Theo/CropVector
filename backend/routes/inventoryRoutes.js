const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Get all inventory items for a farmer
router.get('/', auth, async (req, res) => {
  try {
    const { farmerId } = req.query;
    
    if (!farmerId) {
      return res.status(400).json({ message: 'farmerId is required' });
    }

    const items = await Inventory.find({ farmerId })
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (error) {    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
});

// Create new inventory item
router.post('/', auth, async (req, res) => {
  try {
    const {
      farmerId,
      itemType,
      productName,
      quantity,
      unit,
      storageLocation,
      expiryDate,
      supplierName,
      supplierEmail,
      unitCost,
      seedVariety,
      npkRatio,
      batchNumber,
      description
    } = req.body;

    if (!itemType || !productName || !quantity || !supplierName) {
      return res.status(400).json({ 
        message: 'Missing required fields: itemType, productName, quantity, supplierName' 
      });
    }

    const newItem = new Inventory({
      farmerId,
      itemType,
      productName,
      quantity,
      unit: unit || 'kg',
      storageLocation: storageLocation || {},
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      supplierName,
      supplierEmail,
      unitCost: unitCost || 0,
      seedVariety,
      npkRatio,
      batchNumber,
      description,
      totalValue: (quantity || 0) * (unitCost || 0),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
});

// Update inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    Object.assign(item, req.body);
    item.updatedAt = new Date();

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
});

module.exports = router;

