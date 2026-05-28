#!/usr/bin/env node
/**
 * Script to clean up orphaned conversations from the database
 * Run with: node scripts/cleanupOrphanChats.js
 */

const mongoose = require('mongoose');
const Message = require('../models/Message');
const Order = require('../models/Order');
const MachineryBooking = require('../models/MachineryBooking');

const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/cropvector';

async function cleanupOrphanChats() {
  try {    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });    // Find all messages without orderId or bookingId
    const orphanMessages = await Message.find({
      orderId: { $exists: false },
      bookingId: { $exists: false }
    }).sort({ createdAt: 1 });    let deletedCount = 0;
    const deletedIds = [];

    // For each potentially orphaned message, check if it's truly orphaned
    for (const msg of orphanMessages) {
      // Check for other messages in this conversation thread
      const otherMessages = await Message.countDocuments({
        $or: [
          { senderId: msg.senderId, receiverId: msg.receiverId },
          { senderId: msg.receiverId, receiverId: msg.senderId }
        ],
        _id: { $ne: msg._id }
      });

      // Check if there's an order between these users
      const order = await Order.findOne({
        $or: [
          { buyerId: msg.senderId, farmerId: msg.receiverId },
          { buyerId: msg.receiverId, farmerId: msg.senderId }
        ]
      });

      // Check if there's a booking between these users
      const booking = await MachineryBooking.findOne({
        $or: [
          { ownerFarmerId: msg.senderId, renterFarmerId: msg.receiverId },
          { ownerFarmerId: msg.receiverId, renterFarmerId: msg.senderId }
        ]
      });

      // If no other messages AND no order/booking relationship, it's orphaned
      if (otherMessages === 0 && !order && !booking) {        await Message.deleteOne({ _id: msg._id });
        deletedIds.push(msg._id);
        deletedCount++;
      } else {        if (order) console.log(`     └─ Has related order`);
        if (booking) console.log(`     └─ Has related booking`);
        if (otherMessages > 0) console.log(`     └─ Part of conversation (${otherMessages} other messages)`);
      }
    }    if (deletedIds.length > 0) {      deletedIds.forEach(id => console.log(`  - ${id}`));
    }

    process.exit(0);
  } catch (err) {    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

cleanupOrphanChats();

