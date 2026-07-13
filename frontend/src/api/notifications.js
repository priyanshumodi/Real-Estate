import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await apiClient.get("/notifications")).data.data,
    refetchInterval: 30000, // poll every 30s so reminders show up without a manual refresh
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => (await apiClient.get("/notifications/unread-count")).data.data.count,
    refetchInterval: 30000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await apiClient.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.patch("/notifications/read-all")).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};