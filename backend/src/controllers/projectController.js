const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Project = require("../models/Project");
const { DEFAULT_PAYMENT_PLANS, validatePaymentPlans } = require("../utils/paymentPlans");

// Agency only. Agents never create/edit projects.
const createProject = asyncHandler(async (req, res) => {
  const { name, developer, location, description, totalUnits, basePrice, purchasePrice, minBookingPercent, paymentPlans } = req.body;
  if (!name) throw new ApiError(400, "Project name is required");
  if (!developer) throw new ApiError(400, "Developer is required — pick an existing one or add a new one");

  const count = Number(totalUnits) || 0;
  const price = Number(basePrice) || 0;
  const units = Array.from({ length: count }, (_, i) => ({
    unitNumber: `U-${String(i + 1).padStart(3, "0")}`,
    price,
    status: "Available",
  }));

  // Seed with editable starting-point templates unless the agency already sent their
  // own plans — new projects shouldn't start with an empty payment-plan builder.
  const plans = paymentPlans?.length ? validatePaymentPlans(paymentPlans) : DEFAULT_PAYMENT_PLANS;

  const project = await Project.create({
    agencyId: req.user._id,
    name,
    developer,
    location,
    description,
    totalUnits: count,
    availableUnits: count,
    basePrice: price,
    purchasePrice: purchasePrice || 0,
    minBookingPercent: minBookingPercent !== undefined && minBookingPercent !== "" ? Number(minBookingPercent) : 10,
    paymentPlans: plans,
    units,
  });

  return success(res, 201, "Project created", project);
});

// Agency only — override the price of one specific unit (e.g. a corner plot priced higher)
const updateUnitPrice = asyncHandler(async (req, res) => {
  const { price } = req.body;
  if (price === undefined) throw new ApiError(400, "price is required");

  const project = await Project.findOne({ _id: req.params.id, agencyId: req.user._id, isDeleted: false });
  if (!project) throw new ApiError(404, "Project not found");

  const unit = project.units.id(req.params.unitId);
  if (!unit) throw new ApiError(404, "Unit not found");

  unit.price = price;
  await project.save();
  return success(res, 200, "Unit price updated", project);
});

// Both roles can view projects belonging to their agency (agent's agencyId = their agency's own id)
const listProjects = asyncHandler(async (req, res) => {
  const agencyId = req.user.role === "agency" ? req.user._id : req.user.agencyId;
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = { agencyId, isDeleted: false };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter).populate("developer", "name phone email").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  return success(res, 200, "Projects fetched", projects, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit),
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false }).populate("developer");
  if (!project) throw new ApiError(404, "Project not found");
  return success(res, 200, "Project fetched", project);
});

const updateProject = asyncHandler(async (req, res) => {
  if (req.body.paymentPlans) validatePaymentPlans(req.body.paymentPlans);

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user._id, isDeleted: false },
    req.body,
    { new: true, runValidators: true }
  );
  if (!project) throw new ApiError(404, "Project not found");
  return success(res, 200, "Project updated", project);
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user._id },
    { isDeleted: true },
    { new: true }
  );
  if (!project) throw new ApiError(404, "Project not found");
  return success(res, 200, "Project deleted", null);
});

// Agency only — add a batch of units at one price in one go. Used both to fix legacy
// projects (created before per-unit pricing existed, so units[] is empty) and to add
// price tiers later (e.g. 5 units at 80L, 5 at 95L, 3 at 1.1Cr, called three times).
const bulkAddUnits = asyncHandler(async (req, res) => {
  const { count, price, prefix } = req.body;
  const n = Number(count);
  if (!n || n <= 0 || price === undefined) throw new ApiError(400, "count and price are required");

  const project = await Project.findOne({ _id: req.params.id, agencyId: req.user._id, isDeleted: false });
  if (!project) throw new ApiError(404, "Project not found");

  const existing = new Set(project.units.map((u) => u.unitNumber));
  let idx = project.units.length + 1;
  const newUnits = [];
  for (let i = 0; i < n; i++) {
    let unitNumber;
    do { unitNumber = `${prefix || "U"}-${String(idx).padStart(3, "0")}`; idx++; } while (existing.has(unitNumber));
    existing.add(unitNumber);
    newUnits.push({ unitNumber, price: Number(price), status: "Available" });
  }

  project.units.push(...newUnits);
  project.totalUnits += n;
  project.availableUnits += n;
  await project.save();

  return success(res, 201, "Units added", project);
});

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject, updateUnitPrice, bulkAddUnits };