const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Available", "Reserved", "Sold"], default: "Available" },
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
    units: [unitSchema], // each unit can carry its own price, overriding basePrice
    status: { type: String, enum: ["active", "sold_out", "closed"], default: "active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ agencyId: 1, status: 1 });
projectSchema.index({ name: "text", location: "text" });

module.exports = mongoose.model("Project", projectSchema);