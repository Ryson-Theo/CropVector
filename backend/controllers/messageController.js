// backend/controllers/messageController.js

const Message = require("../models/Message");
const Farmer = require("../models/Farmer");
const Buyer = require("../models/Buyer");
const User = require("../models/User");
const MachineryBooking = require("../models/MachineryBooking");
const Order = require("../models/Order");

// get farmer id and convert to user id if needed
const resolveToUserId = async (id) => {
  const f = await Farmer.findById(id).select("userId");
  return f?.userId?.toString() || id;
};

// check if user is farmer, buyer, or regular user
const detectRoleFromUserId = async (userId) => {
  const f = await Farmer.findOne({ userId });
  if (f) return "farmer";

  const b = await Buyer.findOne({ userId });
  if (b) return "buyer";

  return "user";
};

const getAuthenticatedUserId = (req) => {
  return (
    req.user?.id?.toString() ||
    req.user?._id?.toString() ||
    req.user?.userId?.toString() ||
    null
  );
};

// get all the partner info - name, pic, online status
const buildPartnerResolver = () => {
  const partnerCache = {};

  return async (userId) => {
    if (partnerCache[userId]) return partnerCache[userId];

    const info = {
      partnerId: userId.toString(),
      partnerName: "User",
      partnerProfilePic: null,
      lastSeen: null,
      isOnline: false,
    };

    // get user info first
    const u = await User.findById(userId).select("fullName profilePic");
    if (u) {
      info.partnerName = u.fullName || "User";
      info.partnerProfilePic = u.profilePic || null;
    }

    // check if farmer and update
    const f = await Farmer.findOne({ userId }).select(
      "name profilePic lastSeen isOnline"
    );
    if (f) {
      if (f.name) info.partnerName = f.name;
      if (f.profilePic) info.partnerProfilePic = f.profilePic;
      info.lastSeen = f.lastSeen;
      info.isOnline = !!f.isOnline;
    }

    // check if buyer and update
    const b = await Buyer.findOne({ userId }).select(
      "name profilePic lastSeen isOnline"
    );
    if (b) {
      if (b.name) info.partnerName = b.name;
      if (b.profilePic) info.partnerProfilePic = b.profilePic;
      info.lastSeen = b.lastSeen;
      info.isOnline = !!b.isOnline;
    }

    partnerCache[userId] = info;
    return info;
  };
};

// get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const paramId = req.params.farmerId;
    const queryUserId = await resolveToUserId(paramId);
    if (authUserId !== queryUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let farmerDoc = await Farmer.findById(paramId).select("userId lastSeen");
    if (farmerDoc) {
      await Farmer.findByIdAndUpdate(paramId, { lastSeen: new Date() });
    }

    const isFarmer = !!farmerDoc;

    const messages = await Message.find({
      $or: [{ senderId: queryUserId }, { receiverId: queryUserId }],
    }).sort({ createdAt: -1 });

    const conversationMap = {};
    const onlineThreshold = new Date(Date.now() - 90 * 1000);

    const getPartner = buildPartnerResolver();

    for (const msg of messages) {
      const isSenderMe = msg.senderId.toString() === queryUserId;
      const partnerId = isSenderMe ? msg.receiverId : msg.senderId;
      const pid = partnerId.toString();

      if (!conversationMap[pid]) {
        const p = await getPartner(pid);

        conversationMap[pid] = {
          partnerId: pid,
          partnerName: p.partnerName,
          partnerProfilePic: p.partnerProfilePic,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          isOnline:
            p.lastSeen && new Date(p.lastSeen) > onlineThreshold
              ? true
              : false,
          orderId: msg.orderId?.toString() || null,
          bookingId: msg.bookingId?.toString() || null,
          conversationContext: msg.orderId
            ? "order"
            : msg.bookingId
            ? "booking"
            : "direct",
        };
      }

      if (msg.receiverId.toString() === queryUserId && msg.status !== "read") {
        conversationMap[pid].unreadCount++;
      }
    }

    /* -------- implicit booking convos -------- */
    if (isFarmer) {
      const bookings = await MachineryBooking.find({
        $or: [{ ownerFarmerId: paramId }, { renterFarmerId: paramId }],
      })
        .populate("machineryId", "machineName")
        .sort({ createdAt: -1 });

      for (const bk of bookings) {
        const other =
          bk.ownerFarmerId.toString() === paramId
            ? bk.renterFarmerId
            : bk.ownerFarmerId;

        const uid = (await resolveToUserId(other)).toString();

        if (!conversationMap[uid]) {
          const p = await getPartner(uid);

          conversationMap[uid] = {
            partnerId: uid,
            partnerName: p.partnerName,
            partnerProfilePic: p.partnerProfilePic,
            lastMessage: `Booking: ${
              bk.machineryId?.machineName || "Equipment"
            }`,
            lastMessageTime: bk.createdAt,
            unreadCount: 0,
            isOnline:
              p.lastSeen && new Date(p.lastSeen) > onlineThreshold
                ? true
                : false,
            bookingId: bk._id.toString(),
            conversationContext: "booking",
          };
        }
      }

      const orders = await Order.find({ farmerId: queryUserId })
        .populate("buyerId", "_id")
        .populate("listingId", "title")
        .sort({ createdAt: -1 });

      for (const ord of orders) {
        const buyerId = ord.buyerId?._id?.toString();
        if (!buyerId) continue;

        if (!conversationMap[buyerId]) {
          const p = await getPartner(buyerId);

          conversationMap[buyerId] = {
            partnerId: buyerId,
            partnerName: p.partnerName,
            partnerProfilePic: p.partnerProfilePic,
            lastMessage: `Order: ${ord.listingId?.title || "Product"}`,
            lastMessageTime: ord.createdAt,
            unreadCount: 0,
            isOnline:
              p.lastSeen && new Date(p.lastSeen) > onlineThreshold
                ? true
                : false,
            orderId: ord._id.toString(),
            conversationContext: "order",
          };
        }
      }
    }

    const finalConvos = Object.values(conversationMap).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json(finalConvos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get all messages between two users
exports.getMessages = async (req, res) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { farmerId, otherFarmerId } = req.params;
    farmerId = await resolveToUserId(farmerId);
    otherFarmerId = await resolveToUserId(otherFarmerId);

    if (authUserId !== farmerId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const msgs = await Message.find({
      $or: [
        { senderId: farmerId, receiverId: otherFarmerId },
        { senderId: otherFarmerId, receiverId: farmerId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        receiverId: farmerId,
        senderId: otherFarmerId,
        status: { $ne: "read" },
      },
      { status: "read", readAt: new Date() }
    );

    const sanitized = msgs.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      status: msg.status,
      readAt: msg.readAt,
      isEdited: msg.isEdited,
      orderId: msg.orderId ? msg.orderId.toString() : null,
      bookingId: msg.bookingId ? msg.bookingId.toString() : null,
    }));

    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// edit a message
exports.sendMessage = async (req, res) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { receiverId, content, bookingId, orderId } = req.body;

    const senderId = await resolveToUserId(authUserId);
    const receiverUserId = await resolveToUserId(receiverId);

    const senderRole = await detectRoleFromUserId(senderId);
    const receiverRole = await detectRoleFromUserId(receiverUserId);

    const senderFarmerDoc = await Farmer.findOne({ userId: senderId });
    if (senderFarmerDoc) {
      await Farmer.findByIdAndUpdate(senderFarmerDoc._id, {
        lastSeen: new Date(),
      });
    }

    const message = new Message({
      senderId,
      senderRole,
      receiverId: receiverUserId,
      receiverRole,
      content,
      ...(orderId && { orderId }),
      ...(bookingId && { bookingId }),
    });

    await message.save();

    res.json({
      _id: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      status: message.status,
      readAt: message.readAt,
      isEdited: message.isEdited,
      orderId: message.orderId ? message.orderId.toString() : null,
      bookingId: message.bookingId ? message.bookingId.toString() : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* mark message as read */
exports.markAsRead = async (req, res) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const msg = await Message.findById(req.params.messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (msg.receiverId.toString() !== authUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await Message.findByIdAndUpdate(
      req.params.messageId,
      { status: "read", readAt: new Date() },
      { returnDocument: 'after' }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const receiverId = await resolveToUserId(req.params.farmerId);
    if (authUserId !== receiverId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const cnt = await Message.countDocuments({
      receiverId,
      status: { $ne: "read" },
    });

    res.json({ unreadCount: cnt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.senderId.toString() !== authUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const tenMins = 10 * 60 * 1000;
    if (Date.now() - new Date(msg.createdAt).getTime() > tenMins) {
      return res.status(400).json({ message: "Edit window expired" });
    }

    msg.content = req.body.content;
    msg.isEdited = true;
    await msg.save();

    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cleanupOrphans = async (req, res) => {
  res.json({ message: "Cleanup safe mode enabled" });
};
