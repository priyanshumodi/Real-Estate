import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useAgentPerformance } from "../api/agents";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">{label}</p>
    <p className="font-display text-2xl text-ink-900">{value}</p>
    {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
  </div>
);

const AgentDetail = () => {
  const { id } = useParams();
  const { data, isLoading } = useAgentPerformance(id);

  if (isLoading || !data) return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;

  const { agent, leads, communications, followUps, visits, bookings } = data;
  const statusChartData = Object.entries(leads.byStatus).map(([key, count]) => ({ key, count }));
  const responseTotal = communications.total || 1;

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Agent</p>
      <h1 className="font-display text-2xl text-ink-900 mb-1">{agent.name}</h1>
      <p className="text-sm text-ink-600 mb-6">
        {agent.phone} {agent.email ? `· ${agent.email}` : ""} · Commission rate: {agent.commissionRate || 0}%
        · <span className={agent.isActive ? "text-green-600" : "text-red-500"}>{agent.isActive ? "Active" : "Inactive"}</span>
      </p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Leads assigned" value={leads.total} />
        <StatCard label="Converted" value={leads.converted} sub={`${leads.conversionRate}% conversion`} />
        <StatCard label="Lost" value={leads.lost} />
        <StatCard label="Visits fully tracked" value={visits.leadsFullyTracked} sub={`${visits.totalSteps} total visit steps logged`} />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Follow-ups completed" value={followUps.completed} sub={`${followUps.pending} pending`} />
        <StatCard label="Follow-ups overdue" value={followUps.overdue} />
        <StatCard label="Bookings (from their leads)" value={bookings.total} sub={`${bookings.completed} completed`} />
        <StatCard label="Commission earned" value={`₹${bookings.commissionEarned.toLocaleString()}`} sub={`on ₹${bookings.completedRevenue.toLocaleString()} completed revenue`} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Lead funnel by status</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="key" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0F1B2D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">
            Communication quality ({communications.total} logged)
          </p>
          <div className="space-y-3 mt-6">
            {["Positive", "Neutral", "Negative"].map((r) => {
              const count = communications.byResponse[r] || 0;
              const pct = Math.round((count / responseTotal) * 100);
              const color = r === "Positive" ? "bg-green-500" : r === "Negative" ? "bg-red-500" : "bg-gray-400";
              return (
                <div key={r}>
                  <div className="flex justify-between text-xs text-ink-600 mb-1">
                    <span>{r}</span><span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p className="text-xs uppercase tracking-wide text-ink-400 px-6 pt-5 pb-3">Recent leads</p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-2">Customer</th>
              <th className="text-left px-6 py-2">Priority</th>
              <th className="text-left px-6 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.recent.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-ink-400">No leads assigned yet.</td></tr>
            )}
            {leads.recent.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="px-6 py-3">
                  <Link to={`/leads/${l.id}`} className="font-medium text-ink-900 hover:text-gold-600">{l.name}</Link>
                </td>
                <td className="px-6 py-3 text-ink-600">{l.priority}</td>
                <td className="px-6 py-3 text-ink-600">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default AgentDetail;