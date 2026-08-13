import { useParams } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useBooking, useUpdateBookingStatus, usePayInstallment } from "../api/bookings";
import Button from "../components/ui/Button";

const BookingDetail = () => {
  const { id } = useParams();
  const { data, isLoading } = useBooking(id);
  const updateStatus = useUpdateBookingStatus(id);
  const payInstallment = usePayInstallment(id);
  const [payingId, setPayingId] = useState(null);
  const [amount, setAmount] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [statusError, setStatusError] = useState("");

  if (isLoading || !data) return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;

  const booking = data.data;
  const nextStatuses = data.meta?.nextStatuses || [];
  const forwardStatuses = nextStatuses.filter((s) => s !== "Cancelled");
  const canCancel = nextStatuses.includes("Cancelled");
  // A completed sale being cancelled is a distinct real-world event (buyer default,
  // mutual cancellation found post-registration) from cancelling an in-progress deal —
  // label it accordingly so it doesn't read like an accidental undo.
  const cancelLabel = booking.status === "Completed" ? "Release unit for resale" : "Cancel booking (releases unit)";

  const changeStatus = async (status) => {
    setStatusError("");
    try {
      await updateStatus.mutateAsync(status);
      setConfirmingCancel(false);
    } catch (err) {
      setStatusError(err?.response?.data?.message || "Could not update status.");
    }
  };

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Booking</p>
      <h1 className="font-display text-2xl text-ink-900 mb-1">{booking.client?.name} — Unit {booking.unitNumber}</h1>
      <p className="text-sm text-ink-600 mb-6">{booking.project?.name} · ₹{booking.totalAmount.toLocaleString()} total</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">Current status</p>
            <p className="text-sm font-semibold text-ink-900 mb-4">{booking.status}</p>

            {statusError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">{statusError}</p>
            )}

            {/* Only the statuses the backend will actually accept next — no more
                jumping straight to Completed or hopping back into the middle of
                the pipeline. */}
            {forwardStatuses.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-xs uppercase tracking-wide text-ink-400">Move forward</p>
                {forwardStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={updateStatus.isPending}
                    className="w-full text-left text-sm px-3 py-2 rounded-md border border-gray-200 text-ink-600 hover:bg-gray-50"
                  >
                    Advance to {s}
                  </button>
                ))}
              </div>
            )}

            {nextStatuses.length === 0 && (
              <p className="text-xs text-ink-400">This booking is cancelled — no further changes possible.</p>
            )}

            {canCancel && (
              confirmingCancel ? (
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <p className="text-xs text-ink-600 mb-2">
                    {booking.status === "Completed"
                      ? "This unwinds a completed sale and puts the unit back in inventory as Available. You can then edit its price on the Project page before rebooking it."
                      : "This releases the unit back to Available and voids any unpaid installments."}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" loading={updateStatus.isPending} className="!w-auto px-3 !py-1.5 text-xs" onClick={() => changeStatus("Cancelled")}>
                      Confirm — {cancelLabel}
                    </Button>
                    <button onClick={() => setConfirmingCancel(false)} className="text-xs text-ink-400 hover:text-ink-600 px-2">
                      Keep as is
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingCancel(true)}
                  className="w-full mt-1 text-xs text-red-500 hover:text-red-600 text-left"
                >
                  {cancelLabel}
                </button>
              )
            )}
          </div>
        </div>

        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Installments</p>
          {booking.installments.length === 0 && (
            <p className="text-sm text-ink-400">Full payment plan — no installments to track.</p>
          )}
          <ul className="space-y-3">
            {booking.installments.map((inst) => (
              <li key={inst._id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {inst.milestone ? `${inst.milestone} — ` : ""}₹{inst.amount.toLocaleString()}
                    {inst.percent != null && <span className="text-ink-400 font-normal"> ({inst.percent}%)</span>}
                  </p>
                  <p className="text-xs text-ink-400">Due {new Date(inst.dueDate).toLocaleDateString()}</p>
                </div>
                {inst.status === "Paid" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Paid</span>
                ) : inst.status === "Void" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-400 font-medium">Voided</span>
                ) : payingId === inst._id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button
                      className="!w-auto px-3 py-1.5"
                      loading={payInstallment.isPending}
                      onClick={() => {
                        payInstallment.mutate({ installmentId: inst._id, paidAmount: Number(amount) });
                        setPayingId(null); setAmount("");
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                ) : (
                  <button onClick={() => setPayingId(inst._id)} className="text-xs text-navy-900 font-medium hover:text-gold-600">
                    Record payment
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default BookingDetail;