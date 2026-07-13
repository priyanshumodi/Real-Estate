const Notification = require("../models/Notification");

// recipient = null means "visible to the whole agency" (agency owner + all its agents)
const notify = async ({ agencyId, recipient = null, type, title, message, lead = null, booking = null }) => {
  try {
    await Notification.create({
      agencyId, recipient, type, title, message,
      relatedLead: lead, relatedBooking: booking,
    });
  } catch (err) {
    // Notifications are best-effort — never let a notification failure break the main action
    console.error("Failed to create notification:", err.message);
  }
};

module.exports = notify;