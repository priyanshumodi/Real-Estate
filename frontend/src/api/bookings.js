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
    queryFn: async () => (await apiClient.get(`/bookings/${id}`)).data.data,
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

// Mirrors the backend's installment math exactly, so the UI can preview the plan before submitting
export const previewInstallments = (totalAmount, advanceAmount, planType) => {
  const countMap = { "Full Payment": 0, "2 Installments": 2, "4 Installments": 4, "6 Installments": 6 };
  const count = countMap[planType] ?? 0;
  if (!count || !totalAmount) return [];
  const remaining = totalAmount - advanceAmount;
  const per = Math.floor(remaining / count);
  return Array.from({ length: count }, (_, i) => {
    const due = new Date();
    due.setMonth(due.getMonth() + i + 1);
    const amount = i === count - 1 ? remaining - per * (count - 1) : per;
    return { amount, dueDate: due };
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