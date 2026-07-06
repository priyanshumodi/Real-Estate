import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await apiClient.get("/stats/dashboard")).data.data,
  });