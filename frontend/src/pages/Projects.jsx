import { useState } from "react";
import { useForm } from "react-hook-form";
import AppLayout from "../components/layout/AppLayout";
import { useProjects, useCreateProject } from "../api/projects";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";

const Projects = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (formData) => {
    await createProject.mutateAsync(formData);
    reset();
    setShowForm(false);
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4"
        >
          <TextField label="Project name" {...register("name", { required: true })} />
          <TextField label="Developer name" {...register("developerName")} />
          <TextField label="Location" {...register("location")} />
          <TextField label="Total units" type="number" {...register("totalUnits")} />
          <TextField label="Base price (per unit)" type="number" {...register("basePrice")} />
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
              <th className="text-left px-5 py-3">Location</th>
              <th className="text-left px-5 py-3">Developer</th>
              <th className="text-left px-5 py-3">Units</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">No projects yet.</td></tr>
            )}
            {data?.data?.map((p) => (
              <tr key={p._id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-ink-900">{p.name}</td>
                <td className="px-5 py-3 text-ink-600">{p.location || "—"}</td>
                <td className="px-5 py-3 text-ink-600">{p.developerName || "—"}</td>
                <td className="px-5 py-3 text-ink-600">{p.availableUnits}/{p.totalUnits}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gold-500/10 text-gold-600 font-medium">
                    {p.status}
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

export default Projects;