import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useBookings, useCreateBooking } from "../api/bookings";
import { useProjects } from "../api/projects";
import { useClients } from "../api/clients";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";

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
  const { data, isLoading } = useBookings();
  const { data: projectsData } = useProjects();
  const { data: clientsData } = useClients();
  const createBooking = useCreateBooking();
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (preselectedClient) setValue("client", preselectedClient);
  }, [preselectedClient, setValue]);

  const preselectedClientObj = clientsData?.data?.find((c) => c._id === preselectedClient);

  const onSubmit = async (formData) => {
    await createBooking.mutateAsync({
      ...formData,
      totalAmount: Number(formData.totalAmount),
      advanceAmount: Number(formData.advanceAmount || 0),
    });
    reset();
    setShowForm(false);
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
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Project</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("project", { required: true })}>
              <option value="">Select project</option>
              {projectsData?.data?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.availableUnits} left)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Client</label>
            {preselectedClientObj ? (
              <>
                <input
                  disabled
                  value={`${preselectedClientObj.name} · ${preselectedClientObj.phone}`}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-ink-600"
                />
                <input type="hidden" {...register("client", { required: true })} />
              </>
            ) : (
              <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("client", { required: true })}>
                <option value="">Select client</option>
                {clientsData?.data?.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
              </select>
            )}
          </div>
          <TextField label="Unit number" {...register("unitNumber", { required: true })} />
          <TextField label="Total amount" type="number" {...register("totalAmount", { required: true })} />
          <TextField label="Advance amount" type="number" {...register("advanceAmount")} />
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Payment plan</label>
            <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("planType")}>
              <option>Full Payment</option><option>2 Installments</option>
              <option>4 Installments</option><option>6 Installments</option>
            </select>
          </div>
          <div className="col-span-2">
            <Button type="submit" loading={createBooking.isPending} className="!w-auto px-6">Reserve unit</Button>
          </div>
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
      </div>
    </AppLayout>
  );
};

export default Bookings;