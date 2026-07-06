import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useAgentsList = () =>
  useQuery({
    queryKey: ["agents"],
    queryFn: async () => (await apiClient.get("/auth/agents")).data.data,
  });

export const useCreateAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/auth/agents", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
};

export const useUpdateAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await apiClient.patch(`/auth/agents/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
};

export const useDeleteAgent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/auth/agents/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
};