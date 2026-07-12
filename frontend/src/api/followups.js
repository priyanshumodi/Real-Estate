import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useFollowUps = () =>
  useQuery({
    queryKey: ["followups"],
    queryFn: async () => (await apiClient.get("/leads/followups")).data.data,
  });

export const usePerformFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, followUpId, ...payload }) =>
      (await apiClient.patch(`/leads/${leadId}/followup/${followUpId}/perform`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};