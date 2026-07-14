const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Lead = require("../models/Lead");
const Client = require("../models/Client");
const notify = require("../utils/notify");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

// Agency only — leads originate from the agency, then get assigned to an agent.
const createLead = asyncHandler(async (req, res) => {
  const { project, customer, source, assignedAgent, priority } = req.body;
  if (!project || !customer?.name || !customer?.phone) {
    throw new ApiError(400, "Project, customer name and phone are required");
  }

  const lead = await Lead.create({
    agencyId: req.user._id,
    project,
    customer,
    source,
    assignedAgent: assignedAgent || null,
    priority: priority || "Warm",
    status: assignedAgent ? "Assigned" : "New",
    timeline: [{
      action: assignedAgent ? "Lead created and assigned" : "Lead created",
      createdBy: req.user._id,
    }],
  });

  if (assignedAgent) {
    await notify({
      agencyId: req.user._id, recipient: assignedAgent, type: "AssignmentNotification",
      title: "New lead assigned to you", message: `${customer.name} — ${lead.status}`, lead: lead._id,
    });
  }

  return success(res, 201, "Lead created", lead);
});

// List — agency sees all leads, agent sees only leads assigned to them.
const listLeads = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const { status, priority, project, search, page = 1, limit = 20, sortBy = "-createdAt" } = req.query;

  const filter = { agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  if (search) {
    filter.$or = [
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [leadsRaw, total] = await Promise.all([
    Lead.find(filter)
      .populate("project", "name location")
      .populate("assignedAgent", "name email")
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Lead.countDocuments(filter),
  ]);

  // Last 5 communication responses, oldest→newest (same idea as a sports "Last 5" form guide)
  const leads = leadsRaw.map((lead) => ({
    ...lead,
    recentResponses: (lead.communicationLogs || []).slice(-5).map((c) => c.response),
  }));

  return success(res, 200, "Leads fetched", leads, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit),
  });
});

const getLead = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const filter = { _id: req.params.id, agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const lead = await Lead.findOne(filter)
    .populate("project", "name location developerName")
    .populate("assignedAgent", "name email")
    .populate("timeline.createdBy", "name role")
    .populate("communicationLogs.createdBy", "name role")
    .populate("followUps.createdBy", "name role")
    .populate("visitTimeline.createdBy", "name role");

  if (!lead) throw new ApiError(404, "Lead not found");
  return success(res, 200, "Lead fetched", lead);
});

// Agent can update status on their own leads; Agency can update any of its leads.
const updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const agencyId = scopedAgencyId(req.user);
  const filter = { _id: req.params.id, agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  lead.status = status;
  lead.timeline.push({
    action: `Status changed to ${status}`,
    remarks,
    createdBy: req.user._id,
  });

  // First time a lead is marked Converted, spin up its Client profile automatically
  if (status === "Converted" && !lead.convertedClient) {
    const client = await Client.create({
      agencyId: lead.agencyId,
      lead: lead._id,
      name: lead.customer.name,
      email: lead.customer.email,
      phone: lead.customer.phone,
    });
    lead.convertedClient = client._id;
    lead.timeline.push({ action: "Client profile created", createdBy: req.user._id });
  }

  await lead.save();

  return success(res, 200, "Lead status updated", lead);
});

// Agency only — (re)assign or reassign an agent to a lead.
const assignAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  if (!agentId) throw new ApiError(400, "agentId is required");

  const lead = await Lead.findOne({ _id: req.params.id, agencyId: req.user._id, isDeleted: false });
  if (!lead) throw new ApiError(404, "Lead not found");

  lead.assignedAgent = agentId;
  if (lead.status === "New") lead.status = "Assigned";
  lead.timeline.push({ action: "Lead assigned to agent", createdBy: req.user._id });
  await lead.save();

  await notify({
    agencyId: req.user._id, recipient: agentId, type: "AssignmentNotification",
    title: "Lead assigned to you", message: `${lead.customer.name}`, lead: lead._id,
  });

  return success(res, 200, "Lead assigned", lead);
});

// Both roles — log a call/WhatsApp/email/etc. Never overwrites prior logs (append-only).
const addCommunication = asyncHandler(async (req, res) => {
  const { method, remarks, response } = req.body;
  if (!method || !remarks) throw new ApiError(400, "method and remarks are required");

  const agencyId = scopedAgencyId(req.user);
  const filter = { _id: req.params.id, agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  lead.communicationLogs.push({ method, remarks, response, createdBy: req.user._id });
  lead.timeline.push({ action: `Communication logged (${method})`, remarks, createdBy: req.user._id });
  await lead.save();

  return success(res, 201, "Communication logged", lead);
});

// Both roles — schedule a follow-up on a lead they can access.
const addFollowUp = asyncHandler(async (req, res) => {
  const { scheduledAt, remarks } = req.body;
  if (!scheduledAt) throw new ApiError(400, "scheduledAt is required");

  const agencyId = scopedAgencyId(req.user);
  const filter = { _id: req.params.id, agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  lead.followUps.push({ scheduledAt, remarks, createdBy: req.user._id });
  lead.timeline.push({ action: "Follow-up scheduled", remarks, createdBy: req.user._id });
  await lead.save();

  return success(res, 201, "Follow-up scheduled", lead);
});

// Both roles — advance the visit tracker by one step (shipment-tracking style).
// Steps are append-only and not forced into strict order at this stage (an agent
// might skip "Client Picked" if the client meets on-site) — enforceable later if needed.
const addVisitStep = asyncHandler(async (req, res) => {
  const { step, remarks, gpsLocation, imageUrl } = req.body;
  if (!step) throw new ApiError(400, "step is required");

  const agencyId = scopedAgencyId(req.user);
  const filter = { _id: req.params.id, agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  lead.visitTimeline.push({ step, remarks, gpsLocation, imageUrl, createdBy: req.user._id });
  lead.timeline.push({ action: `Visit step: ${step}`, remarks, createdBy: req.user._id });
  await lead.save();

  if (step === "Visit Assigned" && lead.assignedAgent) {
    await notify({
      agencyId: lead.agencyId, recipient: lead.assignedAgent, type: "VisitReminder",
      title: "Site visit assigned", message: `${lead.customer.name} — start the visit tracker`, lead: lead._id,
    });
  }

  return success(res, 201, "Visit step recorded", lead);
});

// Aggregated follow-up tracker across all leads (agency: all; agent: own leads only)
const listFollowUps = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const filter = { agencyId, isDeleted: false, "followUps.0": { $exists: true } };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const leads = await Lead.find(filter)
    .select("customer project followUps assignedAgent")
    .populate("project", "name")
    .populate("assignedAgent", "name");

  const followUps = [];
  leads.forEach((lead) => {
    lead.followUps.forEach((f) => {
      followUps.push({
        _id: f._id,
        leadId: lead._id,
        customerName: lead.customer.name,
        projectName: lead.project?.name,
        agentName: lead.assignedAgent?.name,
        scheduledAt: f.scheduledAt,
        remarks: f.remarks,
        isCompleted: f.isCompleted,
      });
    });
  });

  followUps.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  return success(res, 200, "Follow-ups fetched", followUps);
});

// Perform a scheduled follow-up: log what happened, optionally move the lead's
// status forward, and mark the follow-up completed — all in one action.
const performFollowUp = asyncHandler(async (req, res) => {
  const { method, remarks, response, newStatus } = req.body;

  const agencyId = scopedAgencyId(req.user);
  const filter = { _id: req.params.id, agencyId, isDeleted: false };
  if (req.user.role === "agent") filter.assignedAgent = req.user._id;

  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  const followUp = lead.followUps.id(req.params.followUpId);
  if (!followUp) throw new ApiError(404, "Follow-up not found");

  followUp.isCompleted = true;

  if (remarks) {
    lead.communicationLogs.push({
      method: method || "Phone",
      remarks,
      response: response || "Neutral",
      createdBy: req.user._id,
    });
  }

  lead.timeline.push({ action: "Follow-up performed", remarks, createdBy: req.user._id });

  if (newStatus && newStatus !== lead.status) {
    lead.status = newStatus;
    lead.timeline.push({ action: `Status changed to ${newStatus}`, createdBy: req.user._id });

    if (newStatus === "Converted" && !lead.convertedClient) {
      const client = await Client.create({
        agencyId: lead.agencyId, lead: lead._id,
        name: lead.customer.name, email: lead.customer.email, phone: lead.customer.phone,
      });
      lead.convertedClient = client._id;
      lead.timeline.push({ action: "Client profile created", createdBy: req.user._id });
    }
  }

  await lead.save();
  return success(res, 200, "Follow-up performed", lead);
});

// Agency only — bulk-create leads from a parsed CSV (frontend parses, backend just persists).
// All rows go to one project; duplicates (same phone within that project) are skipped.
const bulkImportLeads = asyncHandler(async (req, res) => {
  const { project, leads } = req.body;
  if (!project || !Array.isArray(leads) || leads.length === 0) {
    throw new ApiError(400, "project and a non-empty leads array are required");
  }

  const existingPhones = new Set(
    (await Lead.find({ agencyId: req.user._id, project, isDeleted: false }).select("customer.phone"))
      .map((l) => l.customer.phone)
  );

  let created = 0, skipped = 0;
  const errors = [];

  for (const row of leads) {
    const phone = row.phone?.toString().trim();
    const name = row.name?.toString().trim();
    if (!name || !phone) { errors.push(`Skipped row (missing name/phone): ${JSON.stringify(row)}`); continue; }
    if (existingPhones.has(phone)) { skipped++; continue; }

    await Lead.create({
      agencyId: req.user._id,
      project,
      customer: { name, phone, email: row.email?.trim() || undefined },
      source: row.source?.trim() || "Other",
      priority: ["Hot", "Warm", "Cold"].includes(row.priority) ? row.priority : "Warm",
      timeline: [{ action: "Lead imported from file", createdBy: req.user._id }],
    });
    existingPhones.add(phone);
    created++;
  }

  return success(res, 201, "Import complete", { created, skipped, total: leads.length, errors });
});

// Agency only — bulk-update agent and/or project for many leads in one action
const bulkAssignLeads = asyncHandler(async (req, res) => {
  const { leadIds, agentId, project } = req.body;
  if (!Array.isArray(leadIds) || leadIds.length === 0 || (!agentId && !project)) {
    throw new ApiError(400, "leadIds (array) and at least one of agentId or project are required");
  }

  const leads = await Lead.find({ _id: { $in: leadIds }, agencyId: req.user._id, isDeleted: false });
  for (const lead of leads) {
    if (project) {
      lead.project = project;
      lead.timeline.push({ action: "Project updated (bulk)", createdBy: req.user._id });
    }
    if (agentId) {
      lead.assignedAgent = agentId;
      if (lead.status === "New") lead.status = "Assigned";
      lead.timeline.push({ action: "Lead assigned to agent (bulk)", createdBy: req.user._id });
    }
    await lead.save();

    if (agentId) {
      await notify({
        agencyId: req.user._id, recipient: agentId, type: "AssignmentNotification",
        title: "Lead assigned to you", message: lead.customer.name, lead: lead._id,
      });
    }
  }

  return success(res, 200, "Leads updated", { updated: leads.length });
});

module.exports = {
  createLead, listLeads, getLead, updateStatus, assignAgent, addCommunication, addFollowUp, addVisitStep,
  listFollowUps, performFollowUp, bulkImportLeads, bulkAssignLeads,
};