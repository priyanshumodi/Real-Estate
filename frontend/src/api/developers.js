import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useDevelopers = () =>
  useQuery({
    queryKey: ["developers"],
    queryFn: async () => (await apiClient.get("/developers")).data.data,
  });

export const useCreateDeveloper = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post("/developers", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["developers"] }),
  });
};