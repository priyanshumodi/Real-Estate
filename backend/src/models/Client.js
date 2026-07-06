const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const clientSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    documents: [documentSchema],
    // Populated once Booking Workflow ships
    purchaseHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

clientSchema.index({ agencyId: 1 });
clientSchema.index({ phone: 1 });

module.exports = mongoose.model("Client", clientSchema);