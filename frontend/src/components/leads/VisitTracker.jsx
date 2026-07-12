import { useState } from "react";
import { useAddVisitStep } from "../../api/visits";

const VISIT_STEPS = [
  "Visit Assigned", "Agent Accepted", "Journey Started", "Client Picked", "Travelling",
  "Reached Project", "Property Tour Started", "Property Tour Completed", "Discussion",
  "Feedback Submitted", "Next Follow-up Scheduled",
];

// Renders like a courier/shipment tracker: a vertical line, filled dots for done steps,
// a pulsing dot for the current step, hollow dots for what's ahead.
const VisitTracker = ({ leadId, visitTimeline = [] }) => {
  const addVisitStep = useAddVisitStep(leadId);
  const [remarks, setRemarks] = useState("");
  const [useGps, setUseGps] = useState(false);

  const doneMap = {};
  visitTimeline.forEach((v) => { doneMap[v.step] = v; });
  const lastDoneIndex = VISIT_STEPS.reduce((acc, s, i) => (doneMap[s] ? i : acc), -1);
  const nextStep = VISIT_STEPS[lastDoneIndex + 1];

  const handleAdvance = () => {
    const payload = { step: nextStep, remarks };
    const submit = (coords) => {
      if (coords) payload.gpsLocation = { lat: coords.latitude, lng: coords.longitude };
      addVisitStep.mutate(payload);
      setRemarks("");
    };
    if (useGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => submit(pos.coords), () => submit(null));
    } else {
      submit(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <p className="text-xs uppercase tracking-wide text-ink-400 mb-5">Visit tracker</p>

      <ol className="relative border-l-2 border-gray-200 ml-2 mb-6">
        {VISIT_STEPS.map((step, i) => {
          const entry = doneMap[step];
          const isDone = !!entry;
          const isCurrent = i === lastDoneIndex + 1;
          return (
            <li key={step} className="mb-5 ml-5 last:mb-0">
              <span
                className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                  isDone ? "bg-gold-500" : isCurrent ? "bg-navy-900 animate-pulse" : "bg-gray-200"
                }`}
              />
              <p className={`text-sm font-medium ${isDone ? "text-ink-900" : isCurrent ? "text-navy-900" : "text-ink-400"}`}>
                {step}
              </p>
              {entry && (
                <>
                  {entry.remarks && <p className="text-sm text-ink-600">{entry.remarks}</p>}
                  {entry.gpsLocation?.lat && (
                    <p className="text-xs text-ink-400">GPS {entry.gpsLocation.lat.toFixed(4)}, {entry.gpsLocation.lng.toFixed(4)}</p>
                  )}
                  <p className="text-xs text-ink-400">{new Date(entry.createdAt).toLocaleString()}</p>
                </>
              )}
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">
            Mark: <span className="text-navy-900 font-semibold">{nextStep}</span>
          </p>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-ink-600 mb-2">
            <input type="checkbox" checked={useGps} onChange={(e) => setUseGps(e.target.checked)} />
            Attach current GPS location
          </label>
          <button
            onClick={handleAdvance}
            disabled={addVisitStep.isPending}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50"
          >
            {addVisitStep.isPending ? "Saving..." : `Confirm: ${nextStep}`}
          </button>
        </div>
      )}
      {!nextStep && <p className="text-sm text-green-600 font-medium">Visit fully tracked ✓</p>}
    </div>
  );
};

export default VisitTracker;