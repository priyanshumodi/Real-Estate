import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useProject } from "../api/projects";
import { useLeads } from "../api/leads";

const ProjectDetail = () => {
    const { id } = useParams();
    const { data: project, isLoading } = useProject(id);
    const { data: leadsData } = useLeads({ project: id });

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
                        {/* We add '|| []' so that if data isn't loaded yet, it safely maps over an empty array instead of crashing */}
                        {(leadsData?.data || []).map((l) => (
                            <tr key={l._id} className="border-t border-gray-100">
                                <td className="px-6 py-3">
                                    <Link to={`/leads/${l._id}`} className="font-medium text-ink-900 hover:text-gold-600">
                                        {l.customer?.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-3 text-ink-600">{l.assignedAgent?.name || "Unassigned"}</td>
                                <td className="px-6 py-3 text-ink-600">{l.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default ProjectDetail;