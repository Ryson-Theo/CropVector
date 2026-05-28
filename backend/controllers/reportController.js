const Report = require('../models/Report');
const User = require('../models/User');

exports.createReport = async (req, res) => {
  try {
    const { reporterId, reporterRole, expertId, subject, message, type } = req.body;
    
    if (!reporterId || !subject) {
      return res.status(400).json({ error: 'reporterId and subject required' });
    }
    const report = new Report({ reporterId, reporterRole, expertId, subject, message, type });
    await report.save();

    // Populate reporter info for immediate response
    await report.populate({ path: 'reporterId', select: 'fullName email' });
    res.status(201).json({ message: 'Report created successfully', report });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create report' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    
    const reports = await Report.find(query)
      .populate({ path: 'reporterId', select: 'fullName email' })
      .populate({ path: 'expertId', select: 'fullName specialization' })
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

exports.getReportsByReporter = async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await Report.find({ reporterId: id })
      .populate({ path: 'reporterId', select: 'fullName email' })
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report status updated', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' });
  }
};

exports.getReportsByExpert = async (req, res) => {
  try {
    const { expertId } = req.params;
    
    // Get all unassigned consultations + consultations assigned to this expert
    const reports = await Report.find({
      type: 'consultation',
      $or: [
        { expertId: null },
        { expertId: expertId }
      ]
    })
      .populate({ path: 'reporterId', select: 'fullName email' })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseMessage, expertId } = req.body;
    if (!responseMessage || !expertId) {
      return res.status(400).json({ error: 'responseMessage and expertId required' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      {
        responseMessage,
        respondedBy: expertId,
        respondedAt: new Date(),
        status: 'resolved'
      },
      { returnDocument: 'after' }
    ).populate({ path: 'reporterId', select: 'fullName email' });

    if (!report) return res.status(404).json({ error: 'Consultation not found' });
    res.json({ message: 'Response added successfully', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add response' });
  }
};

