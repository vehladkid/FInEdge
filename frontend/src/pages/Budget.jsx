import { useState } from "react";
import NavBar from "../components/NavBar";

const BUDGETS = [
  { category: "Food & Dining", spent: 340, allocated: 400 },
  { category: "Transport", spent: 180, allocated: 150 },
  { category: "Shopping", spent: 210, allocated: 300 },
  { category: "Utilities", spent: 95, allocated: 150 },
];

function barColor(percent) {
  if (percent >= 100) return "bg-rose-500";
  if (percent >= 80) return "bg-amber-400";
  return "bg-indigo-500";
}

export default function Budget() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Budget Tracking</h1>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            + New Budget
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {BUDGETS.map((b) => {
            const percent = Math.round((b.spent / b.allocated) * 100);
            return (
              <div
                key={b.category}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">
                    {b.category}
                  </h2>
                  <span className="text-sm text-slate-400">
                    ${b.spent} / ${b.allocated}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${barColor(percent)}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{percent}% used</p>
              </div>
            );
          })}
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-950/70"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-white">New Budget</h2>
            <p className="mt-2 text-sm text-slate-400">
              This is a static mock — budget creation isn't wired up yet.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
