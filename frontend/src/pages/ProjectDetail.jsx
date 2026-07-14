import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useProject, useUpdateUnitPrice, useBulkAddUnits } from "../api/projects";
import { useLeads } from "../api/leads";

const ProjectDetail = () => {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const { data: leadsData } = useLeads({ project: id });
  const updateUnitPrice = useUpdateUnitPrice(id);
  const bulkAddUnits = useBulkAddUnits(id);
  const [editingUnit, setEditingUnit] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [showAddUnits, setShowAddUnits] = useState(false);
  const [addCount, setAddCount] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addPrefix, setAddPrefix] = useState("");

  if (isLoading || !project) return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;

  const margin = (project.basePrice || 0) - (project.purchasePrice || 0);

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Project</p>
      <h1 className="font-display text-2xl text-ink-900 mb-1">{project.name}</h1>
      <p className="text-sm text-ink-600 mb-6">{project.location || "No location set"}</p>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Developer</p>
          <p className="text-sm font-medium text-ink-900">{project.developer?.name || "—"}</p>
          <p className="text-xs text-ink-400">{project.developer?.contactPerson}</p>
          <p className="text-xs text-ink-400">{project.developer?.phone} {project.developer?.email}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Pricing (per unit)</p>
          <p className="text-sm text-ink-600">Purchase: <span className="font-medium text-ink-900">₹{(project.purchasePrice || 0).toLocaleString()}</span></p>
          <p className="text-sm text-ink-600">Selling: <span className="font-medium text-ink-900">₹{(project.basePrice || 0).toLocaleString()}</span></p>
          <p className="text-xs text-gold-600 mt-1">Margin: ₹{margin.toLocaleString()} / unit</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Inventory</p>
          <p className="text-sm text-ink-600">Total: <span className="font-medium text-ink-900">{project.totalUnits}</span></p>
          <p className="text-sm text-ink-600">Available: <span className="font-medium text-ink-900">{project.availableUnits}</span></p>
          <p className="text-sm text-ink-600">Sold: <span className="font-medium text-ink-900">{project.totalUnits - project.availableUnits}</span></p>
        </div>
      </div>

      {project.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Description</p>
          <p className="text-sm text-ink-600">{project.description}</p>
        </div>
      )}

      {project.units?.length === 0 && project.totalUnits > 0 && (
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-5 mb-6">
          <p className="text-sm text-ink-900 font-medium mb-1">Inventory needs syncing</p>
          <p className="text-sm text-ink-600 mb-3">
            This project shows {project.totalUnits} units in its counters, but no individual unit
            records exist yet (it was likely created before per-unit pricing was added). Generate
            them now, all at the current selling price:
          </p>
          <button
            onClick={() => bulkAddUnits.mutate({ count: project.totalUnits, price: project.basePrice })}
            disabled={bulkAddUnits.isPending}
            className="bg-navy-900 hover:bg-navy-800 text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {bulkAddUnits.isPending ? "Generating..." : `Generate ${project.totalUnits} units at ₹${(project.basePrice || 0).toLocaleString()} each`}
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <p className="text-xs uppercase tracking-wide text-ink-400">
            Units ({project.units?.length || 0}) — each unit can carry its own price
          </p>
          <button onClick={() => setShowAddUnits((s) => !s)} className="text-xs text-navy-900 font-medium hover:text-gold-600">
            {showAddUnits ? "Cancel" : "+ Add units"}
          </button>
        </div>

        {showAddUnits && (
          <div className="px-6 pb-4 grid grid-cols-4 gap-2">
            <input placeholder="How many" type="number" className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={addCount} onChange={(e) => setAddCount(e.target.value)} />
            <input placeholder="Price for this batch" type="number" className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={addPrice} onChange={(e) => setAddPrice(e.target.value)} />
            <input placeholder="Prefix (optional, e.g. TWR-A)" className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={addPrefix} onChange={(e) => setAddPrefix(e.target.value)} />
            <button
              onClick={() => {
                bulkAddUnits.mutate({ count: Number(addCount), price: Number(addPrice), prefix: addPrefix || undefined });
                setShowAddUnits(false); setAddCount(""); setAddPrice(""); setAddPrefix("");
              }}
              disabled={!addCount || !addPrice}
              className="bg-navy-900 hover:bg-navy-800 text-white rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Add batch
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-2">Unit</th>
              <th className="text-left px-6 py-2">Price</th>
              <th className="text-left px-6 py-2">Status</th>
              <th className="text-right px-6 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!project.units || project.units.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-ink-400">No units yet — use the banner above or "+ Add units".</td></tr>
            )}
            {project.units?.map((u) => (
              <tr key={u._id} className="border-t border-gray-100">
                <td className="px-6 py-3 font-medium text-ink-900">{u.unitNumber}</td>
                <td className="px-6 py-3 text-ink-600">
                  {editingUnit === u._id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                      />
                      <button
                        onClick={() => { updateUnitPrice.mutate({ unitId: u._id, price: Number(newPrice) }); setEditingUnit(null); }}
                        className="text-xs text-navy-900 font-medium hover:text-gold-600"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    `₹${(u.price || 0).toLocaleString()}`
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.status === "Available" ? "bg-green-50 text-green-600" : u.status === "Reserved" ? "bg-gold-500/10 text-gold-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {editingUnit !== u._id && u.status === "Available" && (
                    <button onClick={() => { setEditingUnit(u._id); setNewPrice(u.price); }} className="text-xs text-navy-900 hover:text-gold-600">
                      Edit price
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p className="text-xs uppercase tracking-wide text-ink-400 px-6 pt-5 pb-3">Leads on this project</p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-2">Customer</th>
              <th className="text-left px-6 py-2">Agent</th>
              <th className="text-left px-6 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {leadsData?.data?.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-ink-400">No leads on this project yet.</td></tr>
            )}
            {leadsData?.data?.map((l) => (
              <tr key={l._id} className="border-t border-gray-100">
                <td className="px-6 py-3">
                  <Link to={`/leads/${l._id}`} className="font-medium text-ink-900 hover:text-gold-600">
                    {l.customer?.name || "Unknown Customer"}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-600">{l.assignedAgent?.name || "Unassigned"}</td>
                <td className="px-6 py-3 text-ink-600">{l.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;