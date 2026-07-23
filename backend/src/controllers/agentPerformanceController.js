const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Booking = require("../models/Booking");

// GET /api/v1/auth/agents/:id/performance — agency only
// Everything an agency needs to actually see what an agent is doing: lead funnel,
// conversion rate, communication quality (response breakdown), visit completion,
// follow-up discipline, and revenue/commission attributed to their converted leads.
const getAgentPerformance = asyncHandler(async (req, res) => {
  const agent = await User.findOne({
    _id: req.params.id, role: "agent", agencyId: req.user._id, isDeleted: false,
  }).select("name email phone isActive commissionRate createdAt");
  if (!agent) throw new ApiError(404, "Agent not found");

  const leads = await Lead.find({ agencyId: req.user._id, assignedAgent: agent._id, isDeleted: false })
    .select("customer status priority communicationLogs followUps visitTimeline convertedClient updatedAt")
    .sort({ updatedAt: -1 });

  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === "Converted").length;
  const lostLeads = leads.filter((l) => l.status === "Lost").length;
  const conversionRate = totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

  const leadsByStatus = {};
  leads.forEach((l) => { leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1; });

  // Communication quality — same Positive/Neutral/Negative idea as the Leads table's "Last 5"
  let totalCommunications = 0;
  const responseBreakdown = { Positive: 0, Neutral: 0, Negative: 0 };
  leads.forEach((l) => {
    l.communicationLogs.forEach((c) => {
      totalCommunications++;
      responseBreakdown[c.response] = (responseBreakdown[c.response] || 0) + 1;
    });
  });

  // Follow-up discipline
  let totalFollowUps = 0, completedFollowUps = 0, overdueFollowUps = 0;
  const now = new Date();
  leads.forEach((l) => {
    l.followUps.forEach((f) => {
      totalFollowUps++;
      if (f.isCompleted) completedFollowUps++;
      else if (f.scheduledAt < now) overdueFollowUps++;
    });
  });

  // Visit tracking — how many leads this agent fully walked through to feedback
  let totalVisitSteps = 0;
  const visitsFullyTracked = leads.filter((l) => {
    totalVisitSteps += l.visitTimeline.length;
    return l.visitTimeline.some((v) => v.step === "Feedback Submitted");
  }).length;

  // Bookings/revenue attributed via this agent's converted leads
  const clientIds = leads.filter((l) => l.convertedClient).map((l) => l.convertedClient);
  const bookings = await Booking.find({ client: { $in: clientIds }, isDeleted: false })
    .select("totalAmount status unitNumber createdAt");
  const completedRevenue = bookings.filter((b) => b.status === "Completed").reduce((s, b) => s + b.totalAmount, 0);
  const commissionEarned = Number(((completedRevenue * (agent.commissionRate || 0)) / 100).toFixed(2));

  return success(res, 200, "Agent performance fetched", {
    agent,
    leads: {
      total: totalLeads, converted: convertedLeads, lost: lostLeads, conversionRate, byStatus: leadsByStatus,
      recent: leads.slice(0, 8).map((l) => ({ id: l._id, name: l.customer.name, status: l.status, priority: l.priority })),
    },
    communications: { total: totalCommunications, byResponse: responseBreakdown },
    followUps: { total: totalFollowUps, completed: completedFollowUps, overdue: overdueFollowUps, pending: totalFollowUps - completedFollowUps },
    visits: { totalSteps: totalVisitSteps, leadsFullyTracked: visitsFullyTracked },
    bookings: { total: bookings.length, completed: bookings.filter((b) => b.status === "Completed").length, completedRevenue, commissionEarned },
  });
});

module.exports = { getAgentPerformance };