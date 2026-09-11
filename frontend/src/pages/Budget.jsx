import { useState } from "react";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { formatCurrency } from "../utils/format";
import { getBudgets } from "../services/finance";
import { CATEGORIES } from "../domain/categories";

function barColor(percent) {
  if (percent >= 100) return "bg-rose-500";
  if (percent >= 80) return "bg-amber-400";
  return "bg-indigo-500";
}

const inputClass =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none";

export default function Budget() {
  // Seeded once from the service; new budgets are added here. They live in
  // component state only — there is no persistence layer yet, so a refresh
  // returns to the service's values.
  const [budgets, setBudgets] = useState(getBudgets);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ categoryId: "", allocated: "" });
  const [error, setError] = useState("");

  // A category can only hold one budget, so already-budgeted ones are excluded.
  const available = CATEGORIES.filter(
    (category) => !budgets.some((b) => b.id === category.id)
  );

  const openModal = () => {
    setForm({ categoryId: available[0]?.id ?? "", allocated: "" });
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const category = CATEGORIES.find((c) => c.id === form.categoryId);
    if (!category) {
      setError("Pick a category.");
      return;
    }

    const allocated = Number(form.allocated);
    if (!Number.isFinite(allocated) || allocated <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }

    setBudgets((prev) => [
      ...prev,
      { id: category.id, category: category.label, spent: 0, allocated },
    ]);
    setShowModal(false);
  };

  const newBudgetButton = (
    <button
      onClick={openModal}
      disabled={available.length === 0}
      className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      + New Budget
    </button>
  );

  return (
    <PageShell title="Budget Tracking" maxWidth="max-w-4xl" action={newBudgetButton}>
      <div className="mt-6 space-y-4">
        {budgets.map((b) => {
          const percent = Math.round((b.spent / b.allocated) * 100);
          return (
            <Card key={b.id}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  {b.category}
                </h2>
                <span className="text-sm text-slate-400">
                  {formatCurrency(b.spent)} / {formatCurrency(b.allocated)}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${barColor(percent)}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{percent}% used</p>
            </Card>
          );
        })}
      </div>

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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Category
                </label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {available.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Monthly limit
                </label>
                <input
                  type="number"
                  name="allocated"
                  value={form.allocated}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
