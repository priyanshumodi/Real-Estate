const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const Lead = require("../models/Lead");
const Project = require("../models/Project");
const Client = require("../models/Client");
const User = require("../models/User");

const getStats = asyncHandler(async (req, res) => {
  const isAgency = req.user.role === "agency";
  const agencyId = isAgency ? req.user._id : req.user.agencyId;
  const leadMatch = { agencyId, isDeleted: false };
  if (!isAgency) leadMatch.assignedAgent = req.user._id;

  const [statusAgg, priorityAgg, totalLeads, convertedCount] = await Promise.all([
    Lead.aggregate([{ $match: leadMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.aggregate([{ $match: leadMatch }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Lead.countDocuments(leadMatch),
    Lead.countDocuments({ ...leadMatch, status: "Converted" }),
  ]);

  const leadsByStatus = statusAgg.map((s) => ({ status: s._id, count: s.count }));
  const leadsByPriority = priorityAgg.map((p) => ({ priority: p._id, count: p.count }));
  const conversionRate = totalLeads ? Number(((convertedCount / totalLeads) * 100).toFixed(1)) : 0;

  const base = { totalLeads, convertedCount, conversionRate, leadsByStatus, leadsByPriority };

  if (isAgency) {
    const [totalProjects, totalClients, totalAgents, agentPerformance] = await Promise.all([
      Project.countDocuments({ agencyId, isDeleted: false }),
      Client.countDocuments({ agencyId, isDeleted: false }),
      User.countDocuments({ role: "agent", agencyId, isDeleted: false }),
      Lead.aggregate([
        { $match: { agencyId, isDeleted: false, assignedAgent: { $ne: null } } },
        {
          $group: {
            _id: "$assignedAgent",
            totalAssigned: { $sum: 1 },
            converted: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } },
          },
        },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
        { $unwind: "$agent" },
        {
          $project: {
            _id: 0,
            agentId: "$_id",
            name: "$agent.name",
            totalAssigned: 1,
            converted: 1,
          },
        },
      ]),
    ]);

    return success(res, 200, "Dashboard stats fetched", {
      ...base,
      totalProjects,
      totalClients,
      totalAgents,
      agentPerformance,
    });
  }

  // Agent view: their own pending follow-ups and visit progress
  const myLeads = await Lead.find(leadMatch).select("followUps visitTimeline");
  const now = new Date();
  let pendingFollowUps = 0;
  let visitsCompleted = 0;
  myLeads.forEach((lead) => {
    pendingFollowUps += lead.followUps.filter((f) => !f.isCompleted && new Date(f.scheduledAt) >= now).length;
    visitsCompleted += lead.visitTimeline.filter((v) => v.step === "Property Tour Completed").length;
  });

  return success(res, 200, "Dashboard stats fetched", { ...base, pendingFollowUps, visitsCompleted });
});

module.exports = { getStats };