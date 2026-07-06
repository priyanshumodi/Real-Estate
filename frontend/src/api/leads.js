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

export const useAgents = () =>
  useQuery({
    queryKey: ["agents"],
    queryFn: async () => (await apiClient.get("/auth/agents")).data.data,
  });