const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Lead = require("../models/Lead");
const LeadRequest = require("../models/LeadRequest");
const notify = require("../utils/notify");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

// Throws a friendly 409 instead of letting a raw Mongo duplicate-key error surface —
// same rule everywhere: one active lead per phone number per project, but the same
// phone can have a separate lead in a different project.
const assertNoDuplicateLead = async (agencyId, project, phone) => {
  const existing = await Lead.findOne({ agencyId, project, "customer.phone": phone, isDeleted: false });
  if (existing) {
    throw new ApiError(409, "A lead for this phone number already exists in this project.");
  }
};

// Agent only — submit a request instead of creating a lead directly. Goes to the
// agency for approval; nothing is added to the Leads list until then.
const createLeadRequest = asyncHandler(async (req, res) => {
  const { project, customer, source, priority } = req.body;
  if (!project || !customer?.name || !customer?.phone) {
    throw new ApiError(400, "Project, customer name and phone are required");
  }

  const agencyId = req.user.agencyId;
  const phone = customer.phone.trim();

  await assertNoDuplicateLead(agencyId, project, phone);

  const duplicateRequest = await LeadRequest.findOne({
    agencyId, project, "customer.phone": phone, status: "Pending",
  });
  if (duplicateRequest) {
    throw new ApiError(409, "There's already a pending request for this phone number in this project.");
  }

  const leadRequest = await LeadRequest.create({
    agencyId,
    requestedBy: req.user._id,
    project,
    customer: { name: customer.name, phone, email: customer.email || undefined },
    source: source || "Other",
    priority: priority || "Warm",
  });

  // Visible to the agency owner only — not broadcast to every agent.
  await notify({
    agencyId, recipient: agencyId, type: "LeadRequestNotification",
    title: "New lead request", message: `${req.user.name} requested a lead: ${customer.name}`,
  });

  return success(res, 201, "Lead request submitted", leadRequest);
});

// Agent only — the requesting agent's own request history.
const listMyRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { agencyId: req.user.agencyId, requestedBy: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    LeadRequest.find(filter)
      .populate("project", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit)),
    LeadRequest.countDocuments(filter),
  ]);

  return success(res, 200, "Your lead requests", requests, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) || 1,
  });
});

// Agency only — every request submitted by any of its agents.
const listRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { agencyId: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    LeadRequest.find(filter)
      .populate("project", "name")
      .populate("requestedBy", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit)),
    LeadRequest.countDocuments(filter),
  ]);

  return success(res, 200, "Lead requests", requests, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) || 1,
  });
});

// Agency only — approve: creates the real Lead, assigned back to the requesting agent.
const acceptRequest = asyncHandler(async (req, res) => {
  const leadRequest = await LeadRequest.findOne({
    _id: req.params.id, agencyId: req.user._id, status: "Pending",
  });
  if (!leadRequest) throw new ApiError(404, "Request not found or already reviewed");

  // Re-check at accept-time too — time may have passed since the request was submitted.
  await assertNoDuplicateLead(leadRequest.agencyId, leadRequest.project, leadRequest.customer.phone);

  const lead = await Lead.create({
    agencyId: leadRequest.agencyId,
    project: leadRequest.project,
    customer: leadRequest.customer,
    source: leadRequest.source,
    priority: leadRequest.priority,
    assignedAgent: leadRequest.requestedBy,
    status: "Assigned",
    timeline: [
      { action: "Lead requested by agent", createdBy: leadRequest.requestedBy },
      { action: "Request approved — lead created and assigned", createdBy: req.user._id },
    ],
  });

  leadRequest.status = "Accepted";
  leadRequest.reviewedBy = req.user._id;
  leadRequest.reviewedAt = new Date();
  leadRequest.resultingLead = lead._id;
  await leadRequest.save();

  await notify({
    agencyId: leadRequest.agencyId, recipient: leadRequest.requestedBy, type: "LeadRequestDecision",
    title: "Lead request approved", message: `${leadRequest.customer.name} is now assigned to you`, lead: lead._id,
  });

  return success(res, 200, "Request approved and lead created", lead);
});

// Agency only — decline: no lead is created, the agent is notified with the reason (if given).
const rejectRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const leadRequest = await LeadRequest.findOne({
    _id: req.params.id, agencyId: req.user._id, status: "Pending",
  });
  if (!leadRequest) throw new ApiError(404, "Request not found or already reviewed");

  leadRequest.status = "Rejected";
  leadRequest.reviewedBy = req.user._id;
  leadRequest.reviewedAt = new Date();
  leadRequest.rejectionReason = reason || null;
  await leadRequest.save();

  await notify({
    agencyId: leadRequest.agencyId, recipient: leadRequest.requestedBy, type: "LeadRequestDecision",
    title: "Lead request rejected", message: reason ? `${leadRequest.customer.name}: ${reason}` : leadRequest.customer.name,
  });

  return success(res, 200, "Request rejected", leadRequest);
});

// Agent only — withdraw a request they submitted, as long as it's still Pending.
const cancelRequest = asyncHandler(async (req, res) => {
  const leadRequest = await LeadRequest.findOneAndDelete({
    _id: req.params.id, requestedBy: req.user._id, status: "Pending",
  });
  if (!leadRequest) throw new ApiError(404, "Request not found or already reviewed");

  return success(res, 200, "Request withdrawn", { _id: leadRequest._id });
});

module.exports = {
  createLeadRequest, listMyRequests, listRequests, acceptRequest, rejectRequest, cancelRequest,
};