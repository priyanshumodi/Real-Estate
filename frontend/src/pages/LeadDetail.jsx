import { useParams } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useLead, useUpdateLeadStatus, useAddCommunication, useAddFollowUp } from "../api/leads";
import Button from "../components/ui/Button";

const STATUS_OPTIONS = [
  "New", "Assigned", "Contacted", "Follow-up", "Visit Scheduled", "Visit Started",
  "Visit Completed", "Interested", "Negotiation", "Booking", "Converted", "Lost", "Archived",
];
const METHODS = ["Phone", "WhatsApp", "SMS", "Email", "Office Meeting", "Site Visit"];

const LeadDetail = () => {
  const { id } = useParams();
  const { data: lead, isLoading } = useLead(id);
  const updateStatus = useUpdateLeadStatus(id);
  const addComm = useAddCommunication(id);
  const addFollowUp = useAddFollowUp(id);

  const [status, setStatus] = useState("");
  const [commMethod, setCommMethod] = useState("Phone");
  const [commRemarks, setCommRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  if (isLoading || !lead) {
    return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Lead</p>
      <h1 className="font-display text-2xl text-ink-900 mb-1">{lead.customer.name}</h1>
      <p className="text-sm text-ink-600 mb-6">{lead.customer.phone} · {lead.project?.name}</p>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: details + actions */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Update status</p>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3"
              value={status || lead.status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button
              loading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ status: status || lead.status })}
            >
              Save status
            </Button>
          </div>

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
            <Button
              loading={addComm.isPending}
              disabled={!commRemarks}
              onClick={() => {
                addComm.mutate({ method: commMethod, remarks: commRemarks });
                setCommRemarks("");
              }}
            >
              Log it
            </Button>
          </div>

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
        </div>

        {/* Right: timeline */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
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
      </div>
    </AppLayout>
  );
};

export default LeadDetail;