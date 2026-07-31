import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

// Agent — their own request history
export const useMyLeadRequests = (params = {}) =>
  useQuery({
    queryKey: ["lead-requests", "mine", params],
    queryFn: async () => (await apiClient.get("/lead-requests/mine", { params })).data,
  });

// Agency — every request submitted by any of its agents
export const useLeadRequests = (params = {}) =>
  useQuery({
    queryKey: ["lead-requests", "all", params],
    queryFn: async () => (await apiClient.get("/lead-requests", { params })).data,
  });

// Detail view — includes `existingLead` (null if no match) so the UI can show
// "this lead already exists, currently assigned to X" before the agency decides.
export const useLeadRequestDetail = (id) =>
  useQuery({
    queryKey: ["lead-requests", "detail", id],
    queryFn: async () => (await apiClient.get(`/lead-requests/${id}`)).data,
    enabled: !!id,
  });

export const useCreateLeadRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/lead-requests", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-requests"] }),
  });
};

export const useAcceptLeadRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await apiClient.patch(`/lead-requests/${id}/accept`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-requests"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

export const useReassignLeadRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agentId }) =>
      (await apiClient.patch(`/lead-requests/${id}/reassign`, { agentId })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-requests"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

export const useRejectLeadRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }) =>
      (await apiClient.patch(`/lead-requests/${id}/reject`, { reason })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-requests"] }),
  });
};

export const useCancelLeadRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/lead-requests/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-requests"] }),
  });
};