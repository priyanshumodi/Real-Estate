import { useState } from "react";
import { useForm } from "react-hook-form";
import AppLayout from "../components/layout/AppLayout";
import {
  useMyLeadRequests,
  useLeadRequests,
  useCreateLeadRequest,
  useAcceptLeadRequest,
  useRejectLeadRequest,
  useCancelLeadRequest,
} from "../api/leadRequests";
import { useProjects } from "../api/projects";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import Pagination from "../components/ui/Pagination";

const STATUS_TABS = ["Pending", "Accepted", "Rejected", "All"];

const statusColor = {
  Pending: "bg-gold-500/10 text-gold-600",
  Accepted: "bg-green-100 text-green-600",
  Rejected: "bg-red-50 text-red-600",
};

const LeadRequests = () => {
  const { user } = useAuth();
  const isAgency = user?.role === "agency";

  const [statusTab, setStatusTab] = useState("Pending");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const params = { page, limit: 20, ...(statusTab !== "All" ? { status: statusTab } : {}) };
  const myRequests = useMyLeadRequests(params);
  const agencyRequests = useLeadRequests(params);
  const { data, isLoading } = isAgency ? agencyRequests : myRequests;

  const { data: projectsData } = useProjects({ limit: "1000" });
  const createRequest = useCreateLeadRequest();
  const acceptRequest = useAcceptLeadRequest();
  const rejectRequest = useRejectLeadRequest();
  const cancelRequest = useCancelLeadRequest();
  const { register, handleSubmit, reset } = useForm();

  const changeTab = (tab) => {
    setStatusTab(tab);
    setPage(1);
  };

  const onSubmit = async (formData) => {
    setError("");
    try {
      await createRequest.mutateAsync({
        project: formData.project,
        customer: { name: formData.name, phone: formData.phone, email: formData.email },
        source: formData.source,
        priority: formData.priority,
      });
      reset();
      setShowForm(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit the request.");
    }
  };

  const handleAccept = async (id) => {
    setError("");
    try {
      await acceptRequest.mutateAsync(id);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not accept the request.");
    }
  };

  const handleReject = async (id) => {
    await rejectRequest.mutateAsync({ id, reason: rejectReason || undefined });
    setRejectingId(null);
    setRejectReason("");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Pipeline</p>
          <h1 className="font-display text-2xl text-ink-900">Lead Requests</h1>
          <p className="text-sm text-ink-400 mt-1">
            {isAgency
              ? "Requests your agents have submitted — accept to create and assign the lead, or remove."
              : "Submit a lead for approval — it's assigned to you automatically once accepted."}
          </p>
        </div>
        {!isAgency && (
          <Button className="!w-auto px-4" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Request lead"}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Project</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm"
              {...register("project", { required: true })}
            >
              <option value="">Select project</option>
              {projectsData?.data?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
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
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Priority</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("priority")}>
              <option>Hot</option>
              <option>Warm</option>
              <option>Cold</option>
            </select>
          </div>
          <div className="col-span-2">
            <Button type="submit" loading={createRequest.isPending} className="!w-auto px-6">
              Submit for approval
            </Button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => changeTab(tab)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium border ${
              statusTab === tab
                ? "bg-navy-900 text-white border-navy-900"
                : "text-ink-600 border-gray-200 hover:bg-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Project</th>
              {isAgency && <th className="text-left px-5 py-3">Requested by</th>}
              <th className="text-left px-5 py-3">Priority</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Submitted</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-ink-400">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-ink-400">
                  No requests found.
                </td>
              </tr>
            )}
            {data?.data?.map((r) => (
              <tr key={r._id} className="border-t border-gray-100">
                <td className="px-5 py-3">
                  <p className="font-medium text-ink-900">{r.customer.name}</p>
                  <p className="text-xs text-ink-400">{r.customer.phone}</p>
                </td>
                <td className="px-5 py-3 text-ink-600">{r.project?.name || "—"}</td>
                {isAgency && <td className="px-5 py-3 text-ink-600">{r.requestedBy?.name || "—"}</td>}
                <td className="px-5 py-3 text-ink-600">{r.priority}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                  {r.status === "Rejected" && r.rejectionReason && (
                    <p className="text-xs text-ink-400 mt-1">{r.rejectionReason}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  {isAgency && r.status === "Pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="!w-auto px-3 !py-1.5 text-xs"
                        loading={acceptRequest.isPending}
                        onClick={() => handleAccept(r._id)}
                      >
                        Accept
                      </Button>
                      {rejectingId === r._id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            autoFocus
                            placeholder="Reason (optional)"
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs w-32"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            className="!w-auto px-3 !py-1.5 text-xs"
                            loading={rejectRequest.isPending}
                            onClick={() => handleReject(r._id)}
                          >
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="!w-auto px-3 !py-1.5 text-xs"
                          onClick={() => setRejectingId(r._id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                  {!isAgency && r.status === "Pending" && (
                    <Button
                      variant="ghost"
                      className="!w-auto px-3 !py-1.5 text-xs"
                      loading={cancelRequest.isPending}
                      onClick={() => cancelRequest.mutate(r._id)}
                    >
                      Withdraw
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>
    </AppLayout>
  );
};

export default LeadRequests;