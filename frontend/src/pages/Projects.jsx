import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import SearchableSelect from "../components/ui/SearchableSelect";
import { useProjects, useCreateProject } from "../api/projects";
import { useDevelopers, useCreateDeveloper } from "../api/developers";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import Pagination from "../components/ui/Pagination";

// Mirrors backend/src/utils/paymentPlans.js's DEFAULT_PAYMENT_PLANS — seeded into
// the form as editable starting points, same as what the backend would seed anyway
// if no plans were sent. Keep these two in sync if the defaults ever change.
const STARTER_PLANS = [
  {
    name: "2 Installments",
    isDefault: false,
    stages: [
      { milestone: "On Construction Start", percent: 50 },
      { milestone: "On Possession", percent: 50 },
    ],
  },
  {
    name: "4 Installments",
    isDefault: true,
    stages: [
      { milestone: "On Construction Start", percent: 30 },
      { milestone: "On Slab Completion", percent: 30 },
      { milestone: "On Finishing Work", percent: 20 },
      { milestone: "On Possession", percent: 20 },
    ],
  },
  {
    name: "6 Installments",
    isDefault: false,
    stages: [
      { milestone: "On Construction Start", percent: 20 },
      { milestone: "On Plinth Completion", percent: 15 },
      { milestone: "On Slab Completion (Mid Floor)", percent: 20 },
      { milestone: "On Slab Completion (Top Floor)", percent: 15 },
      { milestone: "On Finishing & Fit-out", percent: 15 },
      { milestone: "On Possession", percent: 15 },
    ],
  },
];

// Repeatable plan/stage editor — plain local state (not react-hook-form) since it's
// a dynamic nested array of arrays. Each plan's stages must sum to 100% (of the
// post-advance remaining amount, same rule as the backend's validatePaymentPlans).
const PaymentPlanBuilder = ({ plans, setPlans }) => {
  const updatePlan = (i, patch) =>
    setPlans(plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const updateStage = (i, si, patch) =>
    updatePlan(i, {
      stages: plans[i].stages.map((s, sidx) => (sidx === si ? { ...s, ...patch } : s)),
    });

  const addStage = (i) =>
    updatePlan(i, {
      stages: [...plans[i].stages, { milestone: "", percent: 0 }],
    });

  const removeStage = (i, si) =>
    updatePlan(i, {
      stages: plans[i].stages.filter((_, sidx) => sidx !== si),
    });

  const addPlan = () =>
    setPlans([
      ...plans,
      {
        name: `Plan ${plans.length + 1}`,
        isDefault: plans.length === 0,
        stages: [{ milestone: "", percent: 100 }],
      },
    ]);

  const removePlan = (i) => setPlans(plans.filter((_, idx) => idx !== i));
  const setDefault = (i) => setPlans(plans.map((p, idx) => ({ ...p, isDefault: idx === i })));

  return (
    <div className="col-span-2 border-t border-gray-100 pt-4 mt-1">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-ink-900">
          Payment plans{" "}
          <span className="text-ink-400 font-normal">
            (post-advance milestones — each plan must total 100%)
          </span>
        </label>
        <button
          type="button"
          onClick={addPlan}
          className="text-xs text-navy-900 font-medium hover:text-gold-600"
        >
          + Add plan
        </button>
      </div>
      <div className="space-y-3">
        {plans.map((plan, i) => {
          const total = plan.stages.reduce(
            (s, st) => s + (Number(st.percent) || 0),
            0
          );
          return (
            <div key={i} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm font-medium"
                  value={plan.name}
                  onChange={(e) => updatePlan(i, { name: e.target.value })}
                />
                <label className="flex items-center gap-1 text-xs text-ink-600 whitespace-nowrap">
                  <input
                    type="radio"
                    name="defaultPlan"
                    checked={plan.isDefault}
                    onChange={() => setDefault(i)}
                  />{" "}
                  Default
                </label>
                <button
                  type="button"
                  onClick={() => removePlan(i)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              {plan.stages.map((s, si) => (
                <div key={si} className="flex items-center gap-2 mb-1.5">
                  <input
                    placeholder="Milestone (e.g. On Slab Completion)"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                    value={s.milestone}
                    onChange={(e) =>
                      updateStage(i, si, { milestone: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                    value={s.percent}
                    onChange={(e) =>
                      updateStage(i, si, { percent: e.target.value })
                    }
                  />
                  <span className="text-xs text-ink-400">%</span>
                  <button
                    type="button"
                    onClick={() => removeStage(i, si)}
                    className="text-xs text-ink-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={() => addStage(i)}
                  className="text-xs text-navy-900 hover:text-gold-600"
                >
                  + Add stage
                </button>
                <span
                  className={`text-xs font-medium ${
                    total === 100 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {total}% of remaining
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const Projects = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showNewDeveloper, setShowNewDeveloper] = useState(false);
  const [developerId, setDeveloperId] = useState("");
  const [newDevName, setNewDevName] = useState("");
  const [newDevPhone, setNewDevPhone] = useState("");

  const [plans, setPlans] = useState(() =>
    JSON.parse(JSON.stringify(STARTER_PLANS))
  );
  const [planError, setPlanError] = useState("");

  const [page, setPage] = useState(1);
  const { data, isLoading } = useProjects({ page, limit: 20 });
  const { data: developers } = useDevelopers();
  const createProject = useCreateProject();
  const createDeveloper = useCreateDeveloper();
  const { register, handleSubmit, reset, setValue } = useForm();

  const developerOptions = developers?.map((d) => ({ value: d._id, label: d.name })) || [];

  const openForm = () => {
    setPlans(JSON.parse(JSON.stringify(STARTER_PLANS)));
    setPlanError("");
    setShowForm(true);
  };

  const onSubmit = async (formData) => {
    setPlanError("");
    const bad = plans.find(
      (p) =>
        p.stages.reduce((s, st) => s + (Number(st.percent) || 0), 0) !== 100
    );

    if (bad) {
      setPlanError(`Plan "${bad.name}"'s stages must sum to exactly 100%.`);
      return;
    }

    await createProject.mutateAsync({
      ...formData,
      developer: developerId,
      paymentPlans: plans,
    });
    reset();
    setDeveloperId("");
    setShowForm(false);
  };

  const handleAddDeveloper = async () => {
    if (!newDevName) return;
    const res = await createDeveloper.mutateAsync({ name: newDevName, phone: newDevPhone });
    const newId = res.data._id;
    setValue("developer", newId);
    setDeveloperId(newId);
    setShowNewDeveloper(false);
    setNewDevName("");
    setNewDevPhone("");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Inventory</p>
          <h1 className="font-display text-2xl text-ink-900">Projects</h1>
        </div>
        {user?.role === "agency" && (
          <Button
            className="!w-auto px-4"
            onClick={() => (showForm ? setShowForm(false) : openForm())}
          >
            {showForm ? "Cancel" : "+ New project"}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <TextField label="Project name" {...register("name", { required: true })} />

          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">Developer</label>
            {!showNewDeveloper ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <SearchableSelect
                    options={developerOptions}
                    value={developerId}
                    onChange={(val) => {
                      setDeveloperId(val);
                      setValue("developer", val);
                    }}
                    placeholder="Select developer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewDeveloper(true)}
                  className="text-xs text-navy-900 whitespace-nowrap font-medium hover:text-gold-600 px-1"
                >
                  + New
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  placeholder="Developer name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                />
                <input
                  placeholder="Phone (optional)"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={newDevPhone}
                  onChange={(e) => setNewDevPhone(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddDeveloper}
                  className="text-xs bg-navy-900 text-white rounded-md px-3 whitespace-nowrap"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <TextField label="Location" {...register("location")} />
          <TextField label="Total units" type="number" {...register("totalUnits")} />
          <TextField label="Purchase price (per unit, from developer)" type="number" {...register("purchasePrice")} />
          <TextField label="Selling price (per unit, to customer)" type="number" {...register("basePrice")} />
          <TextField
            label="Minimum booking amount (% of unit price, default 10%)"
            type="number"
            {...register("minBookingPercent")}
          />

          <PaymentPlanBuilder plans={plans} setPlans={setPlans} />

          <div className="col-span-2">
            {planError && (
              <p className="text-sm text-red-500 mb-2">{planError}</p>
            )}
            <Button type="submit" loading={createProject.isPending} className="!w-auto px-6">
              Save project
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Developer</th>
              <th className="text-left px-5 py-3">Location</th>
              <th className="text-left px-5 py-3">Units</th>
              <th className="text-left px-5 py-3">Purchase price</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-400">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-400">
                  No projects yet.
                </td>
              </tr>
            )}
            {data?.data?.map((p) => (
              <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link to={`/projects/${p._id}`} className="font-medium text-ink-900 hover:text-gold-600">
                    {p.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{p.developer?.name || "—"}</td>
                <td className="px-5 py-3 text-ink-600">{p.location || "—"}</td>
                <td className="px-5 py-3 text-ink-600">
                  {p.availableUnits}/{p.totalUnits}
                </td>
                <td className="px-5 py-3 text-ink-600">₹{(p.purchasePrice || 0).toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gold-500/10 text-gold-600 font-medium">
                    {p.status}
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

export default Projects;