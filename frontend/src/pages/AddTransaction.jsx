import { useState } from "react";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { CATEGORIES } from "../domain/categories";

const INITIAL_FORM = {
  amount: "",
  type: "Expense",
  category: CATEGORIES[0].label,
  date: "",
  note: "",
};

export default function AddTransaction() {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Transaction (mock):", form);
    setForm(INITIAL_FORM);
  };

  return (
    <PageShell title="Add Transaction" maxWidth="max-w-xl">
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option>Expense</option>
              <option>Income</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.label}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Note
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Optional note..."
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Save
          </button>
        </form>
      </Card>
    </PageShell>
  );
}
