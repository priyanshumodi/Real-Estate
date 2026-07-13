import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useFollowUps, usePerformFollowUp } from "../api/followups";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

const METHODS = ["Phone", "WhatsApp", "SMS", "Email", "Office Meeting", "Site Visit"];
const STATUS_OPTIONS = [
  "New", "Assigned", "Contacted", "Follow-up", "Visit Scheduled", "Visit Started",
  "Visit Completed", "Interested", "Negotiation", "Booking", "Converted", "Lost", "Archived",
];

const FollowUps = () => {
  const { user } = useAuth();
  const isAgent = user?.role === "agent";
  const { data: followUps, isLoading } = useFollowUps();
  const performFollowUp = usePerformFollowUp();
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ method: "Phone", remarks: "", response: "Neutral", newStatus: "" });

  const now = new Date();

  const openRow = (f) => {
    setOpenId(f._id);
    setForm({ method: "Phone", remarks: "", response: "Neutral", newStatus: "" });
  };

  const submit = (f) => {
    performFollowUp.mutate(
      { leadId: f.leadId, followUpId: f._id, ...form, newStatus: form.newStatus || undefined },
      { onSuccess: () => setOpenId(null) }
    );
  };

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Pipeline</p>
      <h1 className="font-display text-2xl text-ink-900 mb-6">Follow-ups</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Project</th>
              <th className="text-left px-5 py-3">Agent</th>
              <th className="text-left px-5 py-3">Scheduled</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>}
            {!isLoading && followUps?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-ink-400">No follow-ups scheduled.</td></tr>
            )}
            {followUps?.map((f) => {
              const isOverdue = !f.isCompleted && new Date(f.scheduledAt) < now;
              const isOpen = openId === f._id;
              return (
                <Fragment key={f._id}>
                  <tr className="border-t border-gray-100">
                    <td className="px-5 py-3">
                      <Link to={`/leads/${f.leadId}`} className="font-medium text-ink-900 hover:text-gold-600">
                        {f.customerName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{f.projectName || "—"}</td>
                    <td className="px-5 py-3 text-ink-600">{f.agentName || "Unassigned"}</td>
                    <td className="px-5 py-3 text-ink-600">{new Date(f.scheduledAt).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      {f.isCompleted ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Completed</span>
                      ) : isOverdue ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 font-medium">Overdue</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gold-500/10 text-gold-600 font-medium">Upcoming</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!f.isCompleted && isAgent && (
                        <button
                          onClick={() => (isOpen ? setOpenId(null) : openRow(f))}
                          className="text-xs text-navy-900 font-medium hover:text-gold-600"
                        >
                          {isOpen ? "Cancel" : "Perform follow-up"}
                        </button>
                      )}
                      {!f.isCompleted && !isAgent && (
                        <span className="text-xs text-ink-400">Tracked by {f.agentName || "agent"}</span>
                      )}
                    </td>
                  </tr>
                  {isOpen && isAgent && (
                    <tr className="bg-gray-50 border-t border-gray-100">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="grid grid-cols-4 gap-3">
                          <select
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={form.method}
                            onChange={(e) => setForm({ ...form, method: e.target.value })}
                          >
                            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={form.response}
                            onChange={(e) => setForm({ ...form, response: e.target.value })}
                          >
                            <option>Positive</option><option>Neutral</option><option>Negative</option>
                          </select>
                          <select
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={form.newStatus}
                            onChange={(e) => setForm({ ...form, newStatus: e.target.value })}
                          >
                            <option value="">Keep current lead status</option>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>Move to: {s}</option>)}
                          </select>
                          <Button
                            loading={performFollowUp.isPending}
                            className="!w-auto px-4"
                            onClick={() => submit(f)}
                          >
                            Save & complete
                          </Button>
                          <textarea
                            className="col-span-4 rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="What happened on this follow-up..."
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default FollowUps;