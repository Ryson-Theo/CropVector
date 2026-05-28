const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'crops.json');

function readCrops() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeCrops(arr) {
  fs.writeFileSync(dataFile, JSON.stringify(arr, null, 2));
}

exports.getCrops = async (req, res) => {
  try {
    const arr = readCrops();
    res.json({ ok: true, crops: arr });
  } catch (err) {    res.status(500).json({ error: 'Could not read crops' });
  }
};

exports.addCrop = async (req, res) => {
  try {
    const crop = req.body;
    const arr = readCrops();
    arr.push(crop);
    writeCrops(arr);
    res.json({ ok: true, crop });
  } catch (err) {    res.status(500).json({ error: 'Could not add crop' });
  }
};

exports.replaceCrops = async (req, res) => {
  try {
    const arr = req.body.crops;
    if (!Array.isArray(arr)) return res.status(400).json({ error: 'crops must be an array' });
    writeCrops(arr);
    res.json({ ok: true });
  } catch (err) {    res.status(500).json({ error: 'Could not replace crops' });
  }
};

exports.deleteCrop = async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const arr = readCrops();
    if (isNaN(idx) || idx < 0 || idx >= arr.length) return res.status(400).json({ error: 'invalid index' });
    const removed = arr.splice(idx, 1);
    writeCrops(arr);
    res.json({ ok: true, removed });
  } catch (err) {    res.status(500).json({ error: 'Could not delete crop' });
  }
};

