const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Booking = require("../models/Booking");
const Project = require("../models/Project");
const Client = require("../models/Client");
const Lead = require("../models/Lead");
const notify = require("../utils/notify");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

// Construction-linked-plan style milestones — percentages of the REMAINING amount
// (total minus advance), not equal shares. Mirrors how real developer payment
// schedules are structured: bigger chunks tied to construction start/slab work,
// smaller ones toward the end. Kept in sync with the frontend's `previewInstallments`
// in `api/bookings.js` — if you change these percentages, update that copy too.
const MILESTONE_PLANS = {
  "2 Installments": [
    { milestone: "On Construction Start", percent: 50 },
    { milestone: "On Possession", percent: 50 },
  ],
  "4 Installments": [
    { milestone: "On Construction Start", percent: 30 },
    { milestone: "On Slab Completion", percent: 30 },
    { milestone: "On Finishing Work", percent: 20 },
    { milestone: "On Possession", percent: 20 },
  ],
  "6 Installments": [
    { milestone: "On Construction Start", percent: 20 },
    { milestone: "On Plinth Completion", percent: 15 },
    { milestone: "On Slab Completion (Mid Floor)", percent: 20 },
    { milestone: "On Slab Completion (Top Floor)", percent: 15 },
    { milestone: "On Finishing & Fit-out", percent: 15 },
    { milestone: "On Possession", percent: 15 },
  ],
};

// Splits (totalAmount - advanceAmount) across the plan's milestones by their fixed
// percentages — NOT equal shares. The last milestone absorbs the rounding remainder
// so the installments always sum exactly to the remaining amount.
const buildInstallments = (totalAmount, advanceAmount, planType) => {
  const stages = MILESTONE_PLANS[planType];
  if (!stages) return []; // "Full Payment" or "Custom" — no installments

  const remaining = totalAmount - advanceAmount;
  const installments = [];
  let allocated = 0;
  stages.forEach((stage, i) => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    const amount = i === stages.length - 1 ? remaining - allocated : Math.round((remaining * stage.percent) / 100);
    allocated += amount;
    installments.push({ milestone: stage.milestone, percent: stage.percent, amount, dueDate });
  });
  return installments;
};

// Agency only — reserves a SPECIFIC unit (using its own price, not a flat project price).
// Pass either `client` (existing client) OR `lead` (auto-converts that lead to a client first).
const createBooking = asyncHandler(async (req, res) => {
  const { project, unitId, client, lead, advanceAmount = 0, planType = "Full Payment" } = req.body;
  if (!project || !unitId || (!client && !lead)) {
    throw new ApiError(400, "project, unitId, and either client or lead are required");
  }

  const projectDoc = await Project.findOne({ _id: project, agencyId: req.user._id, isDeleted: false });
  if (!projectDoc) throw new ApiError(404, "Project not found");

  const unit = projectDoc.units.id(unitId);
  if (!unit) throw new ApiError(404, "Unit not found");
  if (unit.status !== "Available") throw new ApiError(400, "This unit is no longer available");

  let clientDoc;
  let leadDoc = null;
  if (lead) {
    leadDoc = await Lead.findOne({ _id: lead, agencyId: req.user._id, isDeleted: false });
    if (!leadDoc) throw new ApiError(404, "Lead not found");
    if (leadDoc.convertedClient) {
      clientDoc = await Client.findById(leadDoc.convertedClient);
    } else {
      clientDoc = await Client.create({
        agencyId: req.user._id, lead: leadDoc._id,
        name: leadDoc.customer.name, email: leadDoc.customer.email, phone: leadDoc.customer.phone,
      });
      leadDoc.convertedClient = clientDoc._id;
      leadDoc.status = "Converted";
      leadDoc.timeline.push({ action: "Client profile created (via booking)", createdBy: req.user._id });
    }
  } else {
    clientDoc = await Client.findOne({ _id: client, agencyId: req.user._id, isDeleted: false });
    if (!clientDoc) throw new ApiError(404, "Client not found");
  }

  const totalAmount = unit.price; // the unit's own price is the source of truth

  // Minimum booking (advance) amount is set per-project, as a % of the unit price —
  // not a flat number the agent has to remember or guess.
  const minBookingPercent = projectDoc.minBookingPercent ?? 10;
  const minBookingAmount = Math.round((totalAmount * minBookingPercent) / 100);
  if (Number(advanceAmount) < minBookingAmount) {
    throw new ApiError(
      400,
      `Advance amount must be at least ₹${minBookingAmount.toLocaleString("en-IN")} (${minBookingPercent}% of the unit price)`
    );
  }

  const booking = await Booking.create({
    agencyId: req.user._id,
    project,
    unitId,
    client: clientDoc._id,
    lead: leadDoc?._id || null,
    unitNumber: unit.unitNumber,
    totalAmount,
    advanceAmount,
    planType,
    installments: buildInstallments(totalAmount, advanceAmount, planType),
    createdBy: req.user._id,
  });

  unit.status = "Reserved";
  projectDoc.availableUnits -= 1;
  await projectDoc.save();

  clientDoc.purchaseHistory.push(booking._id);
  await clientDoc.save();
  if (leadDoc) await leadDoc.save();

  await notify({
    agencyId: req.user._id, recipient: null, type: "BookingReminder",
    title: "Unit reserved", message: `${clientDoc.name} — Unit ${unit.unitNumber}, move to Agreement next`,
    booking: booking._id,
  });

  return success(res, 201, "Unit reserved and booking created", booking);
});

const listBookings = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { agencyId, isDeleted: false };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("project", "name location")
      .populate("client", "name phone")
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  return success(res, 200, "Bookings fetched", bookings, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit),
  });
});

const getBooking = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const booking = await Booking.findOne({ _id: req.params.id, agencyId, isDeleted: false })
    .populate("project", "name location")
    .populate("client", "name phone email");
  if (!booking) throw new ApiError(404, "Booking not found");
  return success(res, 200, "Booking fetched", booking);
});

// Moves booking forward through the workflow (Reserved -> ... -> Completed), or Cancelled
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, "status is required");

  const booking = await Booking.findOne({ _id: req.params.id, agencyId: req.user._id, isDeleted: false });
  if (!booking) throw new ApiError(404, "Booking not found");

  const projectDoc = await Project.findById(booking.project);
  const unit = projectDoc?.units.id(booking.unitId);

  if (status === "Cancelled" && booking.status !== "Cancelled") {
    if (unit) unit.status = "Available";
    if (projectDoc) { projectDoc.availableUnits += 1; await projectDoc.save(); }
  }
  if (status === "Completed" && unit) {
    unit.status = "Sold";
    await projectDoc.save();
  }

  booking.status = status;
  await booking.save();
  return success(res, 200, "Booking status updated", booking);
});

// Mark one installment as paid (full or partial)
const recordInstallmentPayment = asyncHandler(async (req, res) => {
  const { installmentId, paidAmount } = req.body;
  if (!installmentId || !paidAmount) throw new ApiError(400, "installmentId and paidAmount are required");

  const agencyId = scopedAgencyId(req.user);
  const booking = await Booking.findOne({ _id: req.params.id, agencyId, isDeleted: false });
  if (!booking) throw new ApiError(404, "Booking not found");

  const installment = booking.installments.id(installmentId);
  if (!installment) throw new ApiError(404, "Installment not found");

  installment.paidAmount += paidAmount;
  if (installment.paidAmount >= installment.amount) {
    installment.status = "Paid";
    installment.paidAt = new Date();
  }

  const allPaid = booking.installments.every((i) => i.status === "Paid");
  if (allPaid && booking.installments.length > 0) {
    booking.status = "Completed";
    const projectDoc = await Project.findById(booking.project);
    const unit = projectDoc?.units.id(booking.unitId);
    if (unit) { unit.status = "Sold"; await projectDoc.save(); }
  }

  await booking.save();
  return success(res, 200, "Installment payment recorded", booking);
});

module.exports = { createBooking, listBookings, getBooking, updateBookingStatus, recordInstallmentPayment };