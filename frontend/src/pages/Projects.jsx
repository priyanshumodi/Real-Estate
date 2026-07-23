import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useProjects, useCreateProject } from "../api/projects";
import { useDevelopers, useCreateDeveloper } from "../api/developers";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import Pagination from "../components/ui/Pagination";

const Projects = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showNewDeveloper, setShowNewDeveloper] = useState(false);
  const [newDevName, setNewDevName] = useState("");
  const [newDevPhone, setNewDevPhone] = useState("");

  const [page, setPage] = useState(1);
  const { data, isLoading } = useProjects({ page, limit: 20 });
  const { data: developers } = useDevelopers();
  const createProject = useCreateProject();
  const createDeveloper = useCreateDeveloper();
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (formData) => {
    await createProject.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  const handleAddDeveloper = async () => {
    if (!newDevName) return;
    const res = await createDeveloper.mutateAsync({ name: newDevName, phone: newDevPhone });
    setValue("developer", res.data._id);
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
          <Button className="!w-auto px-4" onClick={() => setShowForm((s) => !s)}>
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
              <div className="flex gap-2">
                <select className="w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm" {...register("developer", { required: true })}>
                  <option value="">Select developer</option>
                  {developers?.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewDeveloper(true)} className="text-xs text-navy-900 whitespace-nowrap font-medium hover:text-gold-600">
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
                <button type="button" onClick={handleAddDeveloper} className="text-xs bg-navy-900 text-white rounded-md px-3 whitespace-nowrap">
                  Save
                </button>
              </div>
            )}
          </div>

          <TextField label="Location" {...register("location")} />
          <TextField label="Total units" type="number" {...register("totalUnits")} />
          <TextField label="Purchase price (per unit, from developer)" type="number" {...register("purchasePrice")} />
          <TextField label="Selling price (per unit, to customer)" type="number" {...register("basePrice")} />
          <div className="col-span-2">
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