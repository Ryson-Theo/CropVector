const request = require('supertest');
const app = require('../server');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Listing = require('../models/Listing');

let mongoServer;

describe('Webhook integration (shipment update modifies DB)', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB server for tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect mongoose to in-memory DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      });
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  afterEach(async () => {
    // Clear collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  test('valid webhook updates shipment status and persists to DB', async () => {
    const secret = 'testsecret';
    process.env.SHIPMENT_WEBHOOK_SECRETS = secret;

    // Create test data: farmer, buyer, listing, order, shipment
    const farmer = new Order({
      listingId: new mongoose.Types.ObjectId(),
      buyerId: new mongoose.Types.ObjectId(),
      farmerId: new mongoose.Types.ObjectId(),
      quantity: 5,
      unitPrice: 100,
      totalPrice: 500,
      status: 'pending'
    });
    await farmer.save();

    const shipment = new Shipment({
      orderId: farmer._id,
      carrier: 'FedEx',
      trackingId: 'WEBHOOK_TEST_123',
      status: 'pending',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      history: [{ status: 'pending', at: new Date() }]
    });
    await shipment.save();

    // Prepare webhook payload and signature
    const payload = { trackingId: 'WEBHOOK_TEST_123', status: 'in_transit' };
    const ts = Math.floor(Date.now() / 1000);
    const raw = Buffer.from(JSON.stringify(payload));
    const signedInput = Buffer.concat([Buffer.from(String(ts) + '.'), raw]);
    const hmac = crypto.createHmac('sha256', secret).update(signedInput).digest('hex');

    // POST signed webhook
    const res = await request(app)
      .post('/api/marketplace/webhook/shipment')
      .set('Content-Type', 'application/json')
      .set('x-timestamp', String(ts))
      .set('x-signature', hmac)
      .send(raw);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('received', true);
    expect(res.body).toHaveProperty('updated', true);

    // Verify shipment was updated in the database
    const updatedShipment = await Shipment.findById(shipment._id);
    expect(updatedShipment).not.toBeNull();
    expect(updatedShipment.status).toBe('in_transit');
    expect(updatedShipment.history.length).toBeGreaterThan(1);
    expect(updatedShipment.history[updatedShipment.history.length - 1].status).toBe('in_transit');
  });

  test('webhook with shipmentId updates correct shipment', async () => {
    const secret = 'testsecret';
    process.env.SHIPMENT_WEBHOOK_SECRETS = secret;

    // Create test order and shipment
    const order = new Order({
      listingId: new mongoose.Types.ObjectId(),
      buyerId: new mongoose.Types.ObjectId(),
      farmerId: new mongoose.Types.ObjectId(),
      quantity: 3,
      unitPrice: 50,
      totalPrice: 150,
      status: 'pending'
    });
    await order.save();

    const shipment = new Shipment({
      orderId: order._id,
      carrier: 'DHL',
      trackingId: 'DHL_TRACK_XYZ',
      status: 'pending',
      history: [{ status: 'pending', at: new Date() }]
    });
    await shipment.save();

    // Webhook payload using shipmentId
    const payload = { shipmentId: shipment._id.toString(), status: 'delivered' };
    const ts = Math.floor(Date.now() / 1000);
    const raw = Buffer.from(JSON.stringify(payload));
    const signedInput = Buffer.concat([Buffer.from(String(ts) + '.'), raw]);
    const hmac = crypto.createHmac('sha256', secret).update(signedInput).digest('hex');

    // POST signed webhook
    const res = await request(app)
      .post('/api/marketplace/webhook/shipment')
      .set('Content-Type', 'application/json')
      .set('x-timestamp', String(ts))
      .set('x-signature', hmac)
      .send(raw);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('received', true);
    expect(res.body).toHaveProperty('updated', true);

    // Verify shipment was updated
    const updatedShipment = await Shipment.findById(shipment._id);
    expect(updatedShipment.status).toBe('delivered');
    expect(updatedShipment.history.map(h => h.status)).toContain('delivered');
  });

  test('webhook without valid secret is rejected', async () => {
    const order = new Order({
      listingId: new mongoose.Types.ObjectId(),
      buyerId: new mongoose.Types.ObjectId(),
      farmerId: new mongoose.Types.ObjectId(),
      quantity: 2,
      unitPrice: 75,
      totalPrice: 150,
      status: 'pending'
    });
    await order.save();

    const shipment = new Shipment({
      orderId: order._id,
      carrier: 'UPS',
      trackingId: 'UPS_NO_SECRET',
      status: 'pending',
      history: [{ status: 'pending', at: new Date() }]
    });
    await shipment.save();

    // Set a different secret
    process.env.SHIPMENT_WEBHOOK_SECRETS = 'correctsecret';

    const payload = { trackingId: 'UPS_NO_SECRET', status: 'in_transit' };
    const ts = Math.floor(Date.now() / 1000);
    const raw = Buffer.from(JSON.stringify(payload));
    const signedInput = Buffer.concat([Buffer.from(String(ts) + '.'), raw]);
    const hmac = crypto.createHmac('sha256', 'wrongsecret').update(signedInput).digest('hex');

    const res = await request(app)
      .post('/api/marketplace/webhook/shipment')
      .set('Content-Type', 'application/json')
      .set('x-timestamp', String(ts))
      .set('x-signature', hmac)
      .send(raw);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Invalid signature|Missing signature/);

    // Verify shipment was NOT updated
    const notUpdatedShipment = await Shipment.findById(shipment._id);
    expect(notUpdatedShipment.status).toBe('pending');
    expect(notUpdatedShipment.history.length).toBe(1);
  });

  test('webhook with expired timestamp is rejected', async () => {
    const secret = 'testsecret';
    process.env.SHIPMENT_WEBHOOK_SECRETS = secret;
    process.env.SHIPMENT_WEBHOOK_TOLERANCE_SEC = '60'; // 60 second tolerance

    const order = new Order({
      listingId: new mongoose.Types.ObjectId(),
      buyerId: new mongoose.Types.ObjectId(),
      farmerId: new mongoose.Types.ObjectId(),
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
      status: 'pending'
    });
    await order.save();

    const shipment = new Shipment({
      orderId: order._id,
      carrier: 'Fedex',
      trackingId: 'FEDEX_OLD_TS',
      status: 'pending',
      history: [{ status: 'pending', at: new Date() }]
    });
    await shipment.save();

    // Use an expired timestamp (120 seconds in the past, beyond 60sec tolerance)
    const expiredTs = Math.floor(Date.now() / 1000) - 120;
    const payload = { trackingId: 'FEDEX_OLD_TS', status: 'in_transit' };
    const raw = Buffer.from(JSON.stringify(payload));
    const signedInput = Buffer.concat([Buffer.from(String(expiredTs) + '.'), raw]);
    const hmac = crypto.createHmac('sha256', secret).update(signedInput).digest('hex');

    const res = await request(app)
      .post('/api/marketplace/webhook/shipment')
      .set('Content-Type', 'application/json')
      .set('x-timestamp', String(expiredTs))
      .set('x-signature', hmac)
      .send(raw);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Timestamp outside tolerance/);

    // Verify shipment was NOT updated
    const notUpdatedShipment = await Shipment.findById(shipment._id);
    expect(notUpdatedShipment.status).toBe('pending');
  });

  test('webhook updates order relationship and shipment together', async () => {
    const secret = 'testsecret';
    process.env.SHIPMENT_WEBHOOK_SECRETS = secret;

    // Create linked order and shipment
    const order = new Order({
      listingId: new mongoose.Types.ObjectId(),
      buyerId: new mongoose.Types.ObjectId(),
      farmerId: new mongoose.Types.ObjectId(),
      quantity: 10,
      unitPrice: 25,
      totalPrice: 250,
      status: 'confirmed',
      shipmentId: undefined // Will be set after shipment creation
    });
    await order.save();

    const shipment = new Shipment({
      orderId: order._id,
      carrier: 'International',
      trackingId: 'INTL_WEBHOOK_321',
      status: 'pending',
      history: [{ status: 'pending', at: new Date() }]
    });
    await shipment.save();

    // Update order to reference shipment
    order.shipmentId = shipment._id;
    await order.save();

    // Webhook updates shipment
    const payload = { trackingId: 'INTL_WEBHOOK_321', status: 'customs_clearance' };
    const ts = Math.floor(Date.now() / 1000);
    const raw = Buffer.from(JSON.stringify(payload));
    const signedInput = Buffer.concat([Buffer.from(String(ts) + '.'), raw]);
    const hmac = crypto.createHmac('sha256', secret).update(signedInput).digest('hex');

    const res = await request(app)
      .post('/api/marketplace/webhook/shipment')
      .set('Content-Type', 'application/json')
      .set('x-timestamp', String(ts))
      .set('x-signature', hmac)
      .send(raw);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('updated', true);

    // Verify both order and shipment reflect the update
    const updatedOrder = await Order.findById(order._id);
    const updatedShipment = await Shipment.findById(shipment._id);
    
    expect(updatedShipment.status).toBe('customs_clearance');
    expect(updatedOrder.shipmentId).toEqual(shipment._id);
  });
});
