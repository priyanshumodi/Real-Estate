import { useParams } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import VisitTracker from "../components/leads/VisitTracker";
import { useAuth } from "../context/AuthContext";
import { useLead, useUpdateLeadStatus, useAddCommunication, useAddFollowUp, useAssignAgent, useAgents } from "../api/leads";
import Button from "../components/ui/Button";

const STATUS_OPTIONS = [
  "New", "Assigned", "Contacted", "Follow-up", "Visit Scheduled", "Visit Started",
  "Visit Completed", "Interested", "Negotiation", "Booking", "Converted", "Lost", "Archived",
];
const METHODS = ["Phone", "WhatsApp", "SMS", "Email", "Office Meeting", "Site Visit"];

const LeadDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isAgent = user?.role === "agent";
  const { data: lead, isLoading } = useLead(id);
  const updateStatus = useUpdateLeadStatus(id);
  const addComm = useAddCommunication(id);
  const addFollowUp = useAddFollowUp(id);
  const assignAgent = useAssignAgent(id);
  const { data: agents } = useAgents();
  const [reassignTo, setReassignTo] = useState("");
  const [assignMsg, setAssignMsg] = useState("");

  const [status, setStatus] = useState("");
  const [commMethod, setCommMethod] = useState("Phone");
  const [commRemarks, setCommRemarks] = useState("");
  const [commResponse, setCommResponse] = useState("Neutral");
  const [followUpDate, setFollowUpDate] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [expandedFollowUp, setExpandedFollowUp] = useState(null);

  if (isLoading || !lead) {
    return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;
  }

  const saveStatus = (value) => {
    updateStatus.mutate(
      { status: value },
      {
        onSuccess: () => {
          setStatusMsg(
            value === "Converted"
              ? "Status updated — Client profile created. Check the Clients page."
              : `Status updated to "${value}".`
          );
          setTimeout(() => setStatusMsg(""), 4000);
        },
        onError: () => setStatusMsg("Something went wrong updating status."),
      }
    );
  };

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Lead</p>
      <h1 className="font-display text-2xl text-ink-900 mb-1">{lead.customer.name}</h1>
      <p className="text-sm text-ink-600 mb-6">{lead.customer.phone} · {lead.project?.name}</p>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: agent-only actions. Agency gets a read-only status summary instead. */}
        <div className="col-span-1 space-y-6">
          {!isAgent && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">Current status</p>
              <p className="text-lg font-semibold text-ink-900 mb-1">{lead.status}</p>
              <p className="text-xs text-ink-400 mb-4">
                Priority: {lead.priority} · Assigned to {lead.assignedAgent?.name || "no one yet"}
              </p>

              <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">
                {lead.assignedAgent ? "Reassign to a different agent" : "Assign an agent"}
              </p>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
              >
                <option value="">Select agent</option>
                {agents?.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
              <Button
                loading={assignAgent.isPending}
                disabled={!reassignTo}
                onClick={() =>
                  assignAgent.mutate(reassignTo, {
                    onSuccess: () => { setAssignMsg("Agent updated."); setTimeout(() => setAssignMsg(""), 3000); },
                  })
                }
              >
                {lead.assignedAgent ? "Reassign" : "Assign"}
              </Button>
              {assignMsg && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2 mt-3">
                  {assignMsg}
                </p>
              )}

              <p className="text-xs text-ink-400 mt-4">
                Status, communication, and follow-ups are managed by the assigned agent. You can track everything on the right.
              </p>
            </div>
          )}

          {isAgent && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">
              Current status: <span className="text-ink-900 font-semibold">{lead.status}</span>
            </p>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3"
              value={status || lead.status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button
              loading={updateStatus.isPending}
              onClick={() => saveStatus(status || lead.status)}
            >
              Save status
            </Button>

            {lead.status !== "Converted" && (
              <button
                onClick={() => saveStatus("Converted")}
                disabled={updateStatus.isPending}
                className="w-full mt-2 text-xs text-gold-600 font-medium hover:text-gold-700"
              >
                Quick action: Convert to Client now
              </button>
            )}

            {statusMsg && (
              <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2 mt-3">
                {statusMsg}
              </p>
            )}
          </div>
          )}

          {isAgent && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Log communication</p>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
              value={commMethod}
              onChange={(e) => setCommMethod(e.target.value)}
            >
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
              placeholder="What was discussed..."
              value={commRemarks}
              onChange={(e) => setCommRemarks(e.target.value)}
            />
            <label className="block text-xs text-ink-400 mb-1">Customer response</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3"
              value={commResponse}
              onChange={(e) => setCommResponse(e.target.value)}
            >
              <option>Positive</option>
              <option>Neutral</option>
              <option>Negative</option>
            </select>
            <Button
              loading={addComm.isPending}
              disabled={!commRemarks}
              onClick={() => {
                addComm.mutate({ method: commMethod, remarks: commRemarks, response: commResponse });
                setCommRemarks("");
              }}
            >
              Log it
            </Button>
          </div>
          )}

          {isAgent && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Schedule follow-up</p>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
            <Button
              loading={addFollowUp.isPending}
              disabled={!followUpDate}
              onClick={() => {
                addFollowUp.mutate({ scheduledAt: followUpDate });
                setFollowUpDate("");
              }}
            >
              Schedule
            </Button>
          </div>
          )}
        </div>

        {/* Right: timeline + follow-up history */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Activity timeline</p>
            <ul className="space-y-4">
              {[...lead.timeline].reverse().map((entry) => (
                <li key={entry._id} className="flex gap-3 border-l-2 border-gold-500/40 pl-4">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{entry.action}</p>
                    {entry.remarks && <p className="text-sm text-ink-600">{entry.remarks}</p>}
                    <p className="text-xs text-ink-400 mt-0.5">
                      {entry.createdBy?.name} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Follow-up history</p>
            {lead.followUps.length === 0 && <p className="text-sm text-ink-400">No follow-ups scheduled yet.</p>}
            <ul className="space-y-2">
              {[...lead.followUps].reverse().map((f) => {
                const isOpen = expandedFollowUp === f._id;
                const isOverdue = !f.isCompleted && new Date(f.scheduledAt) < new Date();
                return (
                  <li key={f._id} className="border border-gray-100 rounded-lg">
                    <button
                      onClick={() => setExpandedFollowUp(isOpen ? null : f._id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    >
                      <span className="text-sm text-ink-900">
                        {new Date(f.scheduledAt).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.isCompleted ? "bg-green-50 text-green-600" : isOverdue ? "bg-red-50 text-red-600" : "bg-gold-500/10 text-gold-600"
                      }`}>
                        {f.isCompleted ? "Completed" : isOverdue ? "Overdue" : "Upcoming"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 text-sm text-ink-600 border-t border-gray-100 pt-2">
                        <p>{f.remarks || "No scheduling note added."}</p>
                        <p className="text-xs text-ink-400 mt-1">Scheduled by {f.createdBy?.name || "—"}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <VisitTracker leadId={lead._id} visitTimeline={lead.visitTimeline} readOnly={!isAgent} />
      </div>
    </AppLayout>
  );
};

export default LeadDetail;