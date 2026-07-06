const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: [true, "Project name is required"], trim: true },
        developerName: { type: String, trim: true },
        location: { type: String, trim: true },
        description: { type: String, trim: true },
        totalUnits: { type: Number, default: 0, min: 0 },
        availableUnits: { type: Number, default: 0, min: 0 },
        basePrice: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ["active", "sold_out", "closed"], default: "active" },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

projectSchema.index({ agencyId: 1, status: 1 });
projectSchema.index({ name: "text", location: "text" });

module.exports = mongoose.model("Project", projectSchema);