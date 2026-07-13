const mongoose = require("mongoose");

const LEAD_STATUSES = [
  "New", "Assigned", "Contacted", "Follow-up", "Visit Scheduled", "Visit Started",
  "Visit Completed", "Interested", "Negotiation", "Booking", "Converted", "Lost", "Archived",
];

const communicationSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["Phone", "WhatsApp", "SMS", "Email", "Office Meeting", "Site Visit"], required: true },
    remarks: { type: String, required: true, trim: true },
    response: { type: String, enum: ["Positive", "Neutral", "Negative"], default: "Neutral" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const followUpSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    remarks: { type: String, trim: true },
    isCompleted: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Auto-generated activity log — every status change / assignment appends here.
// Never edited or overwritten directly; append-only history.
const timelineEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "Status changed to Contacted"
    remarks: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const VISIT_STEPS = [
  "Visit Assigned", "Agent Accepted", "Journey Started", "Client Picked", "Travelling",
  "Reached Project", "Property Tour Started", "Property Tour Completed", "Discussion",
  "Feedback Submitted", "Next Follow-up Scheduled",
];

const visitStepSchema = new mongoose.Schema(
  {
    step: { type: String, enum: VISIT_STEPS, required: true },
    remarks: { type: String, trim: true },
    gpsLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    imageUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

    customer: {
      name: { type: String, required: [true, "Customer name is required"], trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, required: [true, "Customer phone is required"], trim: true },
    },

    source: {
      type: String,
      enum: ["Website", "Referral", "Walk-In", "Facebook", "Google", "Property Portal", "Other"],
      default: "Other",
    },

    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    priority: { type: String, enum: ["Hot", "Warm", "Cold"], default: "Warm" },
    status: { type: String, enum: LEAD_STATUSES, default: "New" },

    communicationLogs: [communicationSchema],
    followUps: [followUpSchema],
    timeline: [timelineEntrySchema],
    visitTimeline: [visitStepSchema],
    convertedClient: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leadSchema.index({ agencyId: 1, status: 1 });
leadSchema.index({ agencyId: 1, assignedAgent: 1 });
leadSchema.index({ project: 1 });
leadSchema.index({ "customer.phone": 1 });
leadSchema.index({ "customer.name": "text" });

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_STATUSES = LEAD_STATUSES;
module.exports.VISIT_STEPS = VISIT_STEPS;