import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useClients } from "../api/clients";

const Clients = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useClients({ search });

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Customers</p>
      <h1 className="font-display text-2xl text-ink-900 mb-6">Clients</h1>

      <input
        placeholder="Search name or phone..."
        className="rounded-md border border-gray-300 px-3.5 py-2 text-sm w-80 mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Documents</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-5 py-6 text-center text-ink-400">Loading...</td></tr>}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-ink-400">
                No clients yet — they're created automatically when a lead is marked Converted.
              </td></tr>
            )}
            {data?.data?.map((c) => (
              <tr key={c._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link to={`/clients/${c._id}`} className="font-medium text-ink-900 hover:text-gold-600">{c.name}</Link>
                </td>
                <td className="px-5 py-3 text-ink-600">{c.phone}</td>
                <td className="px-5 py-3 text-ink-600">{c.email || "—"}</td>
                <td className="px-5 py-3 text-ink-600">{c.documents?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default Clients;