const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Booking = require("../models/Booking");
const Project = require("../models/Project");
const Client = require("../models/Client");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

// Splits totalAmount (minus advance) into N equal installments, one per month
const buildInstallments = (totalAmount, advanceAmount, planType) => {
  const countMap = { "Full Payment": 0, "2 Installments": 2, "4 Installments": 4, "6 Installments": 6 };
  const count = countMap[planType] ?? 0;
  if (count === 0) return [];

  const remaining = totalAmount - advanceAmount;
  const perInstallment = Math.floor(remaining / count);
  const installments = [];
  for (let i = 0; i < count; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    const amount = i === count - 1 ? remaining - perInstallment * (count - 1) : perInstallment;
    installments.push({ amount, dueDate });
  }
  return installments;
};

// Agency only — reserves a unit, decrements project inventory, links client's purchase history
const createBooking = asyncHandler(async (req, res) => {
  const { project, client, unitNumber, totalAmount, advanceAmount = 0, planType = "Full Payment" } = req.body;
  if (!project || !client || !unitNumber || !totalAmount) {
    throw new ApiError(400, "project, client, unitNumber and totalAmount are required");
  }

  const projectDoc = await Project.findOne({ _id: project, agencyId: req.user._id, isDeleted: false });
  if (!projectDoc) throw new ApiError(404, "Project not found");
  if (projectDoc.availableUnits <= 0) throw new ApiError(400, "No available units left in this project");

  const clientDoc = await Client.findOne({ _id: client, agencyId: req.user._id, isDeleted: false });
  if (!clientDoc) throw new ApiError(404, "Client not found");

  const booking = await Booking.create({
    agencyId: req.user._id,
    project,
    client,
    unitNumber,
    totalAmount,
    advanceAmount,
    planType,
    installments: buildInstallments(totalAmount, advanceAmount, planType),
    createdBy: req.user._id,
  });

  projectDoc.availableUnits -= 1;
  await projectDoc.save();

  clientDoc.purchaseHistory.push(booking._id);
  await clientDoc.save();

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

  // Cancelling releases the unit back into inventory
  if (status === "Cancelled" && booking.status !== "Cancelled") {
    await Project.findByIdAndUpdate(booking.project, { $inc: { availableUnits: 1 } });
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
  if (allPaid && booking.installments.length > 0) booking.status = "Completed";

  await booking.save();
  return success(res, 200, "Installment payment recorded", booking);
});

module.exports = { createBooking, listBookings, getBooking, updateBookingStatus, recordInstallmentPayment };