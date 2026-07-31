import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [apiMessage, setApiMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((res) => res.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage("Could not reach FinEdge API"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-4xl font-bold">FinEdge</h1>
      <p className="text-slate-400 text-lg">
        AI-powered personal finance & expense tracking
      </p>
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 px-6 py-3 text-sm text-slate-300">
        Backend says: <span className="font-mono">{apiMessage}</span>
      </div>
    </div>
  );
}
