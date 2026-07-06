import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/layout/AppLayout";
import { useDashboardStats } from "../api/stats";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const PALETTE = ["#0F1B2D", "#C9A227", "#4B5566", "#8A93A3", "#1B2C46", "#E4C766"];

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">{label}</p>
    <p className="font-display text-3xl text-ink-900">{value}</p>
    {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Overview</p>
      <h1 className="font-display text-2xl text-ink-900 mb-6">
        Welcome back, {user?.name?.split(" ")[0]}
      </h1>

      {isLoading && <p className="text-ink-400">Loading business overview...</p>}

      {stats && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label={user?.role === "agency" ? "Total leads" : "My leads"} value={stats.totalLeads} />
            <StatCard label="Converted" value={stats.convertedLeads} sub={`${stats.conversionRate}% conversion`} />
            <StatCard label="Lost" value={stats.lostLeads} />
            {user?.role === "agency" ? (
              <StatCard label="Active projects" value={stats.totalProjects} />
            ) : (
              <StatCard label="Conversion rate" value={`${stats.conversionRate}%`} />
            )}
          </div>

          {user?.role === "agency" && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Total clients" value={stats.totalClients} />
              <StatCard label="Agents" value={stats.totalAgents} />
              <StatCard label="Inventory units" value={stats.inventory.totalUnits} />
              <StatCard
                label="Available units"
                value={stats.inventory.availableUnits}
                sub={`${stats.inventory.soldUnits} sold`}
              />
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Lead funnel by status</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.leadsByStatus} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="key" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0F1B2D" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Leads by priority</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.leadsByPriority} dataKey="count" nameKey="key" outerRadius={90} label>
                    {stats.leadsByPriority.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent performance - agency only */}
          {user?.role === "agency" && stats.agentPerformance && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <p className="text-xs uppercase tracking-wide text-ink-400 px-6 pt-5 pb-3">Agent performance</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-6 py-2">Agent</th>
                    <th className="text-left px-6 py-2">Leads assigned</th>
                    <th className="text-left px-6 py-2">Converted</th>
                    <th className="text-left px-6 py-2">Conversion rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.agentPerformance.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-ink-400">No agents yet.</td></tr>
                  )}
                  {stats.agentPerformance.map((a) => (
                    <tr key={a.agentId} className="border-t border-gray-100">
                      <td className="px-6 py-3 font-medium text-ink-900">{a.name}</td>
                      <td className="px-6 py-3 text-ink-600">{a.totalLeads}</td>
                      <td className="px-6 py-3 text-ink-600">{a.converted}</td>
                      <td className="px-6 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gold-500/10 text-gold-600 font-medium">
                          {a.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default Dashboard;