import { useState } from "react";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { Empty, ErrorMessage, fieldClass, labelClass, Loading, primaryButton, secondaryButton } from "../components/ui/States";
import { useAsync } from "../hooks/useAsync";
import { createBudget, deleteBudget, getBudgets, getCategories, updateBudget } from "../services/finance";
import { formatCurrency } from "../utils/format";
import { firstOfMonthLocal } from "../utils/dates";

const BAR = { exceeded: "bg-rose-500", warning: "bg-amber-400", ok: "bg-indigo-500" };
const blank = () => ({ categoryId: "", amount: "", period: "monthly", startDate: firstOfMonthLocal() });

export default function Budget() {
  const budgets = useAsync(() => getBudgets());
  const categories = useAsync(() => getCategories("expense"));
  const [dialog, setDialog] = useState(null); // { id?, form }
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const open = (b) => {
    setError("");
    setDialog(
      b
        ? { id: b.id, form: { categoryId: String(b.categoryId), amount: String(b.amount), period: b.period, startDate: b.startDate } }
        : { form: { ...blank(), categoryId: categories.data?.[0] ? String(categories.data[0].id) : "" } }
    );
  };
  const change = (e) => setDialog((d) => ({ ...d, form: { ...d.form, [e.target.name]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(dialog.form.amount);
    if (!dialog.form.categoryId) return setError("Pick a category.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than 0.");
    setBusy(true);
    setError("");
    try {
      const { categoryId, period, startDate } = dialog.form;
      if (dialog.id) await updateBudget(dialog.id, { amount, period, startDate });
      else await createBudget({ categoryId: Number(categoryId), amount, period, startDate });
      setDialog(null);
      budgets.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b) => {
    setActionError("");
    try {
      await deleteBudget(b.id);
      budgets.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const newBudgetButton = (
    <button onClick={() => open()} disabled={!categories.data?.length} className={primaryButton}>+ New Budget</button>
  );

  return (
    <PageShell title="Budget Tracking" maxWidth="max-w-4xl" action={newBudgetButton}>
      {budgets.loading && <Loading />}
      {budgets.error && <ErrorMessage error={budgets.error} onRetry={budgets.reload} />}
      {actionError && <ErrorMessage error={{ message: actionError }} />}

      {budgets.data && budgets.data.length === 0 && <Empty>No budgets yet. Create one to start tracking your spending.</Empty>}

      <div className="mt-6 space-y-4">
        {(budgets.data ?? []).map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">
                {b.category} <span className="ml-2 text-xs font-normal text-slate-500">{b.period} · {b.startDate} → {b.endDate}</span>
              </h2>
              <span className="text-sm text-slate-400">{formatCurrency(b.spent, 2)} / {formatCurrency(b.amount, 2)}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={Math.min(b.percentUsed, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.category} budget used`}>
              <div className={`h-full rounded-full ${BAR[b.status]}`} style={{ width: `${Math.min(b.percentUsed, 100)}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className={b.exceeded ? "text-rose-400" : "text-slate-500"}>
                {b.percentUsed}% used · {b.exceeded ? `${formatCurrency(-b.remaining, 2)} over budget` : `${formatCurrency(b.remaining, 2)} remaining`}
              </p>
              <span>
                <button onClick={() => open(b)} aria-label={`Edit ${b.category} budget`} className="mr-3 text-indigo-400 hover:text-white">Edit</button>
                <button onClick={() => remove(b)} aria-label={`Delete ${b.category} budget`} className="text-rose-400 hover:text-white">Delete</button>
              </span>
            </div>
          </Card>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={dialog.id ? "Edit budget" : "New budget"} onClick={() => setDialog(null)}>
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-white">{dialog.id ? "Edit Budget" : "New Budget"}</h2>
            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="b-category" className={labelClass}>Category</label>
                <select id="b-category" name="categoryId" value={dialog.form.categoryId} onChange={change} disabled={Boolean(dialog.id)} className={fieldClass}>
                  {(categories.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="b-amount" className={labelClass}>Limit</label>
                <input id="b-amount" type="number" name="amount" min="0.01" step="0.01" value={dialog.form.amount} onChange={change} placeholder="0.00" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="b-period" className={labelClass}>Period</label>
                <select id="b-period" name="period" value={dialog.form.period} onChange={change} className={fieldClass}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label htmlFor="b-start" className={labelClass}>Start date</label>
                <input id="b-start" type="date" name="startDate" value={dialog.form.startDate} onChange={change} className={fieldClass} />
              </div>
              {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setDialog(null)} className={`flex-1 ${secondaryButton}`}>Cancel</button>
                <button type="submit" disabled={busy} className={`flex-1 ${primaryButton}`}>{dialog.id ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
