const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Shipment = require('../models/Shipment');
const { sendMail } = require('../config/mail');
let fetch;
try { fetch = require('node-fetch'); } catch(e){ fetch = global.fetch; }
const crypto = require('crypto');
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {}

// make a new listing
exports.createListing = async (req, res) => {
  try {
    const payload = req.body || {};
    // handle uploaded images
    const images = [];
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      req.files.images.forEach((f) => images.push(f.path));
    }
    // get farmer id from auth token
    const farmerId = (req.user && req.user.id) || payload.farmerId || req.body.userId || req.headers['x-user-id'] || null;
    const listing = new Listing({ ...payload, farmerId, images });
    await listing.save();
    res.status(201).json({ message: 'Listing created', listing });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// get listings with filters
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
      .populate('farmerId', 'fullName email phone place address status')
      .skip((page-1)*limit)
      .limit(Number(limit))
      .lean();
    res.json({ listings });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('farmerId', 'fullName email phone place address status')
      .lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    // If phone is missing from User model, try to fetch from Farmer model
    if (listing.farmerId && !listing.farmerId.phone) {
      const Farmer = require('../models/Farmer');
      const farmerProfile = await Farmer.findOne({ userId: listing.farmerId._id }).lean();
      if (farmerProfile && farmerProfile.phone) {
        listing.farmerId.phone = farmerProfile.phone;
      }
    }
    
    // Get reviews for this listing
    const reviews = await Review.find({ listingId: req.params.id })
      .populate('reviewerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Calculate listing rating from reviews
    let avgRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      avgRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Get farmer stats
    const farmerStats = await Review.aggregate([
      { $match: { subjectId: listing.farmerId._id } },
      { $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    
    listing.avgRating = avgRating;
    listing.reviews = reviews;
    listing.farmerStats = farmerStats.length > 0 ? {
      avgRating: farmerStats[0].avgRating.toFixed(1),
      reviewCount: farmerStats[0].reviewCount
    } : { avgRating: 0, reviewCount: 0 };
    
    res.json({ listing });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Get farmer stats: rating, review count, and recent reviews
exports.getFarmerStats = async (req, res) => {
  try {
    const farmerId = req.params.id;
    
    // Get average rating and review count for this farmer
    const farmerStats = await Review.aggregate([
      { $match: { subjectId: new mongoose.Types.ObjectId(farmerId) } },
      { $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent reviews about this farmer
    const recentReviews = await Review.find({ subjectId: farmerId })
      .populate('reviewerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Count listings
    const listingCount = await Listing.countDocuments({ farmerId, status: 'active' });
    
    const stats = {
      farmerId,
      avgRating: farmerStats.length > 0 ? farmerStats[0].avgRating.toFixed(1) : 0,
      reviewCount: farmerStats.length > 0 ? farmerStats[0].reviewCount : 0,
      listingCount,
      recentReviews
    };
    
    res.json(stats);
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
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      const imgs = req.files.images.map((f) => f.path);
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
    const { listingId, quantity, deliveryType, deliveryAddress, city, postalCode, phone, instructions } = req.body;
    
    // Get buyerId from authenticated user or fallback options
    const buyerId = (req.user && (req.user._id || req.user.id)) || req.body.buyerId || req.headers['x-user-id'];
    
    if (!buyerId) {
      return res.status(400).json({ message: 'buyerId is required. Please login to place orders.' });
    }
    
    if (!listingId || !quantity) {
      return res.status(400).json({ message: 'listingId and quantity are required' });
    }
    
    if (!deliveryType) {
      return res.status(400).json({ message: 'deliveryType (pickup or delivery) is required' });
    }
    
    // Validate delivery fields based on type
    if (deliveryType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required for delivery orders' });
    }
    
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    const unitPrice = listing.price;
    const totalPrice = unitPrice * Number(quantity);
    
    const orderData = {
      listingId,
      buyerId,
      farmerId: listing.farmerId,
      quantity,
      unitPrice,
      totalPrice,
      deliveryType,
      deliveryAddress,
      city,
      postalCode,
      phone,
      instructions
    };
    
    const order = new Order(orderData);
    await order.save();
    
    // Populate farmer and listing details
    await order.populate('farmerId', '_id fullName email phone place');
    await order.populate('listingId', 'title category location price unit');
    
    res.status(201).json({ message: 'Order created successfully. Contact farmer to confirm details.', order });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const authenticatedUserId = req.user && (req.user._id || req.user.id);
    const targetUserId = userId || authenticatedUserId;
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID required' });
    }
    
    const orders = await Order.find({ $or: [{ buyerId: targetUserId }, { farmerId: targetUserId }] })
      .populate('listingId', 'title price unit images category location')
      .populate('buyerId', '_id fullName email phone place')
      .populate('farmerId', '_id fullName email phone place')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && (req.user._id || req.user.id);
    
    if (!id) {
      return res.status(400).json({ message: 'Order ID required' });
    }
    
    const order = await Order.findById(id)
      .populate('buyerId', '_id email fullName')
      .populate('farmerId', '_id email fullName');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only buyer can cancel the order
    if (order.buyerId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the buyer can cancel this order' });
    }
    
    // Can only cancel pending or confirmed orders
    if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    // Send notification emails
    try {
      const subject = `Order ${order._id.substring(0, 8)} has been cancelled`;
      const html = `<p>The order for <strong>${order.listingId?.title || 'item'}</strong> (ID: ${order._id.substring(0, 8)}) has been cancelled.</p>`;
      
      if (order.buyerId?.email) {
        sendMail({ to: order.buyerId.email, subject, html }).catch(e => console.error('Email error:', e));
      }
      if (order.farmerId?.email) {
        sendMail({ to: order.farmerId.email, subject, html }).catch(e => console.error('Email error:', e));
      }
    } catch (e) {    }
    
    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Delete order (buyer/farmer) - Only for cancelled/delivered/rejected
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user && (req.user._id || req.user.id));

    if (!id) return res.status(400).json({ message: 'Order ID required' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Authorization: Only buyer or farmer involved in the order
    if (order.buyerId.toString() !== userId && order.farmerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow delete if final status
    if (!['cancelled', 'delivered', 'rejected'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot delete active order' });
    }

    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order deleted from history' });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Generate PDF Receipt
exports.getOrderReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user && (req.user._id || req.user.id));

    const order = await Order.findById(id)
      .populate('listingId', 'title price unit category location')
      .populate('buyerId', 'fullName email phone place')
      .populate('farmerId', 'fullName email phone place');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization: Only buyer or farmer involved in the order
    if (order.buyerId._id.toString() !== userId && order.farmerId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this receipt' });
    }

    if (!order.buyerId || !order.farmerId) {
      return res.status(500).json({ message: 'Order data is corrupted (missing buyer or farmer reference).' });
    }

    if (!PDFDocument) {
      return res.status(500).json({ message: 'Receipt generation unavailable (server missing pdfkit)' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${order._id}.pdf`);

    doc.pipe(res);

    // --- PDF CONTENT ---

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('CROPVECTOR', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Farm to Market Marketplace', { align: 'center' });
    doc.moveDown();

    // Order Info
    doc.fontSize(16).font('Helvetica-Bold').text('Purchase Receipt', { align: 'left' });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown();

    // Order Info Table
    const orderInfoTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').text('Order ID:');
    doc.font('Helvetica').text(order._id);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Order Date:');
    doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-IN'));

    const orderInfoRightX = 350;
    doc.fontSize(10).font('Helvetica-Bold').text('Order Status:', orderInfoRightX, orderInfoTop);
    doc.font('Helvetica').text(order.status.toUpperCase(), orderInfoRightX);
    doc.moveDown(2);

    // Seller and Buyer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Billed To (Buyer)', { continued: true, width: 250 });
    doc.text('Sold By (Farmer)', { align: 'right' });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);

    const contactTop = doc.y;
    doc.fontSize(10).font('Helvetica').text(order.buyerId?.fullName || 'N/A');
    doc.text(order.buyerId?.email || 'N/A');
    doc.text(order.buyerId?.place || 'N/A');

    doc.fontSize(10).font('Helvetica').text(order.farmerId?.fullName || 'N/A', { align: 'right' });
    doc.text(order.farmerId?.email || 'N/A', { align: 'right' });
    doc.text(order.farmerId?.place || 'N/A', { align: 'right' });
    doc.moveDown(2);

    // Items Table
    doc.fontSize(12).font('Helvetica-Bold').text('Order Summary');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc').moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 350;
    const priceX = 420;
    const totalX = 500;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item', itemX, tableTop);
    doc.text('Quantity', qtyX, tableTop, { width: 50, align: 'right' });
    doc.text('Unit Price', priceX, tableTop, { width: 60, align: 'right' });
    doc.text('Total', totalX, tableTop, { width: 50, align: 'right' });
    doc.moveDown();

    const item = order.listingId?.title || 'Unknown Crop';
    const qty = `${order.quantity} ${order.listingId?.unit || 'units'}`;
    const price = `Rs. ${order.unitPrice.toFixed(2)}`;
    const total = `Rs. ${order.totalPrice.toFixed(2)}`;

    doc.font('Helvetica');
    doc.text(item, itemX, doc.y);
    doc.text(qty, qtyX, doc.y, { width: 50, align: 'right' });
    doc.text(price, priceX, doc.y, { width: 60, align: 'right' });
    doc.text(total, totalX, doc.y, { width: 50, align: 'right' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#eee').moveDown();

    // Grand Total
    doc.fontSize(14).font('Helvetica-Bold').text('Grand Total:', 350, doc.y, { align: 'right', width: 130 });
    doc.text(`Rs. ${order.totalPrice.toFixed(2)}`, { align: 'right' });
    doc.moveDown(3);

    // Footer
    doc.fontSize(8).font('Helvetica-Oblique').text('Thank you for your purchase!', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

    doc.end();
  } catch (err) {    res.status(500).json({ error: 'Failed to generate receipt' });
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
    
    const order = await Order.findById(id).populate('buyerId', '_id email fullName').populate('farmerId', '_id email fullName');
    
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
    const { subjectId, listingId, rating, comment, orderId } = req.body;
    const reviewerId = (req.user && req.user.id) || req.body.reviewerId || req.headers['x-user-id'];
    
    if (!reviewerId) {
      return res.status(400).json({ message: 'User must be logged in to review' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Verify user is the buyer if orderId is provided
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order || order.buyerId.toString() !== reviewerId) {
        return res.status(403).json({ message: 'You can only review orders you made' });
      }
    }
    
    const review = new Review({ reviewerId, subjectId, listingId, rating, comment });
    await review.save();
    const populatedReview = await review.populate('reviewerId', 'fullName');
    res.status(201).json({ message: 'Review created', review: populatedReview });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Get reviews (filtered by reviewer, subject, or listing)
exports.getReviews = async (req, res) => {
  try {
    const { reviewerId, subjectId, listingId } = req.query;
    const filter = {};
    if (reviewerId) filter.reviewerId = reviewerId;
    if (subjectId) filter.subjectId = subjectId;
    if (listingId) filter.listingId = listingId;

    const reviews = await Review.find(filter)
      .populate('reviewerId', 'fullName')
      .populate('subjectId', 'fullName')
      .sort({ createdAt: -1 });
    res.json({ reviews });
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
      const order = await Order.findById(shipment.orderId).populate('buyerId', '_id email fullName').populate('farmerId', '_id email fullName');
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
      const order = await Order.findById(shipment.orderId).populate('buyerId', '_id email fullName').populate('farmerId', '_id email fullName');
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
