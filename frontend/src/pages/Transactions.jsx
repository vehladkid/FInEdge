import { useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import TransactionForm from "../components/TransactionForm";
import { Empty, ErrorMessage, fieldClass, Loading, primaryButton, secondaryButton } from "../components/ui/States";
import { useAsync } from "../hooks/useAsync";
import { deleteTransaction, getCategories, getTransactions, updateTransaction } from "../services/finance";
import { formatCurrency } from "../utils/format";

const EMPTY_FILTERS = { type: "", categoryId: "", from: "", to: "" };

export default function Transactions() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState("");
  const categories = useAsync(() => getCategories());
  const list = useAsync(() => getTransactions({ ...filters, page, limit: 10 }), [filters, page]);

  const setFilter = (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const remove = async (t) => {
    setActionError("");
    try {
      await deleteTransaction(t.id);
      list.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const action = (
    <Link to="/add-transaction" className={primaryButton}>+ Add Transaction</Link>
  );

  return (
    <PageShell title="Transactions" action={action}>
      <Card className="mt-6">
        <form className="grid gap-3 sm:grid-cols-4" aria-label="Filters" onSubmit={(e) => e.preventDefault()}>
          <select aria-label="Filter by type" name="type" value={filters.type} onChange={setFilter} className={fieldClass}>
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select aria-label="Filter by category" name="categoryId" value={filters.categoryId} onChange={setFilter} className={fieldClass}>
            <option value="">All categories</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input aria-label="From date" type="date" name="from" value={filters.from} onChange={setFilter} className={fieldClass} />
          <input aria-label="To date" type="date" name="to" value={filters.to} onChange={setFilter} className={fieldClass} />
        </form>
      </Card>

      {list.loading && <Loading />}
      {list.error && <ErrorMessage error={list.error} onRetry={list.reload} />}
      {actionError && <ErrorMessage error={{ message: actionError }} />}

      {list.data && (
        <Card className="mt-6">
          {rows.length === 0 ? (
            <Empty>No transactions found. <Link to="/add-transaction" className="text-indigo-400 hover:text-white">Add your first one.</Link></Empty>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap py-3 pr-4 text-slate-400">{t.date}</td>
                      <td className="py-3 pr-4 text-slate-200">{t.description || "—"}</td>
                      <td className="py-3 pr-4 text-slate-300">{t.categoryName}</td>
                      <td className={`whitespace-nowrap py-3 pr-4 text-right font-medium ${t.type === "income" ? "text-emerald-400" : "text-slate-100"}`}>
                        {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount, 2)}
                      </td>
                      <td className="whitespace-nowrap py-3 text-right">
                        <button onClick={() => setEditing(t)} aria-label={`Edit ${t.description || t.categoryName}`} className="mr-3 text-indigo-400 hover:text-white">Edit</button>
                        <button onClick={() => remove(t)} aria-label={`Delete ${t.description || t.categoryName}`} className="text-rose-400 hover:text-white">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={secondaryButton}>Previous</button>
              <span>Page {meta.page} of {meta.pages}</span>
              <button disabled={page >= meta.pages} onClick={() => setPage(page + 1)} className={secondaryButton}>Next</button>
            </div>
          )}
        </Card>
      )}

      {editing && categories.data && (
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Edit transaction" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-base font-semibold text-white">Edit transaction</h2>
            <TransactionForm
              categories={categories.data}
              initial={editing}
              submitLabel="Update"
              onSubmit={(payload) => updateTransaction(editing.id, payload)}
              onSaved={() => {
                setEditing(null);
                list.reload();
              }}
            />
            <button onClick={() => setEditing(null)} className={`mt-3 w-full ${secondaryButton}`}>Cancel</button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
