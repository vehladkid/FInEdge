import { useState } from "react";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import TransactionForm from "../components/TransactionForm";
import { ErrorMessage, Loading } from "../components/ui/States";
import { useAsync } from "../hooks/useAsync";
import { createTransaction, getCategories } from "../services/finance";

export default function AddTransaction() {
  const { data: categories, error, loading, reload } = useAsync(() => getCategories());
  const [saved, setSaved] = useState(false);

  return (
    <PageShell title="Add Transaction" maxWidth="max-w-xl">
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {categories && (
        <Card className="mt-6">
          {saved && (
            <p role="status" className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              Transaction saved.
            </p>
          )}
          <TransactionForm
            categories={categories}
            onSubmit={(payload) => {
              setSaved(false);
              return createTransaction(payload);
            }}
            onSaved={() => setSaved(true)}
          />
        </Card>
      )}
    </PageShell>
  );
}
