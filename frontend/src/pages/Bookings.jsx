import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useBookings, useCreateBooking, previewInstallments } from "../api/bookings";
import { useProjects, useProject } from "../api/projects";
import { useClients } from "../api/clients";
import { useLeads } from "../api/leads";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";

const statusColor = {
  Reserved: "bg-blue-50 text-blue-600",
  Booked: "bg-gold-500/10 text-gold-600",
  "Agreement Signed": "bg-gold-500/10 text-gold-600",
  "Payment Plan Set": "bg-gold-500/10 text-gold-600",
  "Installments Ongoing": "bg-orange-50 text-orange-600",
  Completed: "bg-green-50 text-green-600",
  Cancelled: "bg-red-50 text-red-600",
};

const Bookings = () => {
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get("client");
  const [showForm, setShowForm] = useState(!!preselectedClient);
  const [bookFor, setBookFor] = useState("client"); // "client" | "lead"
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [planType, setPlanType] = useState("Full Payment");
  const [formError, setFormError] = useState("");

  const [page, setPage] = useState(1);
  const { data, isLoading } = useBookings({ page, limit: 20 });
  const { data: projectsData } = useProjects({ limit: 1000 });
  const { data: selectedProject } = useProject(selectedProjectId);
  const { data: clientsData } = useClients({ limit: 1000 });
  const { data: leadsData } = useLeads({ status: "", limit: 1000 });
  const createBooking = useCreateBooking();
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (preselectedClient) setValue("client", preselectedClient);
  }, [preselectedClient, setValue]);

  const preselectedClientObj = clientsData?.data?.find((c) => c._id === preselectedClient);
  const availableUnits = selectedProject?.units?.filter((u) => u.status === "Available") || [];
  const selectedUnit = availableUnits.find((u) => u._id === selectedUnitId);
  const totalAmount = selectedUnit?.price || 0;
  const preview = previewInstallments(totalAmount, Number(advanceAmount) || 0, planType);
  // Leads not yet converted to a client — these are eligible to "book straight from a lead"
  const bookableLeads = leadsData?.data?.filter((l) => l.status !== "Converted") || [];

  const onSubmit = async (formData) => {
    setFormError("");
    if (!selectedUnitId) { setFormError("Pick a unit first."); return; }
    try {
      await createBooking.mutateAsync({
        project: selectedProjectId,
        unitId: selectedUnitId,
        client: bookFor === "client" ? (preselectedClient || formData.client) : undefined,
        lead: bookFor === "lead" ? formData.lead : undefined,
        advanceAmount: Number(advanceAmount) || 0,
        planType,
      });
      reset();
      setSelectedProjectId(""); setSelectedUnitId(""); setAdvanceAmount(0); setPlanType("Full Payment");
      setShowForm(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create booking.");
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Sales</p>
          <h1 className="font-display text-2xl text-ink-900">Bookings</h1>
        </div>
        <Button className="!w-auto px-4" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New booking"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Project</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm"
                value={selectedProjectId}
                onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedUnitId(""); }}
              >
                <option value="">Select project</option>
                {projectsData?.data?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Unit (price is per-unit)</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={!selectedProjectId}
              >
                <option value="">{selectedProjectId ? "Select unit" : "Pick a project first"}</option>
                {availableUnits.map((u) => (
                  <option key={u._id} value={u._id}>{u.unitNumber} — ₹{u.price.toLocaleString()}</option>
                ))}
              </select>
              {selectedProjectId && availableUnits.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No available units left in this project.</p>
              )}
            </div>
          </div>

          {selectedUnit && (
            <div className="bg-gold-500/5 border border-gold-500/20 rounded-md px-4 py-2 text-sm text-ink-900">
              Total amount for this booking: <span className="font-semibold">₹{totalAmount.toLocaleString()}</span> (from unit {selectedUnit.unitNumber})
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Book for</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={bookFor === "client"} onChange={() => setBookFor("client")} disabled={!!preselectedClient} />
                Existing client
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={bookFor === "lead"} onChange={() => setBookFor("lead")} disabled={!!preselectedClient} />
                A lead (auto-converts to client)
              </label>
            </div>
          </div>

          {bookFor === "client" ? (
            preselectedClientObj ? (
              <input disabled value={`${preselectedClientObj.name} · ${preselectedClientObj.phone}`}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-ink-600" />
            ) : (
              <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("client", { required: bookFor === "client" })}>
                <option value="">Select client</option>
                {clientsData?.data?.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
              </select>
            )
          ) : (
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("lead", { required: bookFor === "lead" })}>
              <option value="">Select lead</option>
              {bookableLeads.map((l) => <option key={l._id} value={l._id}>{l.customer.name} · {l.customer.phone} ({l.status})</option>)}
            </select>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Advance amount</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Payment plan</label>
              <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" value={planType} onChange={(e) => setPlanType(e.target.value)}>
                <option>Full Payment</option><option>2 Installments</option>
                <option>4 Installments</option><option>6 Installments</option>
              </select>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="border border-gray-200 rounded-md p-3">
              <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Installment plan preview</p>
              <ul className="text-sm text-ink-600 space-y-1">
                {preview.map((p, i) => (
                  <li key={i}>Installment {i + 1}: ₹{p.amount.toLocaleString()} — due {p.dueDate.toLocaleDateString()}</li>
                ))}
              </ul>
            </div>
          )}

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" loading={createBooking.isPending} className="!w-auto px-6">Reserve unit</Button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Client</th>
              <th className="text-left px-5 py-3">Project / Unit</th>
              <th className="text-left px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-ink-400">No bookings yet.</td></tr>
            )}
            {data?.data?.map((b) => (
              <tr key={b._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link to={`/bookings/${b._id}`} className="font-medium text-ink-900 hover:text-gold-600">
                    {b.client?.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{b.project?.name} · Unit {b.unitNumber}</td>
                <td className="px-5 py-3 text-ink-600">₹{b.totalAmount.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[b.status] || "bg-gray-100 text-gray-600"}`}>
                    {b.status}
                  </span>
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

export default Bookings;