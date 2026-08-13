const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Available", "Reserved", "Sold"], default: "Available" },
});

const planStageSchema = new mongoose.Schema(
  { milestone: { type: String, required: true, trim: true }, percent: { type: Number, required: true, min: 0, max: 100 } },
  { _id: false }
);

const paymentPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // % of the post-advance remaining amount (total - advance) — NOT of the total unit
  // price, and independent of minBookingPercent. Must sum to exactly 100 across all
  // stages — validated in projectController before save.
  stages: { type: [planStageSchema], validate: (v) => v.length > 0 && v.length <= 10 },
  isDefault: { type: Boolean, default: false },
});

const projectSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Project name is required"], trim: true },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: "Developer", required: true },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
    // totalUnits/availableUnits are kept in sync automatically whenever `units` changes —
    // stored (not computed) so list views don't need to load the full units array.
    totalUnits: { type: Number, default: 0, min: 0 },
    availableUnits: { type: Number, default: 0, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    basePrice: { type: Number, default: 0, min: 0 }, // default/suggested selling price for new units
    // Minimum advance (booking amount) as a % of the unit's price — e.g. 10 means a
    // buyer must pay at least 10% of the unit price to reserve it. Drives both the
    // auto-filled minimum in the booking form and the backend validation on create.
    minBookingPercent: { type: Number, default: 10, min: 0, max: 100 },
    // Project-specific named payment plans (e.g. "Construction Linked Plan", "Down
    // Payment Plan") — buyer/agent picks one at booking time. Falls back to the
    // global DEFAULT_PAYMENT_PLANS template (bookingController.js) when empty, so
    // older projects created before this feature keep working unchanged.
    paymentPlans: { type: [paymentPlanSchema], default: [] },
    units: [unitSchema], // each unit can carry its own price, overriding basePrice
    status: { type: String, enum: ["active", "sold_out", "closed"], default: "active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ agencyId: 1, status: 1 });
projectSchema.index({ name: "text", location: "text" });

module.exports = mongoose.model("Project", projectSchema);