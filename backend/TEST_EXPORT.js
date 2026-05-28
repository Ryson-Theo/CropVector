/**
 * TEST_EXPORT.js - Manual test for crop recommendation export
 * Run with: node TEST_EXPORT.js
 * 
 * This tests the API endpoint with the test cases from TEST_REPORT_RECOMMENDATIONS.txt
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/recommend';
const EXPORT_URL = 'http://localhost:5000/api/export';

// TEST CASE 1: LOAM SOIL (Balanced) - from TEST_REPORT_RECOMMENDATIONS.txt
const TEST_CASE_1 = {
  latitude: 20.5937,
  longitude: 78.9629,
  pH: 6.5,
  N: 80,
  P: 30,
  K: 200,
  soilTexture: 'loam',
  hasIrrigation: true,
  landSize: 2,
  landUnit: 'hectares'
};

// TEST CASE 2: SANDY SOIL (Drains well) - from TEST_REPORT_RECOMMENDATIONS.txt
const TEST_CASE_2 = {
  latitude: 20.5937,
  longitude: 78.9629,
  pH: 5.5,
  N: 40,
  P: 15,
  K: 100,
  soilTexture: 'sandy',
  hasIrrigation: false,
  landSize: 1.5,
  landUnit: 'hectares'
};

async function runTest(testName, testData) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get recommendations
    console.log('\n[1] Fetching recommendations...');
    const recommendRes = await axios.post(API_URL, testData, {
      timeout: 10000
    });
    
    console.log('✓ Recommendation Response:');
    console.log(`  - Session ID: ${recommendRes.data.sessionId}`);
    console.log(`  - Results Count: ${recommendRes.data.results.length}`);
    console.log(`  - Data Source: ${recommendRes.data.dataSource}`);
    console.log(`  - Soil Confidence: ${recommendRes.data.soilConfidence}`);
    
    // Show top crops
    console.log('\n  Top 5 Crops:');
    recommendRes.data.results.slice(0, 5).forEach((crop, i) => {
      console.log(`    ${i+1}. ${crop.name.padEnd(20)} | ${crop.suitabilityScore}% | ₹${crop.expectedProfit}/ha`);
    });
    
    const sessionId = recommendRes.data.sessionId;
    
    // Step 2: Export recommendation
    console.log(`\n[2] Exporting PDF for sessionId: ${sessionId}`);
    const exportRes = await axios.get(`${EXPORT_URL}/${sessionId}`, {
      responseType: 'blob',
      timeout: 30000
    });
    
    console.log('✓ Export Response:');
    console.log(`  - Content-Type: ${exportRes.headers['content-type']}`);
    console.log(`  - Content-Length: ${exportRes.data.size} bytes`);
    console.log(`  - File Type: ${exportRes.headers['content-type']?.includes('pdf') ? 'PDF' : 'HTML'}`);
    
    // Save file
    const fileExt = exportRes.headers['content-type']?.includes('pdf') ? 'pdf' : 'html';
    const fileName = path.join(__dirname, `export-${testName.replace(/ /g, '-')}.${fileExt}`);
    fs.writeFileSync(fileName, Buffer.from(exportRes.data));
    console.log(`\n✓ File saved: ${fileName}`);
    
  } catch (err) {
    console.error(' Error:', err.message);
    if (err.response?.data) {
      console.error('Response:', err.response.data);
    }
  }
}

async function main() {
  console.log(' CROP RECOMMENDATION EXPORT TEST');
  console.log('Testing recommendation system with TEST_REPORT_RECOMMENDATIONS.txt cases');
  
  await runTest('LOAM SOIL (Balanced)', TEST_CASE_1);
  await runTest('SANDY SOIL (Drains well)', TEST_CASE_2);
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ All tests completed. Check exported files.');
  console.log('='.repeat(80));
}

main().catch(console.error);
