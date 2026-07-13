const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
    "AssignmentNotification", "FollowUpReminder", "VisitReminder",
    "InstallmentReminder", "BookingReminder",
];

const notificationSchema = new mongoose.Schema(
    {
        agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        // Specific agent, or null = visible to the whole agency (agency owner + all its agents)
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        type: { type: String, enum: NOTIFICATION_TYPES, required: true },
        title: { type: String, required: true },
        message: { type: String, trim: true },
        relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
        relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ agencyId: 1, recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;