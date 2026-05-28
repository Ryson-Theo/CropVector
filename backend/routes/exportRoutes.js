const express = require('express');
const router = express.Router();
const Recommendation = require('../models/Recommendation');
const pdfService = require('../services/pdfService');
const puppeteer = require('puppeteer');// GET /api/export/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;    const recommendation = await Recommendation.findOne({ sessionId });    if (!recommendation) {      return res.status(404).json({ error: 'Session not found', sessionId });
    }    const htmlContent = pdfService.generateRecommendationPDF(
      sessionId,
      recommendation.farmer,
      recommendation.climate,
      recommendation.results
    );    // Try PDF generation, fallback to HTML if it fails
    try {      const browser = await Promise.race([
        puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Puppeteer timeout')), 15000))
      ]);
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '12mm', right: '12mm' }
      });

      await browser.close();      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="crop-recommendation-${sessionId}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {      // Fallback: send as HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="crop-recommendation-${sessionId}.html"`);
      res.send(htmlContent);
    }

  } catch (err) {    res.status(500).json({ error: 'Export generation failed', details: err.message });
  }
});

module.exports = router;

