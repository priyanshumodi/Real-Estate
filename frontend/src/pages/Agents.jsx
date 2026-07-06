import { useState } from "react";
import { useForm } from "react-hook-form";
import AppLayout from "../components/layout/AppLayout";
import { useAgentsList, useCreateAgent, useUpdateAgent, useDeleteAgent } from "../api/agents";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";

const Agents = () => {
  const { data: agents, isLoading } = useAgentsList();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const openCreate = () => {
    reset({ name: "", email: "", phone: "", password: "", allowedIP: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (agent) => {
    setValue("name", agent.name);
    setValue("phone", agent.phone || "");
    setValue("allowedIP", agent.allowedIP || "");
    setEditingId(agent._id);
    setShowForm(true);
  };

  const onSubmit = async (formData) => {
    if (editingId) {
      await updateAgent.mutateAsync({ id: editingId, name: formData.name, phone: formData.phone, allowedIP: formData.allowedIP });
    } else {
      await createAgent.mutateAsync(formData);
    }
    setShowForm(false);
    reset();
  };

  const handleDelete = (id) => {
    if (confirm("Remove this agent? They will no longer be able to log in.")) {
      deleteAgent.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Team</p>
          <h1 className="font-display text-2xl text-ink-900">Agents</h1>
        </div>
        <Button className="!w-auto px-4" onClick={showForm ? () => setShowForm(false) : openCreate}>
          {showForm ? "Cancel" : "+ New agent"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <TextField label="Name" {...register("name", { required: true })} />
          <TextField label="Email" type="email" disabled={!!editingId} {...register("email", { required: !editingId })} />
          <TextField label="Phone" {...register("phone")} />
          {!editingId && <TextField label="Password" type="password" {...register("password", { required: true })} />}
          <TextField label="Allowed office IP (optional)" placeholder="e.g. 103.21.244.10" {...register("allowedIP")} />
          <div className="col-span-2">
            <Button type="submit" loading={createAgent.isPending || updateAgent.isPending} className="!w-auto px-6">
              {editingId ? "Save changes" : "Create agent"}
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>}
            {!isLoading && agents?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">No agents yet.</td></tr>
            )}
            {agents?.map((agent) => (
              <tr key={agent._id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-ink-900">{agent.name}</td>
                <td className="px-5 py-3 text-ink-600">{agent.email}</td>
                <td className="px-5 py-3 text-ink-600">{agent.phone || "—"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${agent.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(agent)} className="text-xs text-navy-900 font-medium hover:text-gold-600">Edit</button>
                  <button onClick={() => handleDelete(agent._id)} className="text-xs text-red-500 font-medium hover:text-red-600">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default Agents;