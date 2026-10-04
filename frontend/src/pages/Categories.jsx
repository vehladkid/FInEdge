import { useState } from "react";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import { Empty, ErrorMessage, fieldClass, Loading, primaryButton } from "../components/ui/States";
import { useAsync } from "../hooks/useAsync";
import { createCategory, deleteCategory, getCategories, renameCategory } from "../services/finance";

export default function Categories() {
  const { data, error, loading, reload } = useAsync(() => getCategories());
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [renaming, setRenaming] = useState(null); // { id, name }
  const [message, setMessage] = useState({ kind: "", text: "" });

  const run = async (fn) => {
    setMessage({ kind: "", text: "" });
    try {
      await fn();
      reload();
      return true;
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
      return false;
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setMessage({ kind: "error", text: "Enter a category name." });
    if (await run(() => createCategory({ name, type }))) setName("");
  };

  const saveRename = async (e) => {
    e.preventDefault();
    if (await run(() => renameCategory(renaming.id, renaming.name))) setRenaming(null);
  };

  const group = (t) => (data ?? []).filter((c) => c.type === t);

  return (
    <PageShell title="Categories" maxWidth="max-w-4xl">
      <Card className="mt-6">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row" aria-label="New category">
          <input aria-label="Category name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" maxLength={50} className={fieldClass} />
          <select aria-label="Category type" value={type} onChange={(e) => setType(e.target.value)} className={`${fieldClass} sm:w-40`}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button type="submit" className={primaryButton}>Add</button>
        </form>
        {message.text && <p role="alert" className="mt-3 text-sm text-rose-400">{message.text}</p>}
      </Card>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {["expense", "income"].map((t) => (
            <Card key={t}>
              <h2 className="text-base font-semibold capitalize text-white">{t} categories</h2>
              {group(t).length === 0 && <Empty>None yet.</Empty>}
              <ul className="mt-3 divide-y divide-slate-800">
                {group(t).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    {renaming?.id === c.id ? (
                      <form onSubmit={saveRename} className="flex flex-1 gap-2">
                        <input aria-label={`Rename ${c.name}`} autoFocus value={renaming.name} onChange={(e) => setRenaming({ id: c.id, name: e.target.value })} maxLength={50} className={fieldClass} />
                        <button type="submit" className="text-indigo-400 hover:text-white">Save</button>
                        <button type="button" onClick={() => setRenaming(null)} className="text-slate-400 hover:text-white">Cancel</button>
                      </form>
                    ) : (
                      <>
                        <span className="text-slate-200">{c.name}</span>
                        <span className="whitespace-nowrap">
                          <button onClick={() => setRenaming({ id: c.id, name: c.name })} aria-label={`Rename ${c.name}`} className="mr-3 text-indigo-400 hover:text-white">Rename</button>
                          <button onClick={() => run(() => deleteCategory(c.id))} aria-label={`Delete ${c.name}`} className="text-rose-400 hover:text-white">Delete</button>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
