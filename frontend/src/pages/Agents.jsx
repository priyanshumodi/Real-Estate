import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
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
    reset({ name: "", email: "", phone: "+91", allowedIP: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (agent) => {
    setValue("name", agent.name);
    setValue("phone", agent.phone || "");
    setValue("allowedIP", agent.allowedIP || "");
    setValue("commissionRate", agent.commissionRate || 0);
    setEditingId(agent._id);
    setShowForm(true);
  };

  const onSubmit = async (formData) => {
    if (editingId) {
      await updateAgent.mutateAsync({
        id: editingId, name: formData.name, phone: formData.phone,
        allowedIP: formData.allowedIP, commissionRate: Number(formData.commissionRate) || 0,
      });
    } else {
      await createAgent.mutateAsync({ ...formData, commissionRate: Number(formData.commissionRate) || 0 });
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
          <TextField label="Email (optional)" type="email" disabled={!!editingId} {...register("email")} />
          <TextField
            label="Phone (E.164 format — used for OTP login)"
            placeholder="+919876543210"
            disabled={!!editingId}
            {...register("phone", { required: !editingId })}
          />
          <TextField label="Allowed office IP (optional)" placeholder="e.g. 103.21.244.10" {...register("allowedIP")} />
          <TextField label="Commission rate (%)" type="number" step="0.1" placeholder="e.g. 2.5" {...register("commissionRate")} />
          <p className="col-span-2 text-xs text-ink-400 -mt-2">
            No password needed — the agent logs in with a real-time SMS OTP sent to this phone number.
          </p>
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
              <th className="text-left px-5 py-3">Commission</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>}
            {!isLoading && agents?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-ink-400">No agents yet.</td></tr>
            )}
            {agents?.map((agent) => (
              <tr key={agent._id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-ink-900">
                  <Link to={`/agents/${agent._id}`} className="hover:text-gold-600">{agent.name}</Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{agent.email}</td>
                <td className="px-5 py-3 text-ink-600">{agent.phone || "—"}</td>
                <td className="px-5 py-3 text-ink-600">{agent.commissionRate || 0}%</td>
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