import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useLeads, useCreateLead, useAgents } from "../api/leads";
import { useProjects } from "../api/projects";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";

const STATUS_OPTIONS = [
  "New", "Assigned", "Contacted", "Follow-up", "Visit Scheduled", "Visit Started",
  "Visit Completed", "Interested", "Negotiation", "Booking", "Converted", "Lost", "Archived",
];

const priorityColor = {
  Hot: "bg-red-50 text-red-600",
  Warm: "bg-gold-500/10 text-gold-600",
  Cold: "bg-blue-50 text-blue-600",
};

const Leads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: "", priority: "", search: "" });
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useLeads(filters);
  const { data: projectsData } = useProjects();
  const { data: agents } = useAgents();
  const createLead = useCreateLead();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (formData) => {
    await createLead.mutateAsync({
      project: formData.project,
      customer: { name: formData.name, phone: formData.phone, email: formData.email },
      source: formData.source,
      priority: formData.priority,
      assignedAgent: formData.assignedAgent || undefined,
    });
    reset();
    setShowForm(false);
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Pipeline</p>
          <h1 className="font-display text-2xl text-ink-900">Leads</h1>
        </div>
        {user?.role === "agency" && (
          <Button className="!w-auto px-4" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ New lead"}
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Project</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("project", { required: true })}>
              <option value="">Select project</option>
              {projectsData?.data?.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <TextField label="Customer name" {...register("name", { required: true })} />
          <TextField label="Phone" {...register("phone", { required: true })} />
          <TextField label="Email (optional)" {...register("email")} />
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Source</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("source")}>
              {["Website", "Referral", "Walk-In", "Facebook", "Google", "Property Portal", "Other"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Priority</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("priority")}>
              <option>Hot</option><option>Warm</option><option>Cold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Assign agent (optional)</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("assignedAgent")}>
              <option value="">Unassigned</option>
              {agents?.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Button type="submit" loading={createLead.isPending} className="!w-auto px-6">Save lead</Button>
          </div>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search name or phone..."
          className="rounded-md border border-gray-300 px-3.5 py-2 text-sm flex-1"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="rounded-md border border-gray-300 px-3.5 py-2 text-sm"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="rounded-md border border-gray-300 px-3.5 py-2 text-sm"
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
        >
          <option value="">All priorities</option>
          <option>Hot</option><option>Warm</option><option>Cold</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Project</th>
              <th className="text-left px-5 py-3">Agent</th>
              <th className="text-left px-5 py-3">Priority</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">No leads found.</td></tr>
            )}
            {data?.data?.map((lead) => (
              <tr
                key={lead._id}
                onClick={() => navigate(`/leads/${lead._id}`)}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-5 py-3">
                  <Link to={`/leads/${lead._id}`} className="font-medium text-ink-900 hover:text-gold-600">
                    {lead.customer.name}
                  </Link>
                  <p className="text-xs text-ink-400">{lead.customer.phone}</p>
                </td>
                <td className="px-5 py-3 text-ink-600">{lead.project?.name || "—"}</td>
                <td className="px-5 py-3 text-ink-600">{lead.assignedAgent?.name || "Unassigned"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor[lead.priority]}`}>
                    {lead.priority}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-600">{lead.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default Leads;