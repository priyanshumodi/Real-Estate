import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useAddVisitStep = (leadId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await apiClient.post(`/leads/${leadId}/visit`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};