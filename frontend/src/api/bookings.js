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
    },
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