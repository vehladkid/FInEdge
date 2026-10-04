import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageShell from "../layouts/PageShell";
import Card from "../components/ui/Card";
import InsightsCard from "../components/InsightsCard";
import { Empty, ErrorMessage, Loading } from "../components/ui/States";
import { useAsync } from "../hooks/useAsync";
import { axisStyle, barCursor, palette, tooltipStyle } from "../theme";
import { formatCurrency } from "../utils/format";
import { getDashboard } from "../services/finance";

const BAR = { exceeded: "bg-rose-500", warning: "bg-amber-400", ok: "bg-indigo-500" };

export default function Dashboard() {
  const { data, error, loading, reload } = useAsync(() => getDashboard());

  const cards = data && [
    { label: "Total Balance", value: data.balance },
    { label: "Income (Month)", value: data.month.income },
    { label: "Expenses (Month)", value: data.month.expenses },
  ];

  return (
    <PageShell title="Dashboard">
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && (
        <>
          {!data.hasData && (
            <Card className="mt-6">
              <p className="text-sm text-slate-300">
                You have no transactions yet. <Link to="/add-transaction" className="text-indigo-400 hover:text-white">Add your first transaction</Link> to see your balance and insights here.
              </p>
            </Card>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {cards.map((item) => (
              <Card key={item.label}>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white" data-testid={`card-${item.label}`}>{formatCurrency(item.value, 2)}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="text-base font-semibold text-white">Spending by Category (this month)</h2>
              {data.spendingByCategory.length === 0 ? (
                <Empty>No expenses recorded this month.</Empty>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.spendingByCategory}>
                      <XAxis dataKey="name" {...axisStyle} />
                      <YAxis {...axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} cursor={barCursor} />
                      <Bar dataKey="total" fill={palette.brand} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <InsightsCard refreshKey={data} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
              {data.recentTransactions.length === 0 ? (
                <Empty>Nothing here yet.</Empty>
              ) : (
                <ul className="mt-3 divide-y divide-slate-800 text-sm" aria-label="Recent transactions">
                  {data.recentTransactions.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2">
                      <span>
                        <span className="text-slate-200">{t.description || t.categoryName}</span>
                        <span className="ml-2 text-xs text-slate-500">{t.categoryName} · {t.date}</span>
                      </span>
                      <span className={t.type === "income" ? "text-emerald-400" : "text-slate-100"}>
                        {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount, 2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-white">Budget Status</h2>
              {data.budgets.length === 0 ? (
                <Empty>No active budgets. <Link to="/budget" className="text-indigo-400 hover:text-white">Create one.</Link></Empty>
              ) : (
                <ul className="mt-3 space-y-3 text-sm" aria-label="Budget status">
                  {data.budgets.map((b) => (
                    <li key={b.id}>
                      <div className="flex justify-between text-slate-300">
                        <span>{b.category}</span>
                        <span className="text-slate-400">{formatCurrency(b.spent, 2)} / {formatCurrency(b.amount, 2)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full ${BAR[b.status]}`} style={{ width: `${Math.min(b.percentUsed, 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
