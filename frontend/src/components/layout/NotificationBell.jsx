import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead,
} from "../../api/notifications";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const handleClick = (n) => {
    markRead.mutate(n._id);
    setOpen(false);
    if (n.relatedLead) navigate(`/leads/${n.relatedLead}`);
    else if (n.relatedBooking) navigate(`/bookings/${n.relatedBooking}`);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative text-white/70 hover:text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {!!unreadCount && (
          <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-navy-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {!!unreadCount && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-navy-900 hover:text-gold-600">
                Mark all read
              </button>
            )}
          </div>
          {(!notifications || notifications.length === 0) && (
            <p className="px-4 py-6 text-sm text-ink-400 text-center">No notifications yet.</p>
          )}
          {notifications?.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? "bg-gold-500/5" : ""}`}
            >
              <p className="text-sm font-medium text-ink-900">{n.title}</p>
              {n.message && <p className="text-xs text-ink-600">{n.message}</p>}
              <p className="text-xs text-ink-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;