const express = require("express");
const { protect } = require("../middleware/auth");
const { listNotifications, unreadCount, markRead, markAllRead } = require("../controllers/notificationController");

const router = express.Router();
router.use(protect);
router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);

module.exports = router;