import { useEffect, useState } from "react";
import { fieldClass, labelClass, primaryButton } from "./ui/States";
import { todayLocal } from "../utils/dates";

const blank = (type = "expense") => ({ type, amount: "", categoryId: "", date: todayLocal(), description: "" });

// Shared by Add Transaction and the edit dialog. `onSubmit` receives the API
// payload and may throw an ApiError, whose message is shown above the button.
export default function TransactionForm({ categories, initial, submitLabel = "Save", onSubmit, onSaved }) {
  const [form, setForm] = useState(() => (initial ? toForm(initial) : blank()));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const options = categories.filter((c) => c.type === form.type);

  // Keep the selected category valid for the chosen type.
  useEffect(() => {
    if (!options.some((c) => String(c.id) === String(form.categoryId))) {
      setForm((f) => ({ ...f, categoryId: options[0] ? String(options[0].id) : "" }));
    }
  }, [form.type, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (form.amount === "" || !Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than 0.");
    if (!form.categoryId) return setError("Pick a category.");
    if (!form.date) return setError("Pick a date.");
    setBusy(true);
    try {
      await onSubmit({ type: form.type, amount, categoryId: Number(form.categoryId), date: form.date, description: form.description });
      if (!initial) setForm(blank(form.type));
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="tx-type" className={labelClass}>Type</label>
        <select id="tx-type" name="type" value={form.type} onChange={change} className={fieldClass}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <div>
        <label htmlFor="tx-amount" className={labelClass}>Amount</label>
        <input id="tx-amount" type="number" name="amount" step="0.01" min="0" value={form.amount} onChange={change} placeholder="0.00" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="tx-category" className={labelClass}>Category</label>
        <select id="tx-category" name="categoryId" value={form.categoryId} onChange={change} className={fieldClass}>
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="tx-date" className={labelClass}>Date</label>
        <input id="tx-date" type="date" name="date" value={form.date} onChange={change} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="tx-description" className={labelClass}>Description</label>
        <textarea id="tx-description" name="description" value={form.description} onChange={change} rows={3} maxLength={200} placeholder="Optional description..." className={`${fieldClass} resize-none`} />
      </div>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <button type="submit" disabled={busy} className={`w-full ${primaryButton}`}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

const toForm = (t) => ({ type: t.type, amount: String(t.amount), categoryId: String(t.categoryId), date: t.date, description: t.description });
