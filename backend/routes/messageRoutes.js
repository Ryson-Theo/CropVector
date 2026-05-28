// backend/routes/messageRoutes.js
const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  editMessage,
  cleanupOrphans
} = require("../controllers/messageController");

const router = express.Router();
router.use(authMiddleware);

router.get("/conversations/:farmerId", getConversations);
router.get("/:farmerId/:otherFarmerId", getMessages);
router.post("/send", sendMessage);
router.put("/:messageId/read", markAsRead);
router.get("/unread/:farmerId", getUnreadCount);
router.put("/edit/:messageId", editMessage);
router.post("/cleanup/orphans", cleanupOrphans);

module.exports = router;
