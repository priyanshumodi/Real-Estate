const mongoose = require("mongoose");

const LEAD_REQUEST_STATUSES = ["Pending", "Accepted", "Rejected"];

// An agent can't create a Lead directly — they submit a LeadRequest instead.
// The agency reviews it and either Accepts (which creates the real Lead, assigned
// back to the requesting agent) or Rejects it. Nothing here ever becomes visible
// in the main Leads list until it's Accepted.
const leadRequestSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // the agent

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
    priority: { type: String, enum: ["Hot", "Warm", "Cold"], default: "Warm" },

    status: { type: String, enum: LEAD_REQUEST_STATUSES, default: "Pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: null },

    // Set once Accepted — points at the Lead that got created from this request.
    resultingLead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
  },
  { timestamps: true }
);

leadRequestSchema.index({ agencyId: 1, status: 1 });
leadRequestSchema.index({ requestedBy: 1, status: 1 });

module.exports = mongoose.model("LeadRequest", leadRequestSchema);
module.exports.LEAD_REQUEST_STATUSES = LEAD_REQUEST_STATUSES;