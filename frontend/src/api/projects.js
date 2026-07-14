import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useProjects = (params = {}) =>
  useQuery({
    queryKey: ["projects", params],
    queryFn: async () => (await apiClient.get("/projects", { params })).data,
  });

export const useProject = (id) =>
  useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await apiClient.get(`/projects/${id}`)).data.data,
    enabled: !!id,
  });

export const useUpdateUnitPrice = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, price }) =>
      (await apiClient.patch(`/projects/${projectId}/units/${unitId}`, { price })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });
};

export const useBulkAddUnits = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await apiClient.post(`/projects/${projectId}/units/bulk`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/projects", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};