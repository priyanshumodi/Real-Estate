const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const Notification = require("../models/Notification");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

// Visible to a user: notifications addressed to them directly, or agency-wide (recipient: null)
const visibilityFilter = (user) => ({
  agencyId: scopedAgencyId(user),
  $or: [{ recipient: user._id }, { recipient: null }],
});

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find(visibilityFilter(req.user))
    .sort({ createdAt: -1 })
    .limit(50);
  return success(res, 200, "Notifications fetched", notifications);
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ ...visibilityFilter(req.user), isRead: false });
  return success(res, 200, "Unread count fetched", { count });
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, ...visibilityFilter(req.user) },
    { isRead: true }
  );
  return success(res, 200, "Marked as read", null);
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...visibilityFilter(req.user), isRead: false }, { isRead: true });
  return success(res, 200, "All marked as read", null);
});

module.exports = { listNotifications, unreadCount, markRead, markAllRead };