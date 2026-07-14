const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Developer name is required"], trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Same developer name can't be added twice under one agency (case-insensitive)
developerSchema.index({ agencyId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

module.exports = mongoose.model("Developer", developerSchema);