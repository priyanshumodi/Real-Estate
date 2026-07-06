const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const Lead = require("../models/Lead");
const Client = require("../models/Client");
const Project = require("../models/Project");
const User = require("../models/User");

const groupCount = (arr, field) => {
  const map = {};
  arr.forEach((v) => { map[v] = (map[v] || 0) + 1; });
  return Object.entries(map).map(([key, count]) => ({ key, count }));
};

// GET /api/v1/stats/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const isAgency = req.user.role === "agency";
  const agencyId = isAgency ? req.user._id : req.user.agencyId;

  const leadFilter = { agencyId, isDeleted: false };
  if (!isAgency) leadFilter.assignedAgent = req.user._id;

  const leads = await Lead.find(leadFilter).select("status priority source assignedAgent createdAt");

  const leadsByStatus = groupCount(leads.map((l) => l.status), "status");
  const leadsByPriority = groupCount(leads.map((l) => l.priority), "priority");
  const leadsBySource = groupCount(leads.map((l) => l.source), "source");

  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === "Converted").length;
  const lostLeads = leads.filter((l) => l.status === "Lost").length;
  const conversionRate = totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

  const base = {
    totalLeads, convertedLeads, lostLeads, conversionRate,
    leadsByStatus, leadsByPriority, leadsBySource,
  };

  if (!isAgency) {
    // Agent view — just their own numbers
    return success(res, 200, "Dashboard stats fetched", base);
  }

  // Agency view — org-wide numbers + per-agent performance + inventory
  const [totalClients, totalProjects, agents] = await Promise.all([
    Client.countDocuments({ agencyId, isDeleted: false }),
    Project.countDocuments({ agencyId, isDeleted: false }),
    User.find({ role: "agent", agencyId, isDeleted: false }).select("name"),
  ]);

  const agentPerformance = agents.map((agent) => {
    const agentLeads = leads.filter((l) => String(l.assignedAgent) === String(agent._id));
    const converted = agentLeads.filter((l) => l.status === "Converted").length;
    return {
      agentId: agent._id,
      name: agent.name,
      totalLeads: agentLeads.length,
      converted,
      conversionRate: agentLeads.length ? Number(((converted / agentLeads.length) * 100).toFixed(1)) : 0,
    };
  });

  const projects = await Project.find({ agencyId, isDeleted: false }).select("totalUnits availableUnits");
  const totalUnits = projects.reduce((sum, p) => sum + p.totalUnits, 0);
  const availableUnits = projects.reduce((sum, p) => sum + p.availableUnits, 0);

  return success(res, 200, "Dashboard stats fetched", {
    ...base,
    totalClients,
    totalProjects,
    totalAgents: agents.length,
    inventory: { totalUnits, availableUnits, soldUnits: totalUnits - availableUnits },
    agentPerformance: agentPerformance.sort((a, b) => b.totalLeads - a.totalLeads),
  });
});

module.exports = { getDashboardStats };