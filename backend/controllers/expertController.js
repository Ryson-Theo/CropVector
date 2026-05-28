const mongoose = require('mongoose');
const Suggestion = require('../models/ExpertSuggestion');

exports.addSuggestion = async (req, res) => {
  try {
    const { sessionId, crop, note, expertId } = req.body;
    const s = new Suggestion({ sessionId, crop, note, expertId });
    await s.save();
    res.json({ ok: true, suggestion: s });
  } catch (err) {    res.status(500).json({ error: 'Could not save suggestion' });
  }
};

exports.getSuggestionsForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const list = await Suggestion.find({ sessionId }).lean();
    res.json({ suggestions: list });
  } catch (err) {    res.status(500).json({ error: 'Could not fetch' });
  }
};

