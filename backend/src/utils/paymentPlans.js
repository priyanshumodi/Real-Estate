const { ApiError } = require("./apiResponse");

// Seeded onto every new project as editable starting points, and used as a fallback
// for projects created before this per-project feature existed. Percentages are of
// the POST-ADVANCE remaining amount (total - advance), not the full unit price —
// minBookingPercent stays a separate, independent floor on the advance itself.
const DEFAULT_PAYMENT_PLANS = [
  {
    name: "2 Installments",
    isDefault: false,
    stages: [
      { milestone: "On Construction Start", percent: 50 },
      { milestone: "On Possession", percent: 50 },
    ],
  },
  {
    name: "4 Installments",
    isDefault: true,
    stages: [
      { milestone: "On Construction Start", percent: 30 },
      { milestone: "On Slab Completion", percent: 30 },
      { milestone: "On Finishing Work", percent: 20 },
      { milestone: "On Possession", percent: 20 },
    ],
  },
  {
    name: "6 Installments",
    isDefault: false,
    stages: [
      { milestone: "On Construction Start", percent: 20 },
      { milestone: "On Plinth Completion", percent: 15 },
      { milestone: "On Slab Completion (Mid Floor)", percent: 20 },
      { milestone: "On Slab Completion (Top Floor)", percent: 15 },
      { milestone: "On Finishing & Fit-out", percent: 15 },
      { milestone: "On Possession", percent: 15 },
    ],
  },
];

// Validates a project's paymentPlans on create/update — each plan needs a name and
// 1-10 stages whose percentages sum to exactly 100. Also normalizes isDefault so
// exactly one plan ends up marked default (first one marked wins; if none marked,
// the first plan in the array becomes default). Mutates and returns `plans`.
const validatePaymentPlans = (plans) => {
  if (!Array.isArray(plans) || plans.length === 0) return [];

  let defaultSet = false;
  plans.forEach((plan) => {
    if (!plan.name?.trim()) throw new ApiError(400, "Every payment plan needs a name");
    if (!plan.stages?.length) throw new ApiError(400, `Plan "${plan.name}" needs at least one stage`);
    if (plan.stages.length > 10) throw new ApiError(400, `Plan "${plan.name}" has too many stages (max 10)`);
    plan.stages.forEach((s) => {
      if (!s.milestone?.trim()) throw new ApiError(400, `Every stage in "${plan.name}" needs a milestone label`);
    });
    const total = plan.stages.reduce((sum, s) => sum + Number(s.percent || 0), 0);
    if (total !== 100) throw new ApiError(400, `Plan "${plan.name}"'s stages sum to ${total}%, not 100%`);

    if (plan.isDefault && defaultSet) plan.isDefault = false; // only the first one marked default wins
    if (plan.isDefault) defaultSet = true;
  });
  if (!defaultSet) plans[0].isDefault = true;

  return plans;
};

// The stage list to actually use for a booking — the project's own named plans if it
// has any, otherwise the global default templates (legacy/not-yet-configured projects).
const resolvePlans = (project) => (project.paymentPlans?.length ? project.paymentPlans : DEFAULT_PAYMENT_PLANS);

module.exports = { DEFAULT_PAYMENT_PLANS, validatePaymentPlans, resolvePlans };