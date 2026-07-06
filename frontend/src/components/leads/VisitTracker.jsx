import { useState } from "react";
import { useAddVisitStep } from "../../api/visits";

const VISIT_STEPS = [
  "Visit Assigned", "Agent Accepted", "Journey Started", "Client Picked", "Travelling",
  "Reached Project", "Property Tour Started", "Property Tour Completed", "Discussion",
  "Feedback Submitted", "Next Follow-up Scheduled",
];

// Drop this into your Lead detail page: <VisitTracker leadId={lead._id} visitTimeline={lead.visitTimeline} />
const VisitTracker = ({ leadId, visitTimeline = [] }) => {
  const addVisitStep = useAddVisitStep(leadId);
  const [step, setStep] = useState(VISIT_STEPS[0]);
  const [remarks, setRemarks] = useState("");
  const [useGps, setUseGps] = useState(false);

  const completedSteps = new Set(visitTimeline.map((v) => v.step));

  const handleAddStep = () => {
    const payload = { step, remarks };

    const submit = (coords) => {
      if (coords) payload.gpsLocation = { lat: coords.latitude, lng: coords.longitude };
      addVisitStep.mutate(payload);
      setRemarks("");
    };

    if (useGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submit(pos.coords),
        () => submit(null) // if permission denied, still log the step without GPS
      );
    } else {
      submit(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Visit tracker</p>

      {/* Stepper */}
      <ol className="flex flex-wrap gap-2 mb-6">
        {VISIT_STEPS.map((s) => {
          const done = completedSteps.has(s);
          return (
            <li
              key={s}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                done
                  ? "bg-gold-500/10 border-gold-500/40 text-gold-600 font-medium"
                  : "bg-gray-50 border-gray-200 text-ink-400"
              }`}
            >
              {s}
            </li>
          );
        })}
      </ol>

      {/* Add new step */}
      <div className="grid grid-cols-1 gap-2 mb-6">
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={step}
          onChange={(e) => setStep(e.target.value)}
        >
          {VISIT_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <textarea
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-ink-600">
          <input type="checkbox" checked={useGps} onChange={(e) => setUseGps(e.target.checked)} />
          Attach current GPS location
        </label>
        <button
          onClick={handleAddStep}
          disabled={addVisitStep.isPending}
          className="bg-navy-900 hover:bg-navy-800 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50"
        >
          {addVisitStep.isPending ? "Saving..." : "Record step"}
        </button>
      </div>

      {/* History */}
      <ul className="space-y-3">
        {[...visitTimeline].reverse().map((v) => (
          <li key={v._id} className="border-l-2 border-gold-500/40 pl-3">
            <p className="text-sm font-medium text-ink-900">{v.step}</p>
            {v.remarks && <p className="text-sm text-ink-600">{v.remarks}</p>}
            {v.gpsLocation?.lat && (
              <p className="text-xs text-ink-400">GPS: {v.gpsLocation.lat.toFixed(4)}, {v.gpsLocation.lng.toFixed(4)}</p>
            )}
            <p className="text-xs text-ink-400">
              {v.createdBy?.name} · {new Date(v.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VisitTracker;