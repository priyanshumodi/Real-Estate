import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useClient, useAddClientDocument } from "../api/clients";
import Button from "../components/ui/Button";

const ClientDetail = () => {
  const { id } = useParams();
  const { data: client, isLoading } = useClient(id);
  const addDocument = useAddClientDocument(id);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");

  if (isLoading || !client) {
    return <AppLayout><p className="text-ink-400">Loading...</p></AppLayout>;
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-1">Client</p>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl text-ink-900">{client.name}</h1>
        <Link
          to={`/bookings?client=${client._id}`}
          className="text-sm bg-navy-900 hover:bg-navy-800 text-white rounded-md px-4 py-2 font-semibold"
        >
          + Book a unit for this client
        </Link>
      </div>
      <p className="text-sm text-ink-600 mb-6">{client.phone} {client.email ? `· ${client.email}` : ""}</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Add document</p>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
            placeholder="Document name (e.g. Aadhaar Card)"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
            placeholder="File URL (Cloudinary link)"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
          <Button
            loading={addDocument.isPending}
            disabled={!docName || !docUrl}
            onClick={() => {
              addDocument.mutate({ name: docName, url: docUrl });
              setDocName(""); setDocUrl("");
            }}
          >
            Attach document
          </Button>
        </div>

        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs uppercase tracking-wide text-ink-400 mb-4">Documents</p>
          {client.documents?.length === 0 && <p className="text-sm text-ink-400">No documents uploaded yet.</p>}
          <ul className="space-y-2">
            {client.documents?.map((d) => (
              <li key={d._id} className="flex justify-between border-b border-gray-100 pb-2">
                <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-navy-900 hover:text-gold-600 font-medium">
                  {d.name}
                </a>
                <span className="text-xs text-ink-400">{new Date(d.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs uppercase tracking-wide text-ink-400 mt-6 mb-2">Purchase history</p>
          <p className="text-sm text-ink-400">Populates once the Booking Workflow module ships.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClientDetail;