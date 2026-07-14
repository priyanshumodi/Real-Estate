import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useLeads = (params = {}) =>
  useQuery({
    queryKey: ["leads", params],
    queryFn: async () => (await apiClient.get("/leads", { params })).data,
  });

export const useLead = (id) =>
  useQuery({
    queryKey: ["lead", id],
    queryFn: async () => (await apiClient.get(`/leads/${id}`)).data.data,
    enabled: !!id,
  });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/leads", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
};

export const useUpdateLeadStatus = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await apiClient.patch(`/leads/${id}/status`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useAddCommunication = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await apiClient.post(`/leads/${id}/communication`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });
};

export const useAddFollowUp = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await apiClient.post(`/leads/${id}/followup`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });
};

export const useBulkImportLeads = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/leads/bulk-import", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
};

export const useBulkAssignLeads = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await apiClient.patch("/leads/bulk-assign", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
};

export const useAssignAgent = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agentId) => (await apiClient.patch(`/leads/${id}/assign`, { agentId })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

export const useAgents = () =>
  useQuery({
    queryKey: ["agents"],
    queryFn: async () => (await apiClient.get("/auth/agents")).data.data,
  });