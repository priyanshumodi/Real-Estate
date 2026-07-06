import { useParams } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useBooking, useUpdateBookingStatus, usePayInstallment } from "../api/bookings";
import Button from "../components/ui/Button";

const STATUS_FLOW = ["Reserved", "Booked", "Agreement Signed", "Payment Plan Set", "Installments Ongoing", "Completed"];

const BookingDetail = () => {
  const { id } = useParams();
  const { data: booking, isLoading } = useBooking(id);
  const updateStatus = useUpdateBookingStatus(id);
  const payInstallment = usePayInstallment(id);
  const [payingId, setPayingId] = useState(null);
  const [amount, setAmount] = useState("");

  if (isLoading || !booking) return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Booking</p>
      <h1 className="font-display text-2xl text-ink-900 mb-1">{booking.client?.name} — Unit {booking.unitNumber}</h1>
      <p className="text-sm text-ink-600 mb-6">{booking.project?.name} · ₹{booking.totalAmount.toLocaleString()} total</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Move to next stage</p>
            <div className="space-y-2">
              {STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  disabled={updateStatus.isPending}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md border ${
                    booking.status === s ? "bg-navy-900 text-white border-navy-900" : "border-gray-200 text-ink-600 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => updateStatus.mutate("Cancelled")}
              className="w-full mt-3 text-xs text-red-500 hover:text-red-600"
            >
              Cancel booking (releases unit)
            </button>
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
                  <p className="text-sm font-medium text-ink-900">₹{inst.amount.toLocaleString()}</p>
                  <p className="text-xs text-ink-400">Due {new Date(inst.dueDate).toLocaleDateString()}</p>
                </div>
                {inst.status === "Paid" ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Paid</span>
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