const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Pending", "Paid", "Overdue"], default: "Pending" },
    paidAt: { type: Date, default: null },
    paidAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    unitNumber: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, default: 0, min: 0 },
    planType: {
      type: String,
      enum: ["Full Payment", "2 Installments", "4 Installments", "6 Installments", "Custom"],
      default: "Full Payment",
    },
    installments: [installmentSchema],
    status: {
      type: String,
      enum: ["Reserved", "Booked", "Agreement Signed", "Payment Plan Set", "Installments Ongoing", "Completed", "Cancelled"],
      default: "Reserved",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ agencyId: 1, status: 1 });
bookingSchema.index({ client: 1 });
bookingSchema.index({ project: 1 });

module.exports = mongoose.model("Booking", bookingSchema);