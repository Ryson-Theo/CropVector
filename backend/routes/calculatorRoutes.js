const express = require('express');
const router = express.Router();
const calcCtrl = require('../controllers/calculatorController');

// POST /api/calculator/yield
router.post('/yield', calcCtrl.cropYield);

// POST /api/calculator/sales
router.post('/sales', calcCtrl.salesExpense);

module.exports = router;
