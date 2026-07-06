import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useClients = (params = {}) =>
  useQuery({
    queryKey: ["clients", params],
    queryFn: async () => (await apiClient.get("/clients", { params })).data,
  });

export const useClient = (id) =>
  useQuery({
    queryKey: ["client", id],
    queryFn: async () => (await apiClient.get(`/clients/${id}`)).data.data,
    enabled: !!id,
  });

export const useAddClientDocument = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post(`/clients/${id}/documents`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client", id] }),
  });
};