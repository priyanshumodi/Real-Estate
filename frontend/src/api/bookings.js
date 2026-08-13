import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useBookings = (params = {}) =>
  useQuery({
    queryKey: ["bookings", params],
    queryFn: async () => (await apiClient.get("/bookings", { params })).data,
  });

export const useBooking = (id) =>
  useQuery({
    queryKey: ["booking", id],
    queryFn: async () => (await apiClient.get(`/bookings/${id}`)).data,
    enabled: !!id,
  });

export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/bookings", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

// Same defaults as backend/src/utils/paymentPlans.js's DEFAULT_PAYMENT_PLANS (and
// pages/Projects.tsx's STARTER_PLANS) — fallback for projects that predate the
// per-project payment-plans feature and have no paymentPlans of their own yet.
const DEFAULT_PAYMENT_PLANS = [
  { name: "2 Installments", stages: [
    { milestone: "On Construction Start", percent: 50 },
    { milestone: "On Possession", percent: 50 },
  ]},
  { name: "4 Installments", stages: [
    { milestone: "On Construction Start", percent: 30 },
    { milestone: "On Slab Completion", percent: 30 },
    { milestone: "On Finishing Work", percent: 20 },
    { milestone: "On Possession", percent: 20 },
  ]},
  { name: "6 Installments", stages: [
    { milestone: "On Construction Start", percent: 20 },
    { milestone: "On Plinth Completion", percent: 15 },
    { milestone: "On Slab Completion (Mid Floor)", percent: 20 },
    { milestone: "On Slab Completion (Top Floor)", percent: 15 },
    { milestone: "On Finishing & Fit-out", percent: 15 },
    { milestone: "On Possession", percent: 15 },
  ]},
];

// The plan list a given project actually offers — its own paymentPlans if it has
// any, otherwise the defaults. Mirrors the backend's resolvePlans() in
// utils/paymentPlans.js exactly, so the dropdown always matches what booking
// creation will actually accept.
export const resolveProjectPlans = (project) => (project?.paymentPlans?.length ? project.paymentPlans : DEFAULT_PAYMENT_PLANS);

// Mirrors the backend's installment math exactly, so the UI can preview the plan
// before submitting. Milestone percentages, not equal shares — the last stage
// absorbs the rounding remainder. `project` resolves which plan's stages to use.
export const previewInstallments = (totalAmount, advanceAmount, planType, project) => {
  if (planType === "Full Payment" || !totalAmount) return [];
  const plan = resolveProjectPlans(project).find((p) => p.name === planType);
  if (!plan) return [];
  const remaining = totalAmount - advanceAmount;
  let allocated = 0;
  return plan.stages.map((stage, i) => {
    const due = new Date();
    due.setMonth(due.getMonth() + i + 1);
    const amount = i === plan.stages.length - 1 ? remaining - allocated : Math.round((remaining * stage.percent) / 100);
    allocated += amount;
    return { milestone: stage.milestone, percent: stage.percent, amount, dueDate: due };
  });
};

export const useUpdateBookingStatus = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status) => (await apiClient.patch(`/bookings/${id}/status`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const usePayInstallment = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post(`/bookings/${id}/pay-installment`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking", id] }),
  });
};