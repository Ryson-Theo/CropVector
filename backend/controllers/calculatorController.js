// simple math helpers for farmers
exports.cropYield = (req, res) => {
  const { area, yieldPerHa, pricePerKg } = req.body;
  const a = Number(area);
  const y = Number(yieldPerHa);
  const p = Number(pricePerKg);
  if ([a, y, p].some(isNaN)) {
    return res.status(400).json({ error: "Invalid numeric inputs." });
  }
  const totalKg = a * y;
  const revenue = totalKg * p;
  res.json({ totalKg, revenue });
};

exports.salesExpense = (req, res) => {
  const { grossRevenue, transportCost, packagingCost, taxRate } = req.body;
  const rev = Number(grossRevenue);
  const tr = Number(transportCost);
  const pk = Number(packagingCost);
  const tax = Number(taxRate) / 100;
  if ([rev, tr, pk, tax].some(isNaN)) {
    return res.status(400).json({ error: "Invalid numeric inputs." });
  }
  const expenses = tr + pk;
  const taxable = rev - expenses;
  const taxAmt = taxable * tax;
  const netProfit = taxable - taxAmt;
  res.json({ netProfit, taxAmt, expenses });
};
