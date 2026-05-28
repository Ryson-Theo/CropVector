const express = require('express');
const router = express.Router();
const marketplace = require('../controllers/marketplaceController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Shipment = require('../models/Shipment');
const { sendMail } = require('../config/mail');
let fetch;
try { fetch = require('node-fetch'); } catch(e){ fetch = global.fetch; }
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Listings
router.get('/listings', marketplace.getListings);
router.post('/listings', auth, upload.fields([{ name: 'images', maxCount: 6 }]), marketplace.createListing);
router.get('/listings/:id', marketplace.getListing);
router.patch('/listings/:id', auth, upload.fields([{ name: 'images', maxCount: 6 }]), marketplace.updateListing);
router.delete('/listings/:id', auth, marketplace.deleteListing);

// Orders
router.post('/orders', auth, marketplace.createOrder);
router.get('/orders', auth, marketplace.getOrdersForUser);
router.patch('/orders/:id', auth, marketplace.updateOrder);
router.post('/orders/:id/cancel', auth, marketplace.cancelOrder);
router.delete('/orders/:id', auth, marketplace.deleteOrder);
router.get('/orders/:id/receipt', auth, marketplace.getOrderReceipt);
router.get('/orders/:id', async (req, res) => res.json({ message: 'Use /orders?userId=...' }));

// Shipments
router.post('/shipments', marketplace.createShipment || (async (req,res)=>res.status(501).json({message:'Not implemented'})));
router.patch('/shipments/:id', marketplace.updateShipment || (async (req,res)=>res.status(501).json({message:'Not implemented'})));
router.get('/shipments/:id', marketplace.getShipment || (async (req,res)=>res.status(501).json({message:'Not implemented'})));

// Webhook receiver for external shipment updates (raw body for signature validation)
router.post('/webhook/shipment', express.raw({ type: 'application/json' }), (req, res, next) => {
  // delegate to controller which validates signature and processes the payload
  try {
    return require('../controllers/marketplaceController').handleWebhook(req, res, next);
  } catch (e) {    res.status(500).json({ error: 'Webhook handler error' });
  }
});

// Reviews
router.post('/reviews', auth, marketplace.createReview);
router.get('/reviews', auth, marketplace.getReviews);
router.get('/reviews/listing/:id', async (req, res) => {
  const Review = require('../models/Review');
  const reviews = await Review.find({ listingId: req.params.id })
    .populate('reviewerId', 'fullName')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ reviews });
});
router.get('/farmer/:id/stats', marketplace.getFarmerStats);

// Admin
router.get('/admin/stats', marketplace.adminStats);

// GDPR endpoints
router.get('/user/data', auth, marketplace.getUserData);
router.delete('/user/data', auth, marketplace.deleteUserData);

// Create a listing (farmer)
exports.createListing = async (req, res) => {
  try {
    const payload = req.body || {};
    // handle uploaded images (multer)
    const images = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f) => images.push(f.path));
    }
    // farmerId should come from authenticated user in real app
    const farmerId = (req.user && req.user.id) || payload.farmerId || req.body.userId || req.headers['x-user-id'] || null;
    const listing = new Listing({ ...payload, farmerId, images });
    await listing.save();
    res.status(201).json({ message: 'Listing created', listing });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Get listings with simple filters
exports.getListings = async (req, res) => {
  try {
    const { q, minPrice, maxPrice, unit, category, page = 1, limit = 20 } = req.query;
    const filter = { status: 'active' };
    if (q) filter.$or = [ { title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') } ];
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (unit) filter.unit = unit;
    if (category) filter.category = category;

    const listings = await Listing.find(filter)
      .skip((page-1)*limit)
      .limit(Number(limit))
      .lean();
    res.json({ listings });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    // Ownership check (basic): farmerId must match req.body.userId or header
    const userId = (req.user && req.user.id) || req.body.userId || req.headers['x-user-id'];
    if (listing.farmerId && userId && listing.farmerId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: not owner' });
    }
    Object.assign(listing, req.body);
    if (req.files && Array.isArray(req.files)) {
      const imgs = req.files.map((f) => f.path);
      listing.images = listing.images ? listing.images.concat(imgs) : imgs;
    }
    await listing.save();
    res.json({ message: 'Listing updated', listing });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const userId = (req.user && req.user.id) || req.body.userId || req.headers['x-user-id'];
    if (listing.farmerId && userId && listing.farmerId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: not owner' });
    }
    listing.status = 'removed';
    await listing.save();
    res.json({ message: 'Listing removed' });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Create order (buyer)
exports.createOrder = async (req, res) => {
  try {
    const { listingId, quantity } = req.body;
    const buyerId = (req.user && req.user.id) || req.body.buyerId || req.headers['x-user-id'];
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const unitPrice = listing.price;
    const totalPrice = unitPrice * Number(quantity);
    const order = new Order({ listingId, buyerId, farmerId: listing.farmerId, quantity, unitPrice, totalPrice });
    await order.save();
    res.status(201).json({ message: 'Order created', order });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const authenticatedUserId = req.user && req.user.id;
    const targetUserId = userId || authenticatedUserId;
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID required' });
    }
    
    const orders = await Order.find({ $or: [{ buyerId: targetUserId }, { farmerId: targetUserId }] })
      .populate('listingId')
      .populate('buyerId', 'fullName email phone place')
      .populate('farmerId', 'fullName email phone place')
      .lean();
    res.json({ orders });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Update order status
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req.user && req.user.id) || req.headers['x-user-id'];
    
    if (!id) {
      return res.status(400).json({ message: 'Order ID required' });
    }
    
    if (!status) {
      return res.status(400).json({ message: 'Status required' });
    }
    
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(id).populate('buyerId', 'email fullName').populate('farmerId', 'email fullName');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only farmer or buyer can update order status
    if (order.farmerId._id.toString() !== userId && order.buyerId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this order' });
    }
    
    order.status = status;
    await order.save();
    
    // Send notifications
    try {
      const subject = `Order ${order._id.substring(0, 8)} status updated to ${status}`;
      const html = `<p>Your order status has been updated to <strong>${status}</strong></p>`;
      
      if (order.buyerId?.email) {
        sendMail({ to: order.buyerId.email, subject, html }).catch(e => console.error('Email error:', e));
      }
      if (order.farmerId?.email) {
        sendMail({ to: order.farmerId.email, subject, html }).catch(e => console.error('Email error:', e));
      }
    } catch (e) {    }
    
    res.json({ message: 'Order updated', order });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Reviews
exports.createReview = async (req, res) => {
  try {
    const { subjectId, listingId, rating, comment } = req.body;
    const reviewerId = (req.user && req.user.id) || req.body.reviewerId || req.headers['x-user-id'];
    const review = new Review({ reviewerId, subjectId, listingId, rating, comment });
    await review.save();
    res.status(201).json({ message: 'Review created', review });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Shipments: create, update, get
exports.createShipment = async (req, res) => {
  try {
    const { orderId, carrier, trackingId, estimatedDelivery } = req.body;
    const shipment = new Shipment({ orderId, carrier, trackingId, estimatedDelivery, history: [{ status: 'pending', at: new Date() }] });
    await shipment.save();
    res.status(201).json({ message: 'Shipment created', shipment });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    const { status } = req.body;
    if (status) {
      shipment.status = status;
      shipment.history = shipment.history || [];
      shipment.history.push({ status, at: new Date() });
    }
    await shipment.save();
    // Notify buyer and farmer by email if possible
    try {
      const order = await Order.findById(shipment.orderId).populate('buyerId', 'email fullName').populate('farmerId', 'email fullName');
      if (order) {
        const buyerEmail = order.buyerId?.email;
        const farmerEmail = order.farmerId?.email;
        const subject = `Shipment status updated: ${shipment.status}`;
        const html = `<p>Shipment for order <strong>${order._id}</strong> updated to <strong>${shipment.status}</strong>.</p>
          <p>Tracking ID: ${shipment.trackingId || 'N/A'}</p>`;
        if (buyerEmail) sendMail({ to: buyerEmail, subject, html }).catch(() => {});
        if (farmerEmail) sendMail({ to: farmerEmail, subject, html }).catch(() => {});
      }
    } catch (e) { console.error('Shipment notify error', e); }

    // Optionally POST to external webhook
    try {
      const webhook = process.env.SHIPMENT_WEBHOOK_URL;
      if (webhook) {
        const payload = { shipment: shipment.toObject() };
        if (fetch) {
          (async ()=>{
            try { await fetch(webhook, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }); }
            catch(e){ console.error('Webhook POST failed', e); }
          })();
        }
      }
    } catch (e) { console.error('Webhook send error', e); }
    res.json({ message: 'Shipment updated', shipment });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.getShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).lean();
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json({ shipment });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Webhook handler with rotating-secret + timestamp validation and auto-update
exports.handleWebhook = async (req, res) => {
  try {
    const raw = req.body; // Buffer (express.raw used in route)

    const secretsEnv = process.env.SHIPMENT_WEBHOOK_SECRETS || process.env.SHIPMENT_WEBHOOK_SECRET || '';
    const secrets = secretsEnv.split(',').map(s => s.trim()).filter(Boolean);
    const signatureHeader = req.headers['x-signature'] || req.headers['x-hub-signature-256'] || req.headers['x-signature-256'] || '';
    const timestampHeader = req.headers['x-timestamp'] || req.headers['x-request-timestamp'] || '';

    if (secrets.length > 0) {
      if (!signatureHeader || !timestampHeader) {
        return res.status(401).json({ message: 'Missing signature or timestamp' });
      }

      const toleranceSec = Number(process.env.SHIPMENT_WEBHOOK_TOLERANCE_SEC || 300);
      const ts = Number(timestampHeader);
      const now = Math.floor(Date.now() / 1000);
      if (Number.isNaN(ts) || Math.abs(now - ts) > toleranceSec) {
        return res.status(401).json({ message: 'Timestamp outside tolerance' });
      }

      const payloadBuf = Buffer.isBuffer(raw) ? raw : Buffer.from(typeof raw === 'string' ? raw : JSON.stringify(raw));
      const signedInput = Buffer.concat([Buffer.from(String(ts) + '.'), payloadBuf]);

      let valid = false;
      for (const secret of secrets) {
        const hmac = crypto.createHmac('sha256', secret).update(signedInput).digest('hex');
        if (signatureHeader === hmac || signatureHeader === `sha256=${hmac}`) {
          valid = true; break;
        }
      }
      if (!valid) return res.status(401).json({ message: 'Invalid signature' });
    }

    // parse payload
    let payload = null;
    try { payload = JSON.parse(Buffer.isBuffer(raw) ? raw.toString('utf8') : JSON.stringify(raw)); } catch (e) { payload = req.body; }

    const { shipmentId, trackingId, status } = payload || {};
    let shipment = null;
    if (shipmentId) shipment = await Shipment.findById(shipmentId);
    else if (trackingId) shipment = await Shipment.findOne({ trackingId });

    if (!shipment) return res.json({ received: true, updated: false });

    if (status) {
      shipment.status = status;
      shipment.history = shipment.history || [];
      shipment.history.push({ status, at: new Date() });
      await shipment.save();
    }

    try {
      const order = await Order.findById(shipment.orderId).populate('buyerId', 'email fullName').populate('farmerId', 'email fullName');
      if (order) {
        const buyerEmail = order.buyerId?.email;
        const farmerEmail = order.farmerId?.email;
        const subject = `Shipment status updated: ${shipment.status}`;
        const html = `<p>Shipment for order <strong>${order._id}</strong> updated to <strong>${shipment.status}</strong>.</p>
          <p>Tracking ID: ${shipment.trackingId || 'N/A'}</p>`;
        if (buyerEmail) sendMail({ to: buyerEmail, subject, html }).catch(() => {});
        if (farmerEmail) sendMail({ to: farmerEmail, subject, html }).catch(() => {});
      }
    } catch (e) { console.error('Webhook notify error', e); }

    res.json({ received: true, updated: true, shipment });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Admin stats: total sales and revenue with optional date range filtering
exports.adminStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filters
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
      // Set to end of day
      dateFilter.$lte.setHours(23, 59, 59, 999);
    }
    
    const matchStage = dateFilter && Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter, status: { $ne: 'cancelled' } }
      : { status: { $ne: 'cancelled' } };

    // Get total orders and revenue
    const totalOrders = await Order.countDocuments(matchStage);
    const revenueAgg = await Order.aggregate([
      { $match: matchStage },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' } } }
    ]);
    const revenue = revenueAgg[0] ? revenueAgg[0].revenue : 0;

    // Get daily revenue trend
    const dailyRevenue = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    // Get top performing farmers
    const topFarmers = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$farmerId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $project: { farmerId: '$_id', orderCount: 1, totalRevenue: 1, _id: 0 } }
    ]);

    // Count active farmers
    const activeFarmers = await Listing.distinct('farmerId', { status: 'active' }).countDocuments ? 
      (await Listing.find({ status: 'active' }).distinct('farmerId')).length : 0;

    res.json({
      totalOrders,
      revenue,
      dailyRevenue: dailyRevenue.map(d => ({ date: d._id, revenue: d.revenue })),
      ordersByStatus: ordersByStatus.length > 0 ? ordersByStatus : 
        [{ status: 'pending', count: 0 }, { status: 'confirmed', count: 0 }, { status: 'delivered', count: 0 }],
      topFarmers,
      activeFarmers
    });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// GDPR-compliant delete user data endpoint
// Deletes all user-associated marketplace data (listings, orders, reviews, shipments)
exports.deleteUserData = async (req, res) => {
  try {
    const userId = (req.user && req.user.id) || req.body.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    // Verify user can only delete their own data
    if (req.user && req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: cannot delete other users\' data' });
    }

    // Delete all user's listings
    const deletedListings = await Listing.deleteMany({ farmerId: userId });
    
    // Delete all user's orders (as buyer)
    const deletedBuyerOrders = await Order.deleteMany({ buyerId: userId });
    
    // Delete all user's orders (as farmer) - optional: you could anonymize instead
    const deletedFarmerOrders = await Order.deleteMany({ farmerId: userId });
    
    // Delete all user's reviews
    const deletedReviews = await Review.deleteMany({ reviewerId: userId });
    
    // Delete associated shipments for buyer orders
    const orderIds = await Order.find({ buyerId: userId }).select('_id');
    await Shipment.deleteMany({ orderId: { $in: orderIds.map(o => o._id) } });

    res.json({
      message: 'User data successfully deleted (GDPR compliant)',
      summary: {
        listingsDeleted: deletedListings.deletedCount,
        buyerOrdersDeleted: deletedBuyerOrders.deletedCount,
        farmerOrdersDeleted: deletedFarmerOrders.deletedCount,
        reviewsDeleted: deletedReviews.deletedCount,
        shipmentsDeleted: orderIds.length
      }
    });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Get user's marketplace data (export for GDPR request)
exports.getUserData = async (req, res) => {
  try {
    const userId = (req.user && req.user.id) || req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    // Verify user can only access their own data
    if (req.user && req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: cannot access other users\' data' });
    }

    const listings = await Listing.find({ farmerId: userId }).lean();
    const buyerOrders = await Order.find({ buyerId: userId }).lean();
    const farmerOrders = await Order.find({ farmerId: userId }).lean();
    const reviews = await Review.find({ $or: [{ reviewerId: userId }, { subjectId: userId }] }).lean();
    const shipments = await Shipment.find({ 
      orderId: { $in: [...buyerOrders.map(o => o._id), ...farmerOrders.map(o => o._id)] } 
    }).lean();

    res.json({
      userId,
      listings,
      buyerOrders,
      farmerOrders,
      reviews,
      shipments,
      exportDate: new Date().toISOString()
    });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

module.exports = router;
