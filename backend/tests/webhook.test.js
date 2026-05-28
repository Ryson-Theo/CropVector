const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');

describe('Webhook signature validation', () => {
  const webhookPath = '/api/marketplace/webhook/shipment';
  const payload = { trackingId: 'T123', status: 'in_transit' };
  const secret = 'testsecret';

  beforeAll(() => {
    process.env.SHIPMENT_WEBHOOK_SECRET = secret;
  });

  test('rejects request with missing signature', async () => {
    const res = await request(app)
      .post(webhookPath)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Missing signature/);
  });

  test('accepts request with valid signature', async () => {
    const raw = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret).update(Buffer.from(raw)).digest('hex');

    const res = await request(app)
      .post(webhookPath)
      .set('Content-Type', 'application/json')
      .set('x-signature', hmac)
      .send(raw);

    expect([200,201,204]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('received', true);
  });
});
